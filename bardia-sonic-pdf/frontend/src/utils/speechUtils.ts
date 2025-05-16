/**
 * Speech Synthesis Utility
 * Provides a robust wrapper around the Web Speech API with:
 * - Chunking for long texts
 * - Error recovery
 * - Event handling
 * - Browser compatibility checks
 */

// Maximum text length to send to speech synthesis at once
const MAX_CHUNK_LENGTH = 150; // Characters per chunk - reduced for better stability

// Interface for speech options
export interface SpeechOptions {
  rate?: number;       // Speech rate (0.1 to 10)
  pitch?: number;      // Speech pitch (0 to 2)
  volume?: number;     // Speech volume (0 to 1)
  voiceName?: string;  // Preferred voice name
  voiceLang?: string;  // Preferred voice language
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  onPause?: () => void;
  onResume?: () => void;
  onBoundary?: (event: SpeechSynthesisEvent) => void;
}

// Class to manage speech synthesis
export class SpeechSynthesisManager {
  private utterance: SpeechSynthesisUtterance | null = null;
  private chunks: string[] = [];
  private currentChunkIndex = 0;
  private isSpeaking = false;
  private isPaused = false;
  private options: SpeechOptions = {};
  private retryCount = 0;
  private maxRetries = 3;
  private voicesLoaded = false;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private watchdogTimer: number | null = null;

  constructor() {
    this.initVoices();
    this.setupWatchdog();
  }

  /**
   * Initialize available voices and set up voice changed event
   */
  private initVoices(): void {
    if (!this.isSpeechSupported()) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    // Load available voices
    const loadVoices = () => {
      this.availableVoices = window.speechSynthesis.getVoices();
      if (this.availableVoices && this.availableVoices.length > 0) {
        this.voicesLoaded = true;
        console.log(`Speech synthesis voices loaded: ${this.availableVoices.length}`);
      }
    };

    // Check if voices are already available
    loadVoices();

    // Chrome and other browsers may load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Chrome has a bug where it pauses speech synthesis when a tab loses focus.
   * This watchdog periodically checks if speech has unexpectedly paused and restarts it.
   */
  private setupWatchdog(): void {
    if (!this.isSpeechSupported()) return;

    // Clear any existing watchdog
    if (this.watchdogTimer !== null) {
      window.clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    // Create a new watchdog timer
    this.watchdogTimer = window.setInterval(() => {
      if (this.isSpeaking && !this.isPaused && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        // Speech has stopped unexpectedly, try to resume
        console.log('Watchdog detected speech has stopped unexpectedly, restarting...');
        this.speakNextChunk();
      }
    }, 1000);
  }

  /**
   * Check if speech synthesis is supported
   */
  public isSpeechSupported(): boolean {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  /**
   * Get all available voices
   */
  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.voicesLoaded) {
      this.availableVoices = window.speechSynthesis.getVoices();
    }
    return this.availableVoices;
  }

  /**
   * Find the best voice based on preferences
   */
  private findBestVoice(options: SpeechOptions): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (!voices || voices.length === 0) return null;

    // Try to find by exact name match
    if (options.voiceName) {
      const exactMatch = voices.find(voice => 
        voice.name.toLowerCase() === options.voiceName?.toLowerCase());
      if (exactMatch) return exactMatch;
    }

    // Try to find by language
    if (options.voiceLang) {
      const langMatch = voices.find(voice => 
        voice.lang.toLowerCase().includes(options.voiceLang?.toLowerCase() || ''));
      if (langMatch) return langMatch;
    }

    // Try to find a good quality voice (premium voices typically include these keywords)
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('Natural') || 
      voice.name.includes('Premium') ||
      // Add common high-quality voices
      voice.name.includes('David') ||
      voice.name.includes('Samantha') ||
      voice.name.includes('Zira')
    );
    
    if (preferredVoice) return preferredVoice;

    // Default to first voice
    return voices[0];
  }

  /**
   * Split text into manageable chunks
   * Improved to handle punctuation and paragraph breaks better
   */
  private splitIntoChunks(text: string): string[] {
    // First trim the text and replace multiple spaces
    const trimmedText = text.trim().replace(/\s+/g, ' ');
    
    // Check if the text is already short enough
    if (trimmedText.length <= MAX_CHUNK_LENGTH) {
      return [trimmedText];
    }
    
    // Split by paragraph breaks first
    const paragraphs = trimmedText.split(/(?:\r?\n){2,}/);
    const chunks: string[] = [];
    
    // Process each paragraph
    for (const paragraph of paragraphs) {
      // If a paragraph is small enough, add it directly
      if (paragraph.length <= MAX_CHUNK_LENGTH) {
        chunks.push(paragraph);
        continue;
      }
      
      // Split by sentence endings (., !, ?)
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      let currentChunk = '';
      
      // Process each sentence
      for (const sentence of sentences) {
        if (sentence.length > MAX_CHUNK_LENGTH) {
          // If current chunk has content, add it first
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }
          
          // Split long sentence by commas or other natural breaks
          const sentenceParts = sentence.split(/(?<=[:;,])\s+/);
          let currentPart = '';
          
          for (const part of sentenceParts) {
            if (part.length > MAX_CHUNK_LENGTH) {
              // If part is still too long, split by spaces
              if (currentPart) {
                chunks.push(currentPart.trim());
                currentPart = '';
              }
              
              // Forced splitting by character count
              let remainingText = part;
              while (remainingText.length > 0) {
                // Try to find a space to break at
                const breakPoint = remainingText.length <= MAX_CHUNK_LENGTH 
                  ? remainingText.length 
                  : Math.max(remainingText.lastIndexOf(' ', MAX_CHUNK_LENGTH), MAX_CHUNK_LENGTH / 2);
                
                chunks.push(remainingText.substring(0, breakPoint).trim());
                remainingText = remainingText.substring(breakPoint).trim();
              }
            } else if (currentPart.length + part.length + 1 > MAX_CHUNK_LENGTH) {
              chunks.push(currentPart.trim());
              currentPart = part;
            } else {
              currentPart += (currentPart ? ' ' : '') + part;
            }
          }
          
          if (currentPart) {
            chunks.push(currentPart.trim());
          }
        } else if (currentChunk.length + sentence.length + 1 > MAX_CHUNK_LENGTH) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }
      
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
    }

    // Final filtering to remove any empty chunks
    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Speak a text with the provided options
   */
  public speak(text: string, options: SpeechOptions = {}): boolean {
    if (!this.isSpeechSupported()) {
      console.error('Speech synthesis not supported in this browser');
      if (options.onError) options.onError(new Error('Speech synthesis not supported'));
      return false;
    }

    if (!text || text.trim() === '') {
      console.error('No text provided for speech synthesis');
      if (options.onError) options.onError(new Error('No text provided'));
      return false;
    }

    // Cancel any ongoing speech
    this.cancel();

    // Store options for later use
    this.options = { ...options };
    
    // Break text into manageable chunks
    this.chunks = this.splitIntoChunks(text);
    console.log(`Text split into ${this.chunks.length} chunks for speech`);
    
    this.currentChunkIndex = 0;
    this.retryCount = 0;
    
    // Begin speaking
    this.speakNextChunk();
    return true;
  }

  /**
   * Speak the next chunk of text
   */
  private speakNextChunk(): void {
    if (this.currentChunkIndex >= this.chunks.length) {
      // We're done
      this.isSpeaking = false;
      if (this.options.onEnd) this.options.onEnd();
      return;
    }

    const chunk = this.chunks[this.currentChunkIndex];
    
    try {
      // First, use a trick to bypass browser restrictions
      // Create a temporary audio element and play it to unlock audio context
      const unlockAudio = new Audio();
      unlockAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      unlockAudio.volume = 0.01;
      unlockAudio.play().catch(() => {});
      
      // Always cancel any pending speech before creating a new utterance
      window.speechSynthesis.cancel();
      
      // A small delay to ensure speech synthesis is completely canceled
      setTimeout(() => {
        try {
          // Create utterance
          const utterance = new SpeechSynthesisUtterance(chunk);
          
          // Set voice preferences
          const voice = this.findBestVoice(this.options);
          if (voice) {
            utterance.voice = voice;
            console.log(`Using voice: ${voice.name}`);
          }
          
          // Critical: Set volume explicitly to ensure it's not muted
          utterance.volume = Math.max(0.8, this.options.volume || 0.8);
          
          // Apply options - use slightly conservative defaults for better stability
          utterance.rate = this.options.rate || 0.85;
          utterance.pitch = this.options.pitch || 1.0;
          
          // Set up event handlers
          utterance.onstart = () => {
            this.isSpeaking = true;
            console.log(`Speaking chunk ${this.currentChunkIndex + 1}/${this.chunks.length}: "${chunk.substring(0, 30)}..."`);
            
            if (this.currentChunkIndex === 0 && this.options.onStart) {
              this.options.onStart();
            }
          };
          
          utterance.onend = () => {
            console.log(`Finished speaking chunk ${this.currentChunkIndex + 1}/${this.chunks.length}`);
            
            // Move to next chunk
            this.currentChunkIndex++;
            this.retryCount = 0;
            
            // Small delay to prevent interruption errors
            setTimeout(() => {
              this.speakNextChunk();
            }, 150);
          };
          
          utterance.onerror = (event) => {
            // Handle interruption errors silently as they're expected during normal operation
            // when canceling speech or starting new speech
            if (event.error === 'interrupted') {
              console.log('Speech was interrupted (this is normal when changing speech)');
              
              // Move to next chunk anyway for robustness
              this.currentChunkIndex++;
              this.retryCount = 0;
              return;
            }
            
            console.error('Speech synthesis error:', event);
            
            if (this.retryCount < this.maxRetries) {
              // Try again with a delay
              this.retryCount++;
              console.log(`Retrying chunk ${this.currentChunkIndex + 1} (attempt ${this.retryCount}/${this.maxRetries})`);
              
              setTimeout(() => {
                this.speakNextChunk();
              }, 500);
            } else if (this.options.onError) {
              this.options.onError(event);
            }
          };
          
          if (this.options.onBoundary) {
            utterance.onboundary = this.options.onBoundary;
          }
          
          // Store reference to the utterance
          this.utterance = utterance;
          
          // Check browser support
          if (utterance.volume === 0) {
            console.warn('Speech synthesis volume is 0, forcing to 0.8');
            utterance.volume = 0.8;
          }
          
          // Trick to force audio playback on browser
          if (window.AudioContext || (window as any).webkitAudioContext) {
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              gainNode.gain.value = 0.01; // Almost silent
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              oscillator.start(0);
              oscillator.stop(0.1);
            } catch (e) {
              console.warn('Could not create audio context:', e);
            }
          }
          
          // Speak the text - using a retry mechanism for robustness
          const startSpeech = () => {
            try {
              window.speechSynthesis.speak(utterance);
              // Double-check if it's actually speaking
              if (!window.speechSynthesis.speaking) {
                console.warn('Speech synthesis not speaking, trying again...');
                setTimeout(() => {
                  window.speechSynthesis.speak(utterance);
                }, 100);
              }
            } catch (e) {
              console.error('Error when trying to speak:', e);
            }
          };
          
          startSpeech();
        } catch (error) {
          console.error('Error creating speech utterance:', error);
          if (this.options.onError) this.options.onError(error);
        }
      }, 50);
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      if (this.options.onError) this.options.onError(error);
      this.isSpeaking = false;
    }
  }

  /**
   * Pause speech
   */
  public pause(): boolean {
    if (!this.isSpeechSupported() || !this.isSpeaking || this.isPaused) {
      return false;
    }
    
    try {
      window.speechSynthesis.pause();
      this.isPaused = true;
      if (this.options.onPause) this.options.onPause();
      return true;
    } catch (error) {
      console.error('Error pausing speech:', error);
      return false;
    }
  }

  /**
   * Resume speech
   */
  public resume(): boolean {
    if (!this.isSpeechSupported() || !this.isSpeaking || !this.isPaused) {
      return false;
    }
    
    try {
      window.speechSynthesis.resume();
      this.isPaused = false;
      if (this.options.onResume) this.options.onResume();
      return true;
    } catch (error) {
      console.error('Error resuming speech:', error);
      return false;
    }
  }

  /**
   * Cancel speech
   */
  public cancel(): boolean {
    if (!this.isSpeechSupported()) {
      return false;
    }
    
    try {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.utterance = null;
      return true;
    } catch (error) {
      console.error('Error canceling speech:', error);
      return false;
    }
  }

  /**
   * Check if currently speaking
   */
  public isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  /**
   * Check if speech is paused
   */
  public isPausedNow(): boolean {
    return this.isPaused;
  }
  
  /**
   * Clean up resources used by the speech synthesis manager
   */
  public cleanup(): void {
    this.cancel();
    
    if (this.watchdogTimer !== null) {
      window.clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    
    if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged) {
      window.speechSynthesis.onvoiceschanged = null;
    }
  }
}

// Create and export a singleton instance
export const speechSynthesis = new SpeechSynthesisManager();

export default speechSynthesis; 