import { useEffect, useRef, useState, useCallback } from 'react';

// Optimized face detection with performance improvements
export const useFaceDetection = (videoElement: HTMLVideoElement | null) => {
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [gazeWarnings, setGazeWarnings] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastWarningTimeRef = useRef(0);
  const lookingAwayStartRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const incrementWarning = useCallback(() => {
    const now = Date.now();
    // Prevent duplicate warnings within 3 seconds
    if (now - lastWarningTimeRef.current > 3000) {
      setGazeWarnings(prev => prev + 1);
      lastWarningTimeRef.current = now;
    }
  }, []);

  // Optimized pixel processing using typed arrays
  const analyzeBrightness = useCallback((data: Uint8ClampedArray, width: number, height: number) => {
    let brightPixels = 0;
    let centerBrightPixels = 0;
    
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const checkRadius = 40; // Reduced for better performance
    
    // Pre-calculate bounds
    const centerStartX = Math.max(0, centerX - checkRadius);
    const centerEndX = Math.min(width, centerX + checkRadius);
    const centerStartY = Math.max(0, centerY - checkRadius);
    const centerEndY = Math.min(height, centerY + checkRadius);
    
    // Single pass with optimized loops
    for (let y = 0; y < height; y += 2) { // Skip every other row for performance
      for (let x = 0; x < width; x += 2) { // Skip every other column
        const index = (y * width + x) * 4;
        const brightness = (data[index] + data[index + 1] + data[index + 2]) * 0.333; // Faster than division
        
        if (brightness > 80) brightPixels++;
        
        // Check if pixel is in center region
        if (x >= centerStartX && x < centerEndX && y >= centerStartY && y < centerEndY) {
          if (brightness > 100) centerBrightPixels++;
        }
      }
    }
    
    const sampledPixels = (width * height) / 4; // We sample every 4th pixel
    const centerPixels = (checkRadius * 2) * (checkRadius * 2) / 4;
    
    return {
      faceDetected: (brightPixels / sampledPixels > 0.15) && (centerBrightPixels / centerPixels > 0.12)
    };
  }, []);

  const detectFace = useCallback(() => {
    if (!videoElement || !canvasRef.current || !ctxRef.current || videoElement.videoWidth === 0) {
      return;
    }

    try {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const { faceDetected } = analyzeBrightness(imageData.data, canvas.width, canvas.height);
      const now = Date.now();
      
      if (!faceDetected) {
        if (!isLookingAway) {
          setIsLookingAway(true);
          lookingAwayStartRef.current = now;
        }
        // Trigger warning after 2 seconds of looking away
        if (now - lookingAwayStartRef.current > 2000) {
          incrementWarning();
        }
      } else {
        if (isLookingAway) {
          setIsLookingAway(false);
          lookingAwayStartRef.current = 0;
        }
      }
    } catch (error) {
      console.warn('Face detection error:', error);
    }

    // Use requestAnimationFrame for smooth processing, but throttle to ~2 FPS
    setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(detectFace);
    }, 500);
  }, [videoElement, isLookingAway, incrementWarning, analyzeBrightness]);

  useEffect(() => {
    if (!videoElement) return;

    // Initialize canvas once
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true }); // Performance optimizations
      if (!ctx) return;

      canvas.width = 160; // Further reduced resolution for maximum performance
      canvas.height = 120;
      canvasRef.current = canvas;
      ctxRef.current = ctx;
    }

    // Start detection loop
    animationFrameRef.current = requestAnimationFrame(detectFace);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoElement, detectFace]);

  return { isLookingAway, gazeWarnings, setGazeWarnings };
};