import { useState, useEffect, useRef, useCallback } from 'react';

export const useWakeWord = (wakeWord = 'jarvis', onWakeWord) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')
          .toLowerCase();
        
        // Check for wake word variations
        const wakeWords = ['jarvis', 'hey jarvis', 'ok jarvis', 'hello jarvis'];
        const detected = wakeWords.some(word => transcript.includes(word));
        
        if (detected && onWakeWord) {
          // Extract command after wake word
          let command = '';
          for (const word of wakeWords) {
            if (transcript.includes(word)) {
              const parts = transcript.split(word);
              command = parts[parts.length - 1].trim();
              break;
            }
          }
          onWakeWord(command);
        }
      };
      
      recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
          // This is normal, just continue listening
          return;
        }
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        // Restart if still supposed to be listening
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Ignore already started errors
          }
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [wakeWord, onWakeWord, isListening]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (e) {
        setError('Failed to start wake word detection');
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (e) {
        // Ignore
      }
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
};

export default useWakeWord;
