import { useEffect, useRef, useState, useCallback } from 'react';

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptPartsRef = useRef<string[]>([]); // Optimized transcript building
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced transcript update for better performance
  const updateTranscript = useCallback((newParts: string[]) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      const fullTranscript = newParts.join(' ').trim();
      // Prevent memory issues with very long transcripts
      if (fullTranscript.length > 5000) {
        const trimmedTranscript = fullTranscript.substring(fullTranscript.length - 4000);
        setTranscript(trimmedTranscript);
        transcriptPartsRef.current = [trimmedTranscript];
      } else {
        setTranscript(fullTranscript);
      }
    }, 100); // Debounce updates by 100ms
  }, []);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

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

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcriptParts = [...transcriptPartsRef.current];
        let hasNewFinalResult = false;

        // Optimized result processing
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript.trim();
          
          if (result.isFinal && transcript) {
            transcriptParts[i] = transcript;
            hasNewFinalResult = true;
          } else if (!result.isFinal && transcript) {
            // Update interim result
            transcriptParts[i] = transcript;
          }
        }

        if (hasNewFinalResult || event.results.length > 0) {
          transcriptPartsRef.current = transcriptParts;
          updateTranscript(transcriptParts);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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