import { useEffect, useRef, useState, useCallback } from 'react';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptPartsRef = useRef([]); // Optimized transcript building
  const updateTimeoutRef = useRef(null);

  // Ultra-optimized transcript update with smart batching
  const updateTranscript = useCallback((newParts) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      // Use efficient array join with pre-allocated string builder approach
      let fullTranscript = '';
      for (let i = 0; i < newParts.length; i++) {
        if (newParts[i]) {
          fullTranscript += (i > 0 ? ' ' : '') + newParts[i];
        }
      }
      
      fullTranscript = fullTranscript.trim();
      
      // Smart memory management with exponential reduction
      if (fullTranscript.length > 8000) {
        const keepLength = 6000;
        const truncateFrom = Math.floor((fullTranscript.length - keepLength) / 2);
        fullTranscript = fullTranscript.substring(0, truncateFrom) + 
                        "..." + 
                        fullTranscript.substring(fullTranscript.length - keepLength + truncateFrom);
        transcriptPartsRef.current = [fullTranscript];
      }
      
      setTranscript(fullTranscript);
    }, 50); // Reduced debounce for more responsive UI
  }, []);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = 
      window.SpeechRecognition || 
      window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1; // Reduce processing overhead
      
      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcriptParts = transcriptPartsRef.current;
        let hasUpdate = false;
        let processedResults = 0;

        // Ultra-optimized batch processing with early termination
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          
          if (!result[0]) continue; // Skip empty results
          
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 1;
          
          // Only process high-confidence results to reduce noise
          if (confidence < 0.7 && !result.isFinal) continue;
          
          const trimmedTranscript = transcript.trim();
          
          if (result.isFinal && trimmedTranscript) {
            transcriptParts[i] = trimmedTranscript;
            hasUpdate = true;
            processedResults++;
          } else if (!result.isFinal && trimmedTranscript && i === event.results.length - 1) {
            // Only update interim result for the latest partial result
            transcriptParts[i] = trimmedTranscript;
            hasUpdate = true;
          }
        }

        // Batch update to prevent excessive re-renders
        if (hasUpdate) {
          updateTranscript(transcriptParts);
          
          // Performance logging for optimization
          if (processedResults > 0) {
            console.debug(`Processed ${processedResults} speech results`);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Auto-restart on certain errors for better reliability
        if (event.error === 'network' || event.error === 'audio-capture') {
          setTimeout(() => {
            if (recognitionRef.current && !isListening) {
              try {
                recognitionRef.current.start();
              } catch (err) {
                console.warn('Failed to restart recognition:', err);
              }
            }
          }, 1000);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Speech recognition not supported in this browser');
    }

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [updateTranscript]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const resetTranscript = () => {
    setTranscript('');
  };

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  };
};