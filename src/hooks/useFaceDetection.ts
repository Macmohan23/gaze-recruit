import { useEffect, useRef, useState, useCallback } from 'react';

export const useFaceDetection = (videoElement: HTMLVideoElement | null) => {
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [gazeWarnings, setGazeWarnings] = useState(0);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastWarningTimeRef = useRef(0);
  const lookingAwayStartRef = useRef(0);

  const incrementWarning = useCallback(() => {
    const now = Date.now();
    // Prevent duplicate warnings within 3 seconds
    if (now - lastWarningTimeRef.current > 3000) {
      setGazeWarnings(prev => prev + 1);
      lastWarningTimeRef.current = now;
    }
  }, []);

  useEffect(() => {
    if (!videoElement) return;

    const initFaceDetection = async () => {
      try {
        // Use a lighter, faster approach with built-in browser APIs
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 320; // Reduced resolution for faster processing
        canvas.height = 240;

        // Start face detection loop with higher frequency
        detectionIntervalRef.current = setInterval(() => {
          if (videoElement && videoElement.videoWidth > 0) {
            try {
              ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              // Simple brightness-based face detection (faster than ML models)
              const data = imageData.data;
              let brightPixels = 0;
              let centerBrightPixels = 0;
              
              // Check center region for face presence
              const centerX = canvas.width / 2;
              const centerY = canvas.height / 2;
              const checkRadius = 60;
              
              for (let y = centerY - checkRadius; y < centerY + checkRadius; y++) {
                for (let x = centerX - checkRadius; x < centerX + checkRadius; x++) {
                  if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                    const index = (y * canvas.width + x) * 4;
                    const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
                    if (brightness > 100) centerBrightPixels++;
                  }
                }
              }

              // Overall brightness check
              for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                if (brightness > 80) brightPixels++;
              }

              // Determine if face is present and centered
              const totalPixels = (canvas.width * canvas.height) / 4;
              const centerPixels = (checkRadius * 2) * (checkRadius * 2);
              const faceDetected = (brightPixels / totalPixels > 0.2) && (centerBrightPixels / centerPixels > 0.15);

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
          }
        }, 500); // Check twice per second for better responsiveness

      } catch (error) {
        console.warn('Failed to initialize face detection:', error);
      }
    };

    initFaceDetection();

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [videoElement, isLookingAway, incrementWarning]);

  return { isLookingAway, gazeWarnings, setGazeWarnings };
};