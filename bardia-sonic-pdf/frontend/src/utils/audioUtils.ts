/**
 * Audio Utilities
 * Helper functions for audio file management and playback
 */

import { useCallback, useState, useEffect, useRef } from 'react';

// Reference to the audio context to avoid creating multiple instances
let audioContextRef: { current: AudioContext | null } = { current: null };

// Initialize or retrieve the audio context
const initializeAudioContext = (): void => {
  // If we already have an audio context, use it
  if (audioContextRef.current) {
    return;
  }
  
  // Create a new AudioContext
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioContextRef.current = new AudioContext();
      console.log('AudioContext initialized:', audioContextRef.current.state);
    } else {
      console.warn('AudioContext not supported in this browser');
    }
  } catch (e) {
    console.error('Failed to initialize AudioContext:', e);
  }
};

// Cache to store results of file existence checks to avoid unnecessary network requests
const fileExistenceCache: Record<string, boolean> = {};

// Flag to track if we've shown the interaction warning
let interactionWarningShown = false;

// Cache to store blob URLs for generated audio
const generatedAudioCache: Record<string, string> = {};

/**
 * Helper function to convert a relative asset path to a full URL
 */
const getAssetUrl = (path: string): string => {
  // If the path is already a full URL, return it as is
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  
  // If path starts with a slash, assume it's relative to the public directory
  // Otherwise make sure it has a leading slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Use PUBLIC_URL environment variable if available, or default to current origin
  const baseUrl = process.env.PUBLIC_URL || '';
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Check if an audio file exists in the public directory
 */
const checkAudioFileExists = async (path: string): Promise<boolean> => {
  const fileUrl = getAssetUrl(path);
  return checkFileExists(fileUrl);
};

/**
 * Check if an audio file exists in the public directory
 */
const checkFileExists = async (fileUrl: string): Promise<boolean> => {
  // Check cache first
  if (fileExistenceCache[fileUrl] !== undefined) {
    return fileExistenceCache[fileUrl];
  }
  
  try {
    const response = await fetch(fileUrl, {
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    const exists = response.ok;
    fileExistenceCache[fileUrl] = exists;
    return exists;
  } catch (error) {
    console.error(`Error checking if file ${fileUrl} exists:`, error);
    fileExistenceCache[fileUrl] = false;
    return false;
  }
};

/**
 * Play an audio file with the specified options
 */
interface AudioOptions {
  volume?: number;
  loop?: boolean;
  fallbackToSilent?: boolean;
  onEnded?: () => void;
  onError?: (error: any) => void;
  onStart?: () => void;
}

const playAudio = async (
  src: string, 
  options: AudioOptions = {}
): Promise<HTMLAudioElement | null> => {
  if (!src) {
    console.error('No source provided for audio playback');
    return null;
  }
  
  try {
    // Create a new audio element
    const audio = new Audio();
    
    // Set audio properties
    audio.src = src;
    audio.volume = options.volume !== undefined ? options.volume : 1.0;
    audio.loop = options.loop !== undefined ? options.loop : false;
    
    // Event handlers
    if (options.onEnded) {
      audio.onended = options.onEnded;
    }
    
    if (options.onError) {
      audio.onerror = (e) => options.onError!(e);
    }
    
    // Add onStart handler using the canplaythrough event
    if (options.onStart) {
      audio.addEventListener('canplaythrough', options.onStart, { once: true });
    }
    
    // Force audio context to be active if needed
    if (audioContextRef.current) {
      try {
        // Always try to resume - this is safe even if already running
        await audioContextRef.current.resume();
      } catch (e) {
        console.warn('Could not resume audio context:', e);
      }
    }
    
    // Attempt to play the audio
    try {
      await audio.play();
      return audio;
    } catch (error) {
      console.error('Error playing audio:', error);
      
      // Try again with user interaction if possible
      if (options.onError) {
        options.onError(error);
      }
      
      return null;
    }
  } catch (e) {
    console.error('Error setting up audio:', e);
    if (options.onError) {
      options.onError(e);
    }
    return null;
  }
};

/**
 * Stop audio playback
 */
const stopAudio = (audio: HTMLAudioElement | null): void => {
  if (!audio) return;
  
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (e) {
    console.error('Error stopping audio:', e);
  }
};

/**
 * Create a generated audio file using the Web Audio API
 */
const createDummyAudioFile = async (
  name: string, 
  duration = 1,
  type: 'music' | 'effect' | 'generic' = 'generic'
): Promise<string> => {
  return createGeneratedAudio(name, type, duration);
};

/**
 * Create a generated audio file using the Web Audio API
 */
const createGeneratedAudio = async (
  name: string, 
  type: 'music' | 'effect' | 'generic' = 'generic',
  duration = 1
): Promise<string> => {
  if (!audioContextRef.current) {
    initializeAudioContext();
  }
  
  if (!audioContextRef.current) {
    throw new Error('AudioContext could not be initialized');
  }
  
  // Create a buffer
  const sampleRate = audioContextRef.current.sampleRate;
  const buffer = audioContextRef.current.createBuffer(2, sampleRate * duration, sampleRate);
  
  // Fill with random data
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    
    if (type === 'music') {
      // Sine wave for music
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin(i * 0.01) * 0.5;
      }
    } else if (type === 'effect') {
      // Short effect sound
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        data[i] = Math.sin(1000 * t * (1 + t)) * Math.exp(-3 * t) * 0.3;
      }
    } else {
      // Generic white noise
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.1;
      }
    }
  }
  
  // Create a wav file from the buffer
  const offlineContext = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineContext.destination);
  source.start();
  
  const renderedBuffer = await offlineContext.startRendering();
  
  // Convert buffer to WAV
  const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
  
  // Create object URL
  return URL.createObjectURL(wavBlob);
};

/**
 * Convert an AudioBuffer to a WAV Blob
 */
const bufferToWave = (buffer: AudioBuffer, len: number): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const view = new DataView(new ArrayBuffer(length));
  
  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, length - 8, true);
  writeString(view, 8, 'WAVE');
  
  // FMT sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // subchunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numOfChan, true); // num of channels
  view.setUint32(24, buffer.sampleRate, true); // sample rate
  view.setUint32(28, buffer.sampleRate * numOfChan * 2, true); // byte rate
  view.setUint16(32, numOfChan * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  
  // Data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, length - 44, true);
  
  // Write the data
  let offset = 44;
      for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, value, true);
      offset += 2;
    }
  }
  
  return new Blob([view], { type: 'audio/wav' });
};

/**
 * Helper function to write a string to a DataView
 */
const writeString = (view: DataView, offset: number, string: string): void => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

/**
 * Check if the browser can autoplay audio without user interaction
 */
const canAutoplayAudio = async (): Promise<boolean> => {
  try {
    // Create a test audio element
    const audio = new Audio();
    audio.volume = 0;
    
    // A very short data URI of a silent audio file
    audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1TSU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAASAth9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    
    // Try to play it
    const playPromise = audio.play();
    
    if (playPromise) {
      const result = await playPromise
        .then(() => {
          audio.pause();
          return true;
        })
        .catch(() => {
          return false;
        });
      
      return result;
    }
    
    return false;
  } catch (e) {
    console.warn('Error testing autoplay capability:', e);
    return false;
  }
};

/**
 * Set up an event handler to unlock audio context on user interaction
 */
const setupAudioInteractionHandler = (): void => {
  // User gestures that can unlock audio
  const interactionEvents = [
    'click', 'touchstart', 'touchend', 'mousedown', 'keydown', 'scroll'
  ];
  
  const unlockAudio = () => {
    // Try to resume audio context if it exists
    if (audioContextRef.current) {
      audioContextRef.current.resume().catch(err => {
        console.warn('Failed to resume audio context:', err);
      });
    }
    
    // Play a silent sound to unlock audio
    const silentSound = new Audio();
    silentSound.volume = 0.01;
    silentSound.src = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1TSU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAASAth9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    silentSound.play().catch(() => {});
    
    // Remove event listeners after first interaction
    interactionEvents.forEach(eventName => {
      document.removeEventListener(eventName, unlockAudio, true);
    });
    
    console.log('Audio unlocked by user interaction');
  };
  
  // Add event listeners for all interaction events
  interactionEvents.forEach(eventName => {
    document.addEventListener(eventName, unlockAudio, true);
  });
  
  console.log('Audio interaction handlers set up');
};

// Helper function to play a silent buffer (to help unlock audio context)
const playSilentBuffer = async (buffer: AudioBuffer): Promise<void> => {
  if (!audioContextRef.current) return;
  
  try {
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
    source.stop(audioContextRef.current.currentTime + 0.1);
    console.log('Played silent buffer to unlock audio context');
    
    // Wait a moment to let the operation complete
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (e) {
    console.warn('Error playing silent buffer:', e);
  }
};

// Enhanced function to force the audio context to be unlocked
const forceAudioContext = async (): Promise<boolean> => {
  try {
    // Make sure we have a valid audio context
    if (!audioContextRef.current) {
      initializeAudioContext();
    }

    // If audio context is already running, we're good
    const audioCtx = audioContextRef.current;
    if (!audioCtx) {
      console.warn('Audio context could not be initialized');
      return false;
    }

    // Create a short silent buffer
    const silenceBuffer = createSilentBuffer(0.1); // 100ms of silence

    // Try to resume the audio context - multiple attempts for reliability
    if ((audioCtx.state as string) !== 'running') {
      // First attempt
      try {
        await audioCtx.resume();
        console.log('Successfully resumed audio context on first attempt');
      } catch (e) {
        console.warn('First resume attempt failed:', e);
      }

      // Check if it worked
      if ((audioCtx.state as string) !== 'running') {
        // Second attempt - play silent buffer to trigger user gesture requirement
        await playSilentBuffer(silenceBuffer);
        
        // Try resuming again after playing the buffer
        try {
          await audioCtx.resume();
        } catch (e) {
          console.warn('Second resume attempt failed:', e);
        }
      }
    }

    // Final check - if still not running, one more attempt
    if ((audioCtx.state as string) !== 'running') {
      try {
        // Third attempt with a bit of delay
        await new Promise(resolve => setTimeout(resolve, 500));
        await audioCtx.resume();
      } catch (e) {
        console.warn('Final resume attempt failed:', e);
      }
    }

    // Check final state
    const isRunning = (audioCtx.state as string) === 'running';
    console.log(`Audio context final state: ${audioCtx.state}, returning ${isRunning}`);
    return isRunning;
  } catch (e) {
    console.error('Error in forceAudioContext:', e);
    return false;
  }
};

// Create a silent audio buffer
const createSilentBuffer = (durationSec: number): AudioBuffer => {
  if (!audioContextRef.current) {
    initializeAudioContext();
  }
  
  // Ensure we have an audio context
  if (!audioContextRef.current) {
    throw new Error('Could not initialize audio context');
  }
  
  const ctx = audioContextRef.current;
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, durationSec * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);
  
  // Fill with silence (zeros)
  for (let i = 0; i < data.length; i++) {
    data[i] = 0;
  }
  
  return buffer;
};

// Additional utility to check and set up speech synthesis
const setupSpeechSynthesis = async (): Promise<boolean> => {
  if (!('speechSynthesis' in window)) {
    console.error('Speech synthesis not supported in this browser');
    return false;
  }
  
  try {
    // Wait for voices to be loaded
    if (window.speechSynthesis.getVoices().length === 0) {
      await new Promise<void>((resolve) => {
        const voicesChangedHandler = () => {
          window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
          resolve();
        };
        
        window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);
        
        // Safety timeout
        setTimeout(() => {
          window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
          resolve();
        }, 2000);
      });
    }
    
    // Check if we have any voices available
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      console.warn('No voices available for speech synthesis');
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Error setting up speech synthesis:', e);
    return false;
  }
};

// Speech synthesis pause/resume fix for Chrome
// Chrome has a bug where it pauses speech after ~15 seconds if the page is in background
const keepSpeechAlive = (): (() => void) => {
  if (!('speechSynthesis' in window)) {
    return () => {}; // No-op cleanup function
  }
  
  // Chrome pauses speech synthesis after about 15 seconds when the page is in background
  // This interval keeps it running by periodically restarting it
  const interval = setInterval(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000); // Every 10 seconds
  
  // Return cleanup function
  return () => clearInterval(interval);
};

// Update forceAudioButtonClick function to use the updated utilities
const forceAudioButtonClick = async (onSuccess: () => void): Promise<void> => {
  try {
    // Force audio context to unlock
    const audioInitialized = await forceAudioContext();
    
    if (!audioInitialized) {
      console.warn("Audio context could not be initialized, but continuing anyway");
    }
    
    // Create and play a test sound to verify audio is working
    try {
      const generatedUrl = await createGeneratedAudio('test-tone', 'effect', 0.3);
      const testAudio = new Audio(generatedUrl);
      testAudio.volume = 0.1;
      
      await testAudio.play();
      console.log('Test audio started successfully!');
      onSuccess();
    } catch (err) {
      console.error('Test audio failed:', err);
      // Attempt speech directly even if audio test fails
      onSuccess();
    }
  } catch (e) {
    console.error('Error in force audio button click:', e);
    // Call success handler anyway as a fallback
    onSuccess();
  }
};

// The exported audioUtils object containing all utility functions
export const audioUtils = {
  checkFileExists,
  createGeneratedAudio,
  forceAudioContext,
  setupSpeechSynthesis,
  keepSpeechAlive,
  forceAudioButtonClick,
  // Add the previously re-exported functions
  getAssetUrl,
  playAudio,
  stopAudio,
  checkAudioFileExists,
  createDummyAudioFile,
  // New functions
  canAutoplayAudio,
  setupAudioInteractionHandler
}; 