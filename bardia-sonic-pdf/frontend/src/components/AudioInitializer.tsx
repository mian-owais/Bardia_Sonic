import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { audioUtils } from '../utils';

interface AudioInitializerProps {
  onComplete?: () => void;
}

/**
 * Component to help initialize audio playback
 * Shows a modal with a button to explicitly request user interaction
 * This helps overcome browser autoplay restrictions
 */
const AudioInitializer: React.FC<AudioInitializerProps> = ({ onComplete }) => {
  const [showModal, setShowModal] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [initFailed, setInitFailed] = useState(false);
  
  // Add escape key handler to dismiss the dialog
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal) {
        console.log('Audio initialization dialog dismissed via ESC key');
        handleDismiss();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [showModal]);
  
  // Try to detect if we're in a browser that requires interaction
  useEffect(() => {
    const checkAutoplay = async () => {
      try {
        const canAutoplay = await audioUtils.canAutoplayAudio();
        if (!canAutoplay) {
          // If we can't autoplay, show the modal
          setShowModal(true);
        } else {
          // If we can autoplay, mark as initialized
          setInitialized(true);
          if (onComplete) onComplete();
        }
      } catch (error) {
        console.error("Error checking autoplay capability:", error);
        // Show modal as fallback in case of error
        setShowModal(true);
      }
    };
    
    checkAutoplay();
  }, [onComplete]);
  
  const handleInitialize = async () => {
    try {
      // Force audio context to start - this returns a boolean now
      const success = await audioUtils.forceAudioContext();
      
      // Mark as initialized and hide modal
      console.log('Audio initialization attempted, success:', success);
      setInitialized(true);
      setShowModal(false);
      
      if (!success) {
        setInitFailed(true);
        console.warn('Audio initialization partially failed, but continuing');
      }
      
      // Now that we have user interaction, play a test sound
      try {
        const testAudioUrl = await audioUtils.createGeneratedAudio('test', 'generic', 0.5);
        if (testAudioUrl) {
          const audio = new Audio(testAudioUrl);
          audio.volume = 0.2;
          await audio.play().catch(err => console.warn('Test sound failed, but continuing:', err));
        }
      } catch (soundError) {
        console.warn('Test sound generation failed, but continuing:', soundError);
        // Continue even if test sound fails
      }
      
      // Also test speech synthesis
      try {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance('Audio system initialized');
          utterance.volume = 0.5;
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      } catch (speechError) {
        console.warn('Speech synthesis test failed, but continuing:', speechError);
        // Continue even if speech synthesis fails
      }
      
      // Call the completion callback
      if (onComplete) onComplete();
      
    } catch (error) {
      console.error('Error in audio initialization:', error);
      // Even if there's an error, we should close the modal and continue
      // Many browsers will unblock audio after user interaction even if there's an error
      setInitialized(true);
      setInitFailed(true);
      setShowModal(false);
      if (onComplete) onComplete();
    }
  };
  
  // Handle dismissal without initialization
  const handleDismiss = () => {
    console.log('Audio initialization dialog dismissed by user');
    setShowModal(false);
    setInitialized(true);
    setInitFailed(true);
    if (onComplete) onComplete();
  };
  
  return (
    <>
      {/* Audio Initialization Modal */}
      <Modal 
        show={showModal} 
        centered
        backdrop="static"
        keyboard={true}
        onHide={handleDismiss}
      >
        <Modal.Header>
          <Modal.Title>Enable Audio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            This application uses audio and speech features which require your permission.
          </p>
          <p>
            Please click the button below to enable audio features:
          </p>
          <div className="d-grid mb-3">
            <Button 
              variant="primary" 
              size="lg" 
              onClick={handleInitialize}
              data-testid="enable-audio-button"
            >
              <i className="fas fa-volume-up me-2"></i>
              Enable Audio & Speech
            </Button>
          </div>
          <div className="text-center">
            <Button 
              variant="link" 
              size="sm" 
              onClick={handleDismiss}
              className="text-muted"
            >
              Continue without audio
            </Button>
          </div>
          <p className="text-muted mt-3 small">
            <i className="fas fa-info-circle me-1"></i>
            Due to browser security policies, audio features require direct user interaction.
            Press ESC to dismiss this dialog if you don't want to use audio features.
          </p>
        </Modal.Body>
      </Modal>
      
      {/* Status indicator */}
      {initialized && (
        <div className="audio-status">
          <span className={`badge ${initFailed ? 'bg-warning text-dark' : 'bg-success'}`}>
            <i className={`fas ${initFailed ? 'fa-exclamation-triangle' : 'fa-check'} me-1`}></i>
            {initFailed ? 'Limited Audio' : 'Audio Ready'}
          </span>
        </div>
      )}
    </>
  );
};

export default AudioInitializer; 