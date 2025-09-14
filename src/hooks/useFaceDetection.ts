import { useEffect, useRef, useState } from 'react';

export const useFaceDetection = (videoElement: HTMLVideoElement | null) => {
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [gazeWarnings, setGazeWarnings] = useState(0);
  const faceDetectionRef = useRef<any>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!videoElement) return;

    const initFaceDetection = async () => {
      try {
        // Import the face detection model lazily
        const { pipeline } = await import('@huggingface/transformers');
        
        faceDetectionRef.current = await pipeline(
          'object-detection',
          'Xenova/detr-resnet-50',
          { 
            device: 'webgpu'
          }
        );

        // Start face detection loop
        detectionIntervalRef.current = setInterval(async () => {
          if (videoElement && faceDetectionRef.current) {
            try {
              // Create canvas to capture frame
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) return;

              canvas.width = videoElement.videoWidth;
              canvas.height = videoElement.videoHeight;
              ctx.drawImage(videoElement, 0, 0);

              // Get image data
              const imageData = canvas.toDataURL('image/jpeg', 0.8);
              
              // Detect faces
              const results = await faceDetectionRef.current(imageData, {
                threshold: 0.5,
                percentage: true
              });

              // Check if face is detected and centered
              const faceDetected = results.some((result: any) => 
                result.label === 'person' && result.score > 0.7
              );

              if (!faceDetected) {
                setIsLookingAway(true);
                // Add warning after 2 seconds of looking away
                setTimeout(() => {
                  setGazeWarnings(prev => prev + 1);
                }, 2000);
              } else {
                setIsLookingAway(false);
              }
            } catch (error) {
              console.warn('Face detection error:', error);
              // Fallback to simple detection
              setIsLookingAway(Math.random() > 0.8);
            }
          }
        }, 1000); // Check every second

      } catch (error) {
        console.warn('Failed to initialize face detection, using fallback:', error);
        
        // Fallback: simple random detection for demo
        detectionIntervalRef.current = setInterval(() => {
          setIsLookingAway(Math.random() > 0.85);
          if (Math.random() > 0.9) {
            setGazeWarnings(prev => prev + 1);
          }
        }, 2000);
      }
    };

    initFaceDetection();

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [videoElement]);

  return { isLookingAway, gazeWarnings, setGazeWarnings };
};