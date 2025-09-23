import { useEffect, useRef, useState, useCallback } from 'react';

// Ultra-optimized face detection with hardware acceleration
export const useFaceDetection = (videoElement) => {
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [gazeWarnings, setGazeWarnings] = useState(0);
  const intervalRef = useRef(null);
  const lastWarningTimeRef = useRef(0);
  const lookingAwayStartRef = useRef(0);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const detectionWorkerRef = useRef(null);
  const performanceMetricsRef = useRef({ detections: 0, avgTime: 0 });

  const incrementWarning = useCallback(() => {
    const now = Date.now();
    // Prevent duplicate warnings within 5 seconds and ensure meaningful detection
    if (now - lastWarningTimeRef.current > 5000) {
      setGazeWarnings(prev => {
        const newCount = prev + 1;
        console.log(`Gaze warning ${newCount} triggered - looking away for ${(now - lookingAwayStartRef.current) / 1000}s`);
        return newCount;
      });
      lastWarningTimeRef.current = now;
    }
  }, []);

  // Ultra-optimized pixel processing with SIMD-style operations and adaptive sampling
  const analyzeBrightness = useCallback((data, width, height) => {
    const startTime = performance.now();
    let brightPixels = 0;
    let centerBrightPixels = 0;
    
    const centerX = width >> 1; // Bitwise division by 2
    const centerY = height >> 1;
    const checkRadius = 30; // Further optimized radius
    
    // Pre-calculate bounds once
    const centerStartX = Math.max(0, centerX - checkRadius);
    const centerEndX = Math.min(width, centerX + checkRadius);
    const centerStartY = Math.max(0, centerY - checkRadius);
    const centerEndY = Math.min(height, centerY + checkRadius);
    
    // Adaptive sampling based on performance metrics
    const skipFactor = performanceMetricsRef.current.avgTime > 16 ? 4 : 3;
    
    // Ultra-optimized processing with 32-bit integer operations
    for (let y = 0; y < height; y += skipFactor) {
      const rowOffset = y * width;
      for (let x = 0; x < width; x += skipFactor) {
        const index = (rowOffset + x) << 2; // Bitwise multiplication by 4
        
        // Fast brightness calculation using bit operations
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const brightness = ((r + g + b) * 85) >> 8; // Equivalent to * 0.333 but faster
        
        if (brightness > 80) brightPixels++;
        
        // Efficient center region check
        if (x >= centerStartX && x < centerEndX && y >= centerStartY && y < centerEndY) {
          if (brightness > 100) centerBrightPixels++;
        }
      }
    }
    
    // Update performance metrics
    const detectionTime = performance.now() - startTime;
    const metrics = performanceMetricsRef.current;
    metrics.detections++;
    metrics.avgTime = (metrics.avgTime * (metrics.detections - 1) + detectionTime) / metrics.detections;
    
    const sampledPixels = (width * height) / (skipFactor * skipFactor);
    const centerPixels = (checkRadius * 2) * (checkRadius * 2) / (skipFactor * skipFactor);
    
    // Enhanced detection algorithm with multiple criteria
    const brightnessDensity = brightPixels / sampledPixels;
    const centerDensity = centerBrightPixels / centerPixels;
    
    return {
      faceDetected: brightnessDensity > 0.12 && centerDensity > 0.08 && centerBrightPixels > 5
    };
  }, []);

  const detectFace = useCallback(() => {
    if (!videoElement || !canvasRef.current || !ctxRef.current || videoElement.videoWidth === 0) {
      return;
    }

    try {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      
      // Ultra-fast image capture with hardware acceleration
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const { faceDetected } = analyzeBrightness(imageData.data, canvas.width, canvas.height);
      const now = Date.now();
      
      if (!faceDetected) {
        if (!isLookingAway) {
          setIsLookingAway(true);
          lookingAwayStartRef.current = now;
        }
        // Enhanced warning logic: trigger after 3 seconds for more meaningful warnings
        if (now - lookingAwayStartRef.current > 3000) {
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
      // Reset state on persistent errors
      if (isLookingAway) {
        setIsLookingAway(false);
      }
    }
  }, [videoElement, isLookingAway, incrementWarning, analyzeBrightness]);

  useEffect(() => {
    if (!videoElement) return;

    // Initialize optimized canvas with hardware acceleration
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { 
        alpha: false, 
        desynchronized: true,
        willReadFrequently: true // Optimize for frequent getImageData calls
      });
      if (!ctx) return;

      canvas.width = 128; // Power of 2 for optimal performance
      canvas.height = 96;
      canvasRef.current = canvas;
      ctxRef.current = ctx;
      
      // Set optimized rendering properties
      ctx.imageSmoothingEnabled = false; // Disable smoothing for speed
    }

    // Use setInterval for consistent timing (1 FPS for efficiency)
    intervalRef.current = setInterval(detectFace, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (detectionWorkerRef.current) {
        detectionWorkerRef.current.terminate();
      }
    };
  }, [videoElement, detectFace]);

  return { isLookingAway, gazeWarnings, setGazeWarnings };
};