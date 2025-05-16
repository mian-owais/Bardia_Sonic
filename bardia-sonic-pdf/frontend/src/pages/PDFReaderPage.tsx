import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button, Container, Row, Col, Spinner, Form, ProgressBar, Dropdown, OverlayTrigger, Tooltip, ButtonGroup } from 'react-bootstrap';
import api from '../services/api';
import { geminiService, AudioRecommendation } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { audioUtils } from '../utils';

// Import styles for react-pdf
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface Recommendation {
  id: string;
  pdf_id: string;
  page_number: number;
  background_music: string;
  effects: Effect[];
  created_at: string;
  updated_at: string;
}

interface Effect {
  id: string;
  timeline: number;
}

interface MusicMap {
  [key: string]: string;
}

interface EffectsMap {
  [key: string]: string;
}

// Define interface for component props
interface PDFReaderPageProps {
  isAudioInitialized?: boolean;
}

const PDFReaderPage: React.FC<PDFReaderPageProps> = ({ isAudioInitialized = false }) => {
  const { pdfId } = useParams<{ pdfId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [pdfData, setPdfData] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageText, setPageText] = useState<string>('');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isReadingMode, setIsReadingMode] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [musicVolume, setMusicVolume] = useState<number>(0.5);
  const [effectsVolume, setEffectsVolume] = useState<number>(0.7);
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState<boolean>(false);
  
  // New states for enhanced UI
  const [darkMode, setDarkMode] = useState<boolean>(localStorage.getItem('darkMode') === 'true');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [extractedText, setExtractedText] = useState<string>('');
  const [showExtractedText, setShowExtractedText] = useState<boolean>(false);
  const [analyzingText, setAnalyzingText] = useState<boolean>(false);
  
  // References for audio elements
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const effectsAudioRef = useRef<{[key: string]: HTMLAudioElement}>({});
  
  // Maps for music and effects files
  const musicMap: MusicMap = {
    'M1': '/music/curiosity.mp3',
    'M2': '/music/motivational.mp3',
    'M3': '/music/instructional.mp3',
    'M4': '/music/philosophical.mp3',
    'M5': '/music/happy.mp3',
    'M6': '/music/optimistic.mp3',
    'M7': '/music/sad.mp3',
    'M8': '/music/pessimistic.mp3',
    'M9': '/music/heroic.mp3',
    'M10': '/music/horror.mp3',
    'M11': '/music/beat.mp3',
    'M12': '/music/newspaper.mp3',
    'M13': '/music/nostalgic.mp3'
  };
  
  const effectsMap: EffectsMap = {
    // Weather
    'E1a': '/effects/weather/thunder.mp3',
    'E1b': '/effects/weather/rain.mp3',
    'E1c': '/effects/weather/sunny_birds.mp3',
    'E1d': '/effects/weather/night_frogs.mp3',
    'E1e': '/effects/weather/gentle_breeze.mp3',
    'E1f': '/effects/weather/blizzard.mp3',
    
    // Miscellaneous
    'E2a': '/effects/misc/market.mp3',
    'E2b': '/effects/misc/steps.mp3',
    'E2c': '/effects/misc/knocking.mp3',
    'E2d': '/effects/misc/glass_breaking.mp3',
    'E2e': '/effects/misc/water.mp3',
    'E2f': '/effects/misc/cup_filling.mp3',
    'E2g': '/effects/misc/deep_breath.mp3',
    'E2h': '/effects/misc/doorbell.mp3',
    'E2i': '/effects/misc/phone.mp3',
    'E2j': '/effects/misc/car_engine.mp3',
    'E2k': '/effects/misc/crowd.mp3',
    
    // Animal Sounds
    'E3a': '/effects/animals/birds.mp3',
    'E3b': '/effects/animals/dog.mp3',
    'E3c': '/effects/animals/horse.mp3',
    'E3d': '/effects/animals/cat.mp3',
    'E3e': '/effects/animals/owl.mp3',
    
    // Beats
    'E4a': '/effects/beats/drumbeat.mp3',
    'E4b': '/effects/beats/strings.mp3',
    'E4c': '/effects/beats/dramatic.mp3',
    'E4d': '/effects/beats/percussion.mp3',
    
    // Machine Sounds
    'E5a': '/effects/machines/factory.mp3',
    'E5b': '/effects/machines/spaceship.mp3',
    'E5c': '/effects/machines/gunshot.mp3'
  };
  
  // Timer for reading progress
  const readingTimerRef = useRef<number | null>(null);
  // Reference to keep track of scheduled effects
  const scheduledEffectsRef = useRef<number[]>([]);
  
  // Add a speech synthesis reference
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Add TTS notification state
  const [ttsNotification, setTtsNotification] = useState<string | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add a flag to track if speech synthesis is currently in process
  const isSpeechProcessingRef = useRef<boolean>(false);
  
  // Add these refs to track speech synthesis state more reliably
  const processingChunksRef = useRef<boolean>(false);
  const currentChunkIndexRef = useRef<number>(0);
  const speechErrorCountRef = useRef<number>(0);
  
  // New states for speech synthesis initialization
  const [speechSynthesisInitialized, setSpeechSynthesisInitialized] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Add a timeout ref for speech stopping
  const speechStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load available voices for text-to-speech
  useEffect(() => {
    if (!isReadingMode && isSpeaking) {
      speakText();
    }
  }, [isReadingMode, isSpeaking, pageNumber]);
  
  // Toggle dark mode
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);
  
  // Add a useEffect to monitor audio initialization
  useEffect(() => {
    if (isAudioInitialized) {
      console.log('Audio system initialized from parent component');
      // If audio is already initialized and we're in listening mode, try to start TTS
      if (!isReadingMode && isSpeaking) {
        speakText();
      }
      
      // Try starting background music if it should be playing
      if (isAudioPlaying && !backgroundMusicRef.current) {
        playBackgroundMusic();
      }
    }
  }, [isAudioInitialized]);
  
  // Fetch PDF data and first page on component mount
  useEffect(() => {
    const fetchPdfData = async () => {
      try {
        setLoading(true);
        console.log("Loading PDF with ID:", pdfId);
        
        let pdfMetadata;
        let url;
        
        // Attempt to load PDF from API
          console.log("Attempting to load PDF from API");
          try {
          // Get PDF metadata and URL from API
            const response = await api.get(`/pdf/${pdfId}`);
          if (response.data) {
            pdfMetadata = response.data;
            url = response.data.file_url || `/api/pdf/${pdfId}/file`;
            console.log("PDF loaded from API:", pdfMetadata);
            setPdfData(pdfMetadata);
          }
        } catch (apiError) {
          console.error("Error loading PDF from API:", apiError);
          setError("Could not load PDF data from server. The file may not exist or the server might be unavailable.");
                setLoading(false);
                return;
              }
        
        // Set PDF URL
        if (url) {
          console.log("Setting PDF URL:", url);
          setPdfUrl(url);
        } else {
          setError("PDF file URL not found.");
              setLoading(false);
              return;
        }
        
        // Load first page text if available
        try {
          await fetchPageData(1);
        } catch (pageError) {
          console.warn("Could not load initial page text:", pageError);
          // Continue without page text
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error in fetchPdfData:", error);
        setError("Failed to load PDF data.");
        setLoading(false);
      }
    };
    
    // Only fetch if we have a PDF ID
    if (pdfId) {
    fetchPdfData();
    } else {
      setLoading(false);
      setError("No PDF ID provided.");
    }
    
    // Cleanup on component unmount
    return () => {
      cleanupAudio();
    };
  }, [pdfId]);
  
  // Fetch page text and recommendation when page changes
  useEffect(() => {
    if (pdfId && pageNumber) {
      fetchPageData(pageNumber);
    }
  }, [pdfId, pageNumber]);
  
  // Handle audio playback when recommendation changes
  useEffect(() => {
    if (recommendation) {
      cleanupAudio();
      playBackgroundMusic();
      
      if (!isReadingMode) {
        scheduleEffects();
        if (isSpeaking) {
          speakText();
        }
      }
    }
    
    return () => {
      cleanupAudio();
    };
  }, [recommendation, isReadingMode, isSpeaking, musicVolume, effectsVolume]);
  
  // Generate audio recommendations using RAG
  const generateRecommendationsWithRAG = async (text: string): Promise<AudioRecommendation> => {
    setIsGeneratingRecommendation(true);
    
    try {
      // Determine whether to use the actual API or mock service based on premium status
      let result;
      if (currentUser?.isPremium) {
        // Use the actual Gemini API for premium users
        result = await geminiService.getAudioRecommendations(text);
      } else {
        // Use the mock implementation for non-premium users
        result = geminiService.getMockAudioRecommendations(text);
      }
      
      // Validate the recommendation
      const validatedResult = validateAudioRecommendation(result);
      
      setIsGeneratingRecommendation(false);
      return validatedResult;
    } catch (error) {
      console.error("Error generating recommendations:", error);
      setIsGeneratingRecommendation(false);
      
      // Return default recommendations on error
      return {
        backgroundMusic: 'M1',
        effects: []
      };
    }
  };
  
  // Validate and sanitize audio recommendations
  const validateAudioRecommendation = (recommendation: AudioRecommendation): AudioRecommendation => {
    // Check if backgroundMusic is valid
    const validBackgroundMusic = recommendation.backgroundMusic && 
      musicMap[recommendation.backgroundMusic] !== undefined
      ? recommendation.backgroundMusic
      : 'M1'; // Default to M1 if invalid
    
    // Filter out invalid effects
    const validEffects = recommendation.effects
      ? recommendation.effects.filter(effect => 
          effect.id && 
          effectsMap[effect.id] !== undefined &&
          typeof effect.timeline === 'number' &&
          effect.timeline >= 0
        )
      : [];
    
    return {
      backgroundMusic: validBackgroundMusic,
      effects: validEffects
    };
  };
  
  // Enhanced text extraction function with better error handling and retry logic
  const extractTextFromPdf = async () => {
    setAnalyzingText(true);
    try {
      let extractedText = '';
      
      if (!pdfUrl) {
        throw new Error('No PDF URL available');
      }
      
      try {
        console.log("Attempting to extract text from PDF:", pdfUrl);
        
        // Use pdfjs directly to extract text with retry mechanism
        const loadingOptions = {
          cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/'
        };
      
        // Create a loading task with proper options
        const loadingTask = pdfjs.getDocument({
          url: pdfUrl,
          ...loadingOptions
        });
        
        // Set a timeout for the loading task
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('PDF loading timeout')), 20000);
        });
        
        // Race the loading task against the timeout
        const pdf = await Promise.race([
          loadingTask.promise,
          timeoutPromise
        ]) as any;
        
        // Make sure we have a valid page number
        const validPageNumber = (pageNumber > 0 && pageNumber <= pdf.numPages) 
          ? pageNumber 
          : 1;
        
        // Get the current page
        const page = await pdf.getPage(validPageNumber);
        
        // Extract text content
        const textContent = await page.getTextContent();
        
        // Process the text with better formatting
        extractedText = textContent.items
          .map((item: any) => {
            // Handle different item formats
            if (typeof item.str === 'string') {
              return item.str;
            } else if (item.text) {
              return item.text;
            } else if (item.chars) {
              return item.chars.join('');
            }
            return '';
          })
          .join(' ')
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        // If we got no text at all, try an alternative method
        if (!extractedText || extractedText.length < 5) {
          console.warn('Primary text extraction yielded insufficient results, trying alternative method');
          
          // Try to get document metadata, which might include text
          const metadata = await pdf.getMetadata();
          if (metadata && metadata.info) {
            const info = metadata.info as Record<string, any>;
            if (info.Title) {
              extractedText = `${info.Title}. `;
            }
            
            if (info.Subject) {
              extractedText += info.Subject;
            }
          }
          
          if (!extractedText || extractedText.length < 5) {
            throw new Error('Insufficient text extracted from PDF');
          }
        }
        
        console.log("Successfully extracted text from PDF:", extractedText.substring(0, 100) + "...");
        } catch (extractError) {
        console.error('Primary extraction method failed:', extractError);
        
        // Try fallback method for text extraction using canvas rendering
        try {
          console.log("Attempting fallback text extraction method");
          
          const loadingTask = pdfjs.getDocument(pdfUrl);
          const pdf = await loadingTask.promise as any;
          
          // Make sure we have a valid page number
          const validPageNumber = (pageNumber > 0 && pageNumber <= pdf.numPages) ? pageNumber : 1;
          
          // Get the page
          const page = await pdf.getPage(validPageNumber);
          
          // Create a canvas element
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) {
            throw new Error('Could not create canvas context');
          }
          
          // Get viewport
          const viewport = page.getViewport({ scale: 1.5 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          // Render the page to the canvas
          await page.render({ canvasContext: context, viewport }).promise;
          
          // Since we don't have OCR capabilities directly in the browser,
          // we'll use page metadata and a placeholder message
          const metadata = await pdf.getMetadata();
          let fallbackText = `Page ${pageNumber}`;
          
          if (metadata && metadata.info) {
            const info = metadata.info as Record<string, any>;
            if (info.Title) fallbackText += ` of ${info.Title}`;
            if (info.Author) fallbackText += ` by ${info.Author}`;
          }
          
          fallbackText += `. This page contains visual content that could not be extracted as text.`;
          extractedText = fallbackText;
          
          console.log("Fallback extraction used:", extractedText);
        } catch (fallbackError) {
          console.error('Fallback extraction method failed:', fallbackError);
          extractedText = `Content from page ${pageNumber}. Text extraction failed, but you can still read the PDF visually.`;
        }
      }
      
      // Save the extracted text
      setExtractedText(extractedText);
      setPageText(extractedText);
      
      // Return the extracted text for RAG processing
      return extractedText;
    } catch (error) {
      console.error('PDF text extraction error:', error);
      const fallbackText = `Failed to extract text from page ${pageNumber}. The PDF may be image-based or protected.`;
      setPageText(fallbackText);
      return fallbackText;
    } finally {
      setAnalyzingText(false);
    }
  };
  
  // Enhanced fetch page data function with better RAG implementation
  const fetchPageData = async (page: number) => {
    try {
      console.log(`Fetching data for page ${page}`);
      
      // Extract text from PDF
      const extractedPageText = await extractTextFromPdf();
      console.log(`Text extracted from page ${page}, length:`, extractedPageText.length);
      setPageText(extractedPageText);
      
      // Reset reading progress
      setReadingProgress(0);
      if (readingTimerRef.current) {
        clearInterval(readingTimerRef.current);
        readingTimerRef.current = null;
      }
      
      // If in listening mode and speaking is enabled, start text-to-speech
      if (!isReadingMode && isSpeaking) {
        // Cancel any previous speech and wait a small delay
        stopSpeaking();
        
        // Start new speech with a small delay to ensure state is updated
        console.log("Listening mode active with speaking enabled, starting TTS soon...");
            setTimeout(() => {
          console.log("Starting TTS now");
              speakText();
        }, 500);
      }
    } catch (err) {
      console.error("Error in fetchPageData:", err);
      setError('Failed to load page data. Please try again later.');
    }
  };
  
  // Handle document loading
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log("PDF document loaded successfully with", numPages, "pages");
    setNumPages(numPages);
    
    // Reset to page 1 when loading a new document
    setPageNumber(1);
    
    // Extract text from the first page
    fetchPageData(1);
  };
  
  // Enhanced navigation with clean speech handling
  const goToPrevPage = () => {
    if (pageNumber > 1) {
      // Cancel any ongoing speech first
      const wasSpeaking = isSpeaking;
      stopSpeaking();
      
      // Use a short delay to ensure speech is fully stopped
      setTimeout(() => {
        setPageNumber(pageNumber - 1);
        console.log("Navigating to previous page:", pageNumber - 1);
        
        // If we were speaking and in listening mode, restart speech after navigation
        if (wasSpeaking && !isReadingMode) {
          // Give time for the page data to load before speaking
          setTimeout(() => {
            if (!isSpeechProcessingRef.current) {
              speakText();
            }
          }, 1000);
        }
      }, 50);
    }
  };
  
  const goToNextPage = () => {
    if (numPages && pageNumber < numPages) {
      // Cancel any ongoing speech first
      const wasSpeaking = isSpeaking;
      stopSpeaking();
      
      // Use a short delay to ensure speech is fully stopped
      setTimeout(() => {
        setPageNumber(pageNumber + 1);
        console.log("Navigating to next page:", pageNumber + 1);
        
        // If we were speaking and in listening mode, restart speech after navigation
        if (wasSpeaking && !isReadingMode) {
          // Give time for the page data to load before speaking
          setTimeout(() => {
            if (!isSpeechProcessingRef.current) {
              speakText();
            }
          }, 1000);
        }
      }, 50);
    }
  };
  
  // Replace the getAssetUrl function with our utility version
  const getAssetUrl = audioUtils.getAssetUrl;

  // Replace the checkAudioFileExists function with our utility version
  const checkAudioFileExists = audioUtils.checkAudioFileExists;
  
  // Function to determine music type based on content
  const getMusicTypeForContent = (): string => {
    // If we have a recommendation from Gemini, use it
    if (recommendation?.background_music) {
      return recommendation.background_music;
    }
    
    // Default music based on content patterns
    if (pageText) {
      if (pageText.toLowerCase().includes('science') || 
          pageText.toLowerCase().includes('technology') || 
          pageText.toLowerCase().includes('study')) {
        return 'science';
      } else if (pageText.toLowerCase().includes('adventure') || 
                 pageText.toLowerCase().includes('journey')) {
        return 'adventure';
      } else if (pageText.toLowerCase().includes('romance') || 
                 pageText.toLowerCase().includes('love')) {
        return 'romance';
      } else if (pageText.toLowerCase().includes('news') || 
                 pageText.toLowerCase().includes('current events')) {
        return 'newspaper';
      }
    }
    
    // Default to ambient
    return 'ambient';
  };

  // Function to get music path from type
  const getMusicPath = (musicType: string): string => {
    const pathMap: Record<string, string> = {
      'science': 'music/science.mp3',
      'adventure': 'music/adventure.mp3',
      'romance': 'music/romance.mp3',
      'newspaper': 'music/newspaper.mp3',
      'ambient': 'music/ambient.mp3',
      'M1': 'music/M1.mp3',
      'M2': 'music/M2.mp3',
      'M3': 'music/M3.mp3',
      'M4': 'music/M4.mp3'
    };
    
    return pathMap[musicType] || 'music/ambient.mp3';
  };

  // Update the playBackgroundMusic function to use our new audio utility
  const playBackgroundMusic = async () => {
    if (!isAudioPlaying) return;
    
    try {
      // First, clean up any existing music
    if (backgroundMusicRef.current) {
        audioUtils.stopAudio(backgroundMusicRef.current);
      backgroundMusicRef.current = null;
    }
    
      // Get the appropriate music based on content
      let musicType = getMusicTypeForContent();
      console.log(`Using music type: ${musicType}`);
      
      // Get the music file URL
      const audioPath = getMusicPath(musicType);
      const musicUrl = audioUtils.getAssetUrl(audioPath);
      
      console.log(`Attempting to play background music from: ${musicUrl}`);
      
      // Check if auto-play is available
      const canAutoplay = await audioUtils.canAutoplayAudio();
      
      if (!canAutoplay) {
        console.log('Autoplay not available - will use silent audio fallback until user interaction');
      }
      
      // Play the audio with our improved utility
      const audio = await audioUtils.playAudio(musicUrl, {
        volume: musicVolume,
        loop: true,
        fallbackToSilent: true, // Use silent audio as fallback
        onError: (error) => {
          console.error('Error playing background music:', error);
        },
        onStart: () => {
          console.log('Background music started successfully');
        }
      });
      
      if (audio) {
        backgroundMusicRef.current = audio;
      } else {
        console.log('Could not start background music - will retry on user interaction');
        
        // Create a one-time listener to try playing music again on interaction
        const retryOnInteraction = () => {
          playBackgroundMusic();
          document.removeEventListener('click', retryOnInteraction);
          document.removeEventListener('touchstart', retryOnInteraction);
        };
        
        document.addEventListener('click', retryOnInteraction, { once: true });
        document.addEventListener('touchstart', retryOnInteraction, { once: true });
      }
    } catch (error) {
      console.error("Error in playBackgroundMusic:", error);
    }
  };
  
  // Schedule effects to play at specific times
  const scheduleEffects = () => {
    if (!recommendation || isReadingMode) return;
    
    // Clear any previously scheduled effects
    scheduledEffectsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    scheduledEffectsRef.current = [];
    
    // Create read timer (155 words per minute)
    if (!readingTimerRef.current) {
      const wordCount = pageText.split(/\s+/).length;
      const totalReadingTimeMs = (wordCount / 155) * 60 * 1000;
      
      if (totalReadingTimeMs > 0) {
        const updateInterval = 100; // Update every 100ms
        let elapsed = 0;
        
        readingTimerRef.current = window.setInterval(() => {
          elapsed += updateInterval;
          const progress = Math.min((elapsed / totalReadingTimeMs) * 100, 100);
          setReadingProgress(progress);
          
          if (progress >= 100 && readingTimerRef.current) {
            clearInterval(readingTimerRef.current);
            readingTimerRef.current = null;
          }
        }, updateInterval);
      }
    }
    
    // Schedule each effect
    recommendation.effects.forEach(effect => {
      const effectPath = effectsMap[effect.id];
      if (!effectPath) return;
      
      const timeoutId = window.setTimeout(() => {
        playEffect(effect.id);
      }, effect.timeline * 1000); // timeline is in seconds
      
      scheduledEffectsRef.current.push(timeoutId);
    });
  };
  
  // Update the playEffect function to use our audio utility
  const playEffect = async (effectId: string) => {
    const effectPath = effectsMap[effectId];
    if (!effectPath) return;
    
    try {
      // Get the asset URL
      const audioUrl = getAssetUrl(effectPath);
      console.log("Attempting to play effect from:", audioUrl);
      
      // Use our enhanced audio utility to play the effect
      const audio = await audioUtils.playAudio(audioUrl, {
        volume: effectsVolume,
        onError: (error) => {
          console.error("Error playing effect:", error);
        delete effectsAudioRef.current[effectId];
        },
        onEnded: () => {
            delete effectsAudioRef.current[effectId];
        }
      });
      
      if (audio) {
        effectsAudioRef.current[effectId] = audio;
      }
    } catch (err) {
      console.error("Error setting up effect:", err);
      
      // Try to use a dummy audio file if real audio failed
      if (process.env.NODE_ENV === 'development') {
        try {
          console.log("Attempting to create dummy effect as fallback");
          const dummyUrl = await audioUtils.createDummyAudioFile(`effect-${effectId}.wav`, 1);
          if (dummyUrl) {
            const dummyAudio = await audioUtils.playAudio(dummyUrl, {
              volume: effectsVolume
            });
            if (dummyAudio) {
              effectsAudioRef.current[effectId] = dummyAudio;
              dummyAudio.onended = () => {
        delete effectsAudioRef.current[effectId];
      };
            }
          }
        } catch (dummyError) {
          console.error("Failed to create dummy effect:", dummyError);
        }
      }
    }
  };
  
  // Improved speech synthesis initialization
  const initSpeechSynthesis = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.error('Speech synthesis not supported in this browser');
      setSpeechSynthesisInitialized(false);
      showNotification('Speech synthesis not supported in this browser', 'danger');
      return;
    }

    try {
      // Initialize voices and set up voice change event listeners
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices && availableVoices.length > 0) {
          console.log(`Voices loaded: ${availableVoices.length}`);
          setSpeechSynthesisInitialized(true);
          
          // Find the best voice to use as default
          const preferredVoice = availableVoices.find(
            voice => voice.localService && (voice.lang.includes('en-US') || voice.lang.includes('en-GB'))
          ) || availableVoices.find(
            voice => voice.lang.includes('en-US') || voice.lang.includes('en-GB')
          );
          
          if (preferredVoice) {
            console.log(`Selected preferred voice: ${preferredVoice.name} (${preferredVoice.lang})`);
          }
          
          // Store a reference to all available voices
          setVoices(availableVoices);
          
          // Perform a quick 'keep alive' check for speech synthesis
          keepSpeechSynthesisAlive();
          
          return true;
        } else {
          console.warn('No voices available for speech synthesis');
          return false;
        }
      };

      // Check for voices immediately and also set up the voiceschanged event
      const initialLoad = loadVoices();
      if (!initialLoad) {
        // If voices aren't available immediately, set up event listener
        window.speechSynthesis.onvoiceschanged = () => {
          loadVoices();
          window.speechSynthesis.onvoiceschanged = null; // Only handle once
        };
        
        // If voices don't load within 5 seconds, try to continue anyway
        setTimeout(() => {
          if (!speechSynthesisInitialized) {
            console.warn('Voices did not load within timeout, attempting to continue');
            setSpeechSynthesisInitialized(true);
            keepSpeechSynthesisAlive();
          }
        }, 5000);
      }
      
      console.log('Speech synthesis initialization attempt: successful');
    } catch (e) {
      console.error('Error initializing speech synthesis:', e);
      setSpeechSynthesisInitialized(false);
      showNotification('Failed to initialize speech synthesis', 'danger');
    }
  };

  // Function to keep speech synthesis active
  const keepSpeechSynthesisAlive = () => {
    // Some browsers need periodic interaction with speechSynthesis to keep it alive
    try {
      // Create an empty utterance just to check if synthesis is working
      const ping = new SpeechSynthesisUtterance('');
      ping.volume = 0; // Silent
      ping.rate = 10; // Fast
      ping.onend = () => {}; 
      ping.onerror = () => {};
      
      // Speak the empty utterance to keep the system warm
      window.speechSynthesis.speak(ping);
      
      // Set up a periodic ping every 30 seconds to keep synthesis active
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          const keepAlive = new SpeechSynthesisUtterance('');
          keepAlive.volume = 0;
          keepAlive.rate = 10;
          window.speechSynthesis.speak(keepAlive);
        }
      }, 30000);
      
      // Clean up the interval when component unmounts
      return () => clearInterval(interval);
    } catch (e) {
      console.warn('Speech synthesis keep-alive ping failed:', e);
    }
  };
  
  // Enhanced speakText function with debouncing and interruption prevention
  const speakText = () => {
    // Check if already processing a speech request
    if (isSpeechProcessingRef.current) {
      console.log("Speech already in progress, ignoring new request");
      return;
    }

    // Set flags to prevent multiple calls
    isSpeechProcessingRef.current = true;
    setIsSpeaking(true);
    
    // Clear any existing interruption timeout
    if (speechStopTimeoutRef.current) {
      clearTimeout(speechStopTimeoutRef.current);
      speechStopTimeoutRef.current = null;
    }

    console.log('Starting text-to-speech with text length:', pageText.length);
    console.log('Text sample:', pageText.substring(0, 100) + '...');
    
    // Show starting notification
    showNotification('Starting text-to-speech...', 'info');
    
    // Force unlock the audio context first
    audioUtils.forceAudioContext().then((success) => {
      try {
        // Clean text by removing excess whitespace and normalizing
        const cleanText = pageText
          .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
          .trim();

        if (!cleanText) {
          console.warn('No text to speak after cleaning');
          isSpeechProcessingRef.current = false;
          setIsSpeaking(false);
          showNotification('No text to speak', 'warning');
          return;
        }

        // Make sure speech synthesis is available
        if (!window.speechSynthesis) {
          console.error('Speech synthesis not available');
          isSpeechProcessingRef.current = false;
          setIsSpeaking(false);
          showNotification('Speech synthesis not available in this browser', 'danger');
          return;
        }

        // Cancel any previous speech completely
        window.speechSynthesis.cancel();
        
        // Small delay to ensure previous speech is fully canceled
        setTimeout(() => {
          const voices = window.speechSynthesis.getVoices();
          console.log(`Found ${voices.length} voices`);
          
          // Get the best available voice
          let selectedVoice = voices.find(voice => 
            voice.localService && (voice.lang.includes('en-US') || voice.lang.includes('en-GB'))
          ) || voices.find(voice => 
            voice.lang.includes('en') || voice.name.includes('English')
          ) || voices[0];
          
          if (selectedVoice) {
            console.log(`Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
          } else if (voices.length > 0) {
            selectedVoice = voices[0];
            console.log(`Falling back to first available voice: ${selectedVoice.name}`);
          } else {
            console.warn('No voices available for speech synthesis');
          }
          
          // Create the utterance
          const utterance = new SpeechSynthesisUtterance(cleanText);
          
          // Apply voice settings
          utterance.rate = 0.9;  // Slightly slower for better stability
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang || 'en-US';
          }
          
          // Set up completion handler
          utterance.onend = () => {
            console.log(`Speech completed successfully`);
            
            // Reset processing flags
            isSpeechProcessingRef.current = false;
            
            // Don't immediately reset speaking state to prevent flicker
            setTimeout(() => {
              setIsSpeaking(false);
            }, 500);
            
            // Show success notification
            showNotification('Text-to-speech complete', 'success');
            
            // Advance to next page after a delay if in listening mode
            if (!isReadingMode && pageNumber < (numPages || 0)) {
              console.log('Text-to-speech complete, advancing to next page after delay...');
              showNotification('Page complete, advancing to next page...', 'success');
              
              // Add a reasonable pause between pages
              setTimeout(() => {
                goToNextPage();
              }, 2000);
            }
          };
          
          // Error handler with better interruption handling
          utterance.onerror = (event) => {
            console.warn('Speech synthesis error:', event);
            
            // Only handle if we're still in the speaking state to prevent duplicate handling
            if (!isSpeaking) return;
            
            if (event.error === 'interrupted') {
              // This is often triggered when changing pages or modes
              // Just reset flags without showing an error
              console.log('Speech was intentionally interrupted');
              isSpeechProcessingRef.current = false;
              
              // Don't immediately show notification for interruptions
              // This prevents notification spam when navigating
              if (event.utterance && event.utterance.text && event.utterance.text.length > 20) {
                // Only show for substantial text that was interrupted
                showNotification('Speech was interrupted', 'info');
              }
              return;
            }
            
            // For other errors, try one more time with a slower rate
            if (utteranceRef.current !== utterance) {
              // If this isn't the current utterance, just ignore the error
              return;
            }
            
            // Log additional debugging info
            console.log('Speech error details:', {
              errorType: event.error,
              utteranceLength: event.utterance?.text?.length || 0,
              browserInfo: navigator.userAgent
            });
            
            // Try again with a slower rate
            console.log('Retrying speech with slower rate');
            setTimeout(() => {
              // Clear previous utterance
              utteranceRef.current = null;
              
              // Only retry if still in speaking mode
              if (!isSpeaking) return;
              
              const retryUtterance = new SpeechSynthesisUtterance(cleanText);
              retryUtterance.rate = 0.7;  // Even slower
              retryUtterance.pitch = 1.0;
              retryUtterance.volume = 1.0;
              
              if (selectedVoice) {
                retryUtterance.voice = selectedVoice;
                retryUtterance.lang = selectedVoice.lang || 'en-US';
              }
              
              retryUtterance.onend = utterance.onend;
              retryUtterance.onerror = (retryEvent) => {
                console.warn(`Retry also failed:`, retryEvent);
                isSpeechProcessingRef.current = false;
                setIsSpeaking(false);
                showNotification('Speech synthesis failed, please try again later', 'danger');
              };
              
              // Store reference and speak
              utteranceRef.current = retryUtterance;
              
              // Make sure any previous speech is canceled
              window.speechSynthesis.cancel();
              
              // Start the retry with a delay
              setTimeout(() => {
                try {
                  window.speechSynthesis.speak(retryUtterance);
                } catch (e) {
                  console.error('Failed to retry speech:', e);
                  isSpeechProcessingRef.current = false;
                  setIsSpeaking(false);
                }
              }, 500);
            }, 1000);
            
            return;
          };
          
          // Store reference to current utterance
          utteranceRef.current = utterance;
          
          // Speak the entire page
          try {
            window.speechSynthesis.speak(utterance);
            showNotification('Text-to-speech active', 'success');
          } catch (e) {
            console.error('Error starting speech:', e);
            isSpeechProcessingRef.current = false;
            setIsSpeaking(false);
            showNotification('Failed to start speech synthesis', 'danger');
          }
        }, 100); // Small delay before starting new speech
      } catch (e) {
        console.error('Unexpected error in speech processing:', e);
        isSpeechProcessingRef.current = false;
        setIsSpeaking(false);
        showNotification('Unexpected error in speech processing', 'danger');
      }
    }).catch(error => {
      console.error('Failed to initialize audio context:', error);
      isSpeechProcessingRef.current = false;
      setIsSpeaking(false);
      showNotification('Failed to initialize audio. Please try again.', 'danger');
    });
  };
  
  // Improved stopSpeaking function to prevent interruption errors
  const stopSpeaking = () => {
    console.log('Stopping speech synthesis');
    
    // Prevent multiple stop calls
    if (!isSpeaking && !isSpeechProcessingRef.current) {
      return; // Already stopped
    }
    
    // Cancel any pending timeouts
    if (speechStopTimeoutRef.current) {
      clearTimeout(speechStopTimeoutRef.current);
      speechStopTimeoutRef.current = null;
    }
    
    // Clear state first to prevent race conditions
    isSpeechProcessingRef.current = false;
    setIsSpeaking(false);
    
    // Clear any queued utterances
    utteranceRef.current = null;
    
    // Use a try-catch to handle any issues with speech synthesis
    try {
      // Cancel any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        
        // For some browsers, a second cancel after a brief delay helps ensure complete cancellation
        speechStopTimeoutRef.current = setTimeout(() => {
          try {
            window.speechSynthesis.cancel();
          } catch (e) {
            console.warn('Error in secondary speech cancel:', e);
          }
          speechStopTimeoutRef.current = null;
        }, 50);
      }
    } catch (e) {
      console.error('Error canceling speech synthesis:', e);
    }
  };
  
  // Enhanced function to unlock audio context with more robust approach
  const unlockAudioContext = () => {
    console.log("Attempting to unlock audio context");
    
    // Use our utility first
    audioUtils.forceAudioContext().then(success => {
      if (success) {
        console.log('Audio context unlocked via utility');
      } else {
        console.warn('Failed to unlock audio context via utility, trying backup methods');
        
        // Backup method: create and play a short silent audio
        try {
          // Create audio context
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioCtx = new AudioContext();
            
            // Create silent oscillator
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
            gainNode.gain.value = 0.01; // Almost silent
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
            // Play briefly
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
            
            console.log('Attempted backup audio context unlock');
          }
      } catch (e) {
          console.error('Backup audio context unlock failed:', e);
        }
        
        // Extra fallback: play a silent audio element
        try {
          const silentAudio = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBA//8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAYAAAAAAAAAAdTaOBFgAAAAAAAAAAAAAAAAAAAAAAAA");
          silentAudio.volume = 0.1;
          const playPromise = silentAudio.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('Silent audio played successfully to unlock browser audio');
                silentAudio.pause();
                silentAudio.currentTime = 0;
              })
              .catch(err => {
                console.error('Failed to play silent audio:', err);
              });
          }
        } catch (e) {
          console.error('Silent audio failed:', e);
        }
        
        // Direct unlock attempt for Web Speech API
        try {
          if (window.speechSynthesis) {
            const shortUtterance = new SpeechSynthesisUtterance('');
            shortUtterance.volume = 0;
            shortUtterance.rate = 1;
            window.speechSynthesis.speak(shortUtterance);
            window.speechSynthesis.cancel();
            console.log('Direct speech synthesis unlock attempt completed');
          }
        } catch (e) {
          console.error('Speech synthesis unlock failed:', e);
        }
      }
    });
  };
  
  // Simplified toggleSpeaking
  const toggleSpeaking = () => {
    unlockAudioContext();
    
    if (window.speechSynthesis.speaking) {
      stopSpeaking();
    } else {
      speakText();
    }
  };
  
  // Update cleanupAudio to use the simplified speech handling
  const cleanupAudio = () => {
    // Stop background music if playing
    if (backgroundMusicRef.current) {
      audioUtils.stopAudio(backgroundMusicRef.current);
      backgroundMusicRef.current = null;
    }
    
    // Stop any playing effects
    Object.values(effectsAudioRef.current).forEach(audio => {
      audioUtils.stopAudio(audio);
    });
    
    // Stop speech synthesis
    stopSpeaking();
    
    // Clear any pending notifications
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
    setTtsNotification(null);
  };
  
  // Improved toggle reading mode function with clean transition
  const toggleReadingMode = () => {
    // Stop any ongoing speech when changing modes
    stopSpeaking();
    
    // Wait a moment for speech to fully stop before changing modes
    setTimeout(() => {
      const newMode = !isReadingMode;
      setIsReadingMode(newMode);
      
      if (newMode) {
        // Switching to Reading mode
        console.log('Switching to Reading mode');
        showNotification('Reading mode activated', 'info');
      } else {
        // Switching to Listening mode
        console.log('Switching to Listening mode');
        showNotification('Listening mode activated - audio will play automatically', 'info');
        
        // Start speaking after a longer delay to ensure clean state
        if (pageText && pageText.trim() !== '') {
          setTimeout(() => {
            if (!isSpeechProcessingRef.current && !isSpeaking) {
              console.log('Activating TTS for listening mode');
              speakText();
            }
          }, 1500);
        }
      }
    }, 100); // Small delay to ensure speech has fully stopped
  };
  
  // Toggle audio playback
  const toggleAudio = () => {
    if (isAudioPlaying) {
      if (backgroundMusicRef.current) {
        audioUtils.stopAudio(backgroundMusicRef.current);
      }
      
      // Pause speech if active
      if (isSpeaking) {
        window.speechSynthesis.pause();
      }
      
      // Clear reading timer
      if (readingTimerRef.current) {
        clearInterval(readingTimerRef.current);
      }
      
      setIsAudioPlaying(false);
    } else {
      if (backgroundMusicRef.current) {
        // If we already have an audio element, just play it directly
        backgroundMusicRef.current.play()
          .catch(err => console.error("Error playing music:", err));
      } else {
        playBackgroundMusic();
      }
      
      // Resume speech if active
      if (isSpeaking) {
        window.speechSynthesis.resume();
      }
      
      // Resume reading timer
      if (!isReadingMode && !readingTimerRef.current) {
        scheduleEffects();
      }
      
      setIsAudioPlaying(true);
    }
  };
  
  // Handle music volume changes
  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setMusicVolume(volume);
    
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = volume;
    }
  };
  
  const handleEffectsVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setEffectsVolume(volume);
  };
  
  // Handle zoom changes
  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(Math.max(0.5, Math.min(2.5, newZoom)));
  };
  
  // PDF analysis function
  const analyzePdf = async () => {
    if (!pdfId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/pdf/${pdfId}/analyze`);
      
      // Create a formatted analysis message
      const analysis = response.data;
      let detailedMessage = '';
      
      if (!analysis.signature.isPdf) {
        detailedMessage = `The file does not appear to be a valid PDF. The file signature is '${analysis.signature.bytes}' instead of '%PDF-'. This indicates the file may be corrupted or is not actually a PDF file.`;
      } else if (!analysis.validation.isValid) {
        detailedMessage = `The file has a PDF signature but failed validation: ${analysis.validation.error}. This typically means the PDF structure is damaged.`;
      } else if (analysis.fileSize.bytes === 0) {
        detailedMessage = "The file is empty (0 bytes).";
      } else {
        detailedMessage = `The file appears to be a valid PDF with ${analysis.validation.numPages || 0} pages and size ${analysis.fileSize.formatted}.`;
      }
      
      setError(`PDF Analysis Results: ${detailedMessage}`);
    } catch (error: any) {
      setError(`Failed to analyze PDF: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Add a new function to show notifications
  const showNotification = (message: string, type: 'info' | 'success' | 'warning' | 'danger') => {
    // Clear any existing notification timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
    
    // Set the new notification
    setTtsNotification(`${message} (${type})`);
    
    // Auto-clear after 3 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setTtsNotification(null);
      notificationTimeoutRef.current = null;
    }, 3000);
  };
  
  // Update the "Force Audio" button to be more robust
  const forceAudioButtonClick = () => {
    console.log("Force Audio TTS button clicked");
    
    // First stop any active speech
    stopSpeaking();
    
    // Reset any processing flags
    isSpeechProcessingRef.current = false;
    processingChunksRef.current = false;
    
    audioUtils.forceAudioContext().then((success) => {
      // Log whether initialization was successful
      if (!success) {
        console.warn('Audio context could not be fully initialized, but continuing anyway');
      }
      
      // If in reading mode, switch to listening mode
      if (isReadingMode) {
        console.log("Switching to listening mode for TTS");
        setIsReadingMode(false);
      }
      
      // Start the text-to-speech
      setIsSpeaking(true);
      setTimeout(() => {
        speakText();
      }, 300);
    }).catch((error: Error) => {
      console.error('Audio context initialization failed:', error);
      // Still try to speak anyway
      setIsSpeaking(true);
      speakText();
    });
  };
  
  // Add useEffect for speech synthesis initialization
  useEffect(() => {
    // Initialize speech synthesis when component mounts
    initSpeechSynthesis();
    
    // Set up audio context
    audioUtils.forceAudioContext().then(success => {
      console.log('Initial audio context setup:', success ? 'successful' : 'failed');
    });
    
    // Cleanup when component unmounts
    return () => {
      // Stop any ongoing speech
      stopSpeaking();
      
      // Clear notification timeouts
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
    };
  }, []);

  // Add useEffect for auto-play when in listening mode
  useEffect(() => {
    // If we're in listening mode and not speaking, auto-start when page changes
    if (!isReadingMode && !isSpeaking && pageText && isAudioInitialized) {
      const autoStartDelay = setTimeout(() => {
        if (!isSpeechProcessingRef.current) {
          console.log('Auto-starting speech for listening mode');
          speakText();
        }
      }, 1000); // Short delay before auto-starting
      
      return () => clearTimeout(autoStartDelay);
    }
  }, [pageNumber, isReadingMode, isSpeaking, pageText, isAudioInitialized]);
  
  // Render loading state
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-2" />
          <p className="mb-0">Loading PDF...</p>
        </div>
      </Container>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Container className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  return (
    <div className={`pdf-reader-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* TTS Notification */}
      {ttsNotification && (
        <div className="tts-notification" 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1050,
            padding: '10px 15px',
            borderRadius: '4px',
            backgroundColor: ttsNotification.includes('success') ? '#d4edda' : 
                            ttsNotification.includes('warning') ? '#fff3cd' :
                            ttsNotification.includes('danger') ? '#f8d7da' : '#d1ecf1',
            color: ttsNotification.includes('success') ? '#155724' :
                  ttsNotification.includes('warning') ? '#856404' :
                  ttsNotification.includes('danger') ? '#721c24' : '#0c5460',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            maxWidth: '300px'
          }}
        >
          {ttsNotification.split(' (')[0]}
        </div>
      )}
      
      {/* Streamlined Top Toolbar */}
      <div className="pdf-toolbar">
        <div className="d-flex align-items-center">
          <Button 
            variant={darkMode ? "outline-light" : "outline-dark"} 
            size="sm" 
            className="me-1"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to dashboard"
          >
            <i className="fas fa-arrow-left"></i>
          </Button>
          
          <div className="d-flex align-items-center page-navigation">
            <Button
              variant={darkMode ? "outline-light" : "outline-dark"}
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="p-1"
              aria-label="Previous page"
            >
              <i className="fas fa-chevron-left"></i>
            </Button>
            
            <div className="mx-1">
              <input
                type="number"
                value={pageNumber}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val > 0 && numPages && val <= numPages) {
                    setPageNumber(val);
                  }
                }}
                className={`form-control form-control-sm ${darkMode ? 'bg-dark text-light' : ''}`}
                style={{ width: '35px', textAlign: 'center', height: '28px', padding: '2px' }}
                aria-label="Page number"
              />
              <span className="mx-1 d-none d-sm-inline">/</span>
              <span className="d-none d-sm-inline">{numPages || '-'}</span>
            </div>
            
            <Button
              variant={darkMode ? "outline-light" : "outline-dark"}
              size="sm"
              onClick={goToNextPage}
              disabled={numPages !== null && pageNumber >= numPages}
              className="p-1"
              aria-label="Next page"
            >
              <i className="fas fa-chevron-right"></i>
            </Button>
          </div>
        </div>
        
        <div className="d-flex align-items-center">
          <div className="zoom-controls me-1">
            <ButtonGroup size="sm">
              <Button
                variant={darkMode ? "outline-light" : "outline-dark"}
                onClick={() => handleZoomChange(zoomLevel - 0.1)}
                className="p-1"
                aria-label="Zoom out"
              >
                <i className="fas fa-search-minus"></i>
              </Button>
              
              <Button
                variant={darkMode ? "outline-light" : "outline-dark"}
                className="p-1"
                style={{ fontSize: '0.7rem', minWidth: '35px' }}
              >
                {Math.round(zoomLevel * 100)}%
              </Button>
              
              <Button
                variant={darkMode ? "outline-light" : "outline-dark"}
                onClick={() => handleZoomChange(zoomLevel + 0.1)}
                className="p-1"
                aria-label="Zoom in"
              >
                <i className="fas fa-search-plus"></i>
              </Button>
            </ButtonGroup>
          </div>
          
          <div className="audio-controls me-1">
            <ButtonGroup size="sm">
              <Button 
                variant={darkMode ? "outline-light" : "outline-dark"}
                onClick={toggleReadingMode}
                active={!isReadingMode}
                className="p-1"
                aria-label="Toggle reading mode"
              >
                <i className={`fas ${isReadingMode ? 'fa-book' : 'fa-headphones'}`}></i>
              </Button>
              
              <Button 
                variant={darkMode ? "outline-light" : "outline-dark"}
                onClick={toggleAudio}
                className="p-1"
                aria-label={isAudioPlaying ? 'Pause audio' : 'Play audio'}
              >
                <i className={`fas ${isAudioPlaying ? 'fa-pause' : 'fa-play'}`}></i>
              </Button>
              
              {!isReadingMode && (
                <Button 
                  variant={isSpeaking ? "success" : (darkMode ? "warning" : "warning")}
                  onClick={toggleSpeaking}
                  active={isSpeaking}
                  className="p-1 text-dark fw-bold"
                  style={{ marginLeft: '5px' }}
                  aria-label="Text-to-Speech"
                  title="Click to hear text read aloud"
                >
                  <i className="fas fa-volume-up me-1"></i>
                  TTS {isSpeaking ? '(ON)' : ''}
                </Button>
              )}
            </ButtonGroup>
          </div>
          
          <div className="view-controls">
            <ButtonGroup size="sm">
              <Button 
                variant={darkMode ? "outline-light" : "outline-dark"}
                onClick={() => setShowSidebar(!showSidebar)}
                active={showSidebar}
                className="p-1"
                aria-label="Toggle sidebar"
              >
                <i className="fas fa-columns"></i>
              </Button>
              
              <Button 
                variant={darkMode ? "outline-light" : "outline-dark"}
                onClick={() => setDarkMode(!darkMode)}
                className="p-1"
                aria-label="Toggle dark mode"
              >
                <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </div>
      
      {/* Reading progress bar - only shown in listening mode */}
      {!isReadingMode && (
        <ProgressBar 
          now={readingProgress} 
          className="reading-progress" 
          style={{ height: '2px', borderRadius: 0 }}
        />
      )}
      
      <div className="pdf-content-area d-flex">
        {/* Main PDF Viewer */}
        <div className={`pdf-viewer ${showSidebar ? 'with-sidebar' : 'full-width'}`}>
          <div className="pdf-container" style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => {
                console.error("PDF load error:", error);
                console.error("Failed URL was:", pdfUrl);
                
                // Try to recover with a more specific error message
                if (pdfUrl.startsWith('blob:')) {
                  setError("Failed to load the uploaded PDF. The blob URL may have expired after page refresh. Please return to the dashboard and open the PDF again.");
                } else if (pdfUrl.startsWith('data:application/pdf;base64,')) {
                  setError("Failed to process the PDF data. The file may be too large or corrupt.");
                } else if (pdfUrl.startsWith('/pdf/')) {
                  setError("Failed to load the PDF from the server. The file may be corrupted or not a valid PDF. Please try uploading a different PDF file.");
                } else {
                  setError("Failed to load the PDF document. The file may be missing, corrupted, or not accessible.");
                }
              }}
              loading={
                <div className="text-center py-5">
                  <Spinner animation="border" />
                  <p className="mt-3">Loading PDF document...</p>
                </div>
              }
              error={
                <div className="alert alert-danger m-5">
                  <h4>Failed to load PDF document</h4>
                  <p>{error || "The PDF file could not be loaded. Please try a different PDF or check if the file exists."}</p>
                  <div className="mt-3">
                    <Button 
                      variant="primary" 
                      onClick={() => navigate('/dashboard')}
                      className="me-2"
                    >
                      Return to Dashboard
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => window.location.reload()}
                      className="me-2"
                    >
                      Reload Page
                    </Button>
                    <Button
                      variant="warning"
                      onClick={() => {
                        // Try to reload the PDF with a cache-busting parameter
                        if (pdfUrl.includes('?')) {
                          setPdfUrl(`${pdfUrl}&cache=${Date.now()}`);
                        } else {
                          setPdfUrl(`${pdfUrl}?cache=${Date.now()}`);
                        }
                        setLoading(true);
                        setError(null);
                      }}
                      className="me-2"
                    >
                      Retry Loading PDF
                    </Button>
                    <Button 
                      variant="info" 
                      onClick={analyzePdf}
                    >
                      Analyze PDF
                    </Button>
                  </div>
                </div>
              }
              noData={
                <div className="alert alert-warning m-5">
                  <h4>No PDF Selected</h4>
                  <p>Please select a PDF document to view.</p>
                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/dashboard')}
                  >
                    Return to Dashboard
                  </Button>
                </div>
              }
              className={darkMode ? 'dark-mode-pdf' : ''}
            >
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                scale={zoomLevel}
                className={darkMode ? 'dark-mode-page' : ''}
                onLoadSuccess={(page) => {
                  console.log("Page", pageNumber, "loaded successfully");
                }}
                error={
                  <div className="alert alert-danger m-3">
                    <h5>Failed to render page {pageNumber}</h5>
                    <p>There was an error displaying this page. Try a different page or document.</p>
                  </div>
                }
              />
            </Document>
          </div>
        </div>
        
        {/* Audio Information Sidebar */}
        {showSidebar && (
          <div className={`audio-sidebar p-3 ${darkMode ? 'bg-dark text-light' : 'bg-light'}`}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Audio Experience</h4>
            </div>
            
            {/* Mode switcher */}
            <div className="mode-switcher mb-3">
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="modeSwitch" 
                  checked={!isReadingMode}
                  onChange={toggleReadingMode}
                />
                <label className="form-check-label" htmlFor="modeSwitch">
                  {isReadingMode ? 'Reading Mode' : 'Listening Mode'}
                </label>
              </div>
              <p className="text-muted small mt-1">
                {isReadingMode 
                  ? 'Only background music will play continuously.' 
                  : 'Background music and synchronized sound effects will play.'}
              </p>
            </div>
            
            {/* Premium/Free indicator */}
            {currentUser?.isPremium ? (
              <div className="mb-3 p-2 bg-success text-white rounded">
                <i className="fas fa-crown me-1"></i>
                <small>
                  <strong>Premium user:</strong> Using AI for advanced analysis
                </small>
              </div>
            ) : (
              <div className="mb-3 p-2 bg-secondary text-white rounded">
                <i className="fas fa-info-circle me-1"></i>
                <small>
                  <strong>Free user:</strong> Using basic audio matching.{' '}
                  <a href="/payment" className="text-white text-decoration-underline">Upgrade to Premium</a>
                </small>
              </div>
            )}
            
            {/* Volume controls */}
            <div className="volume-controls mb-3">
              <div className="mb-2">
                <label className="form-label d-flex justify-content-between align-items-center">
                  <span><i className="fas fa-music me-1"></i> Music Volume</span>
                  <span>{Math.round(musicVolume * 100)}%</span>
                </label>
                <Form.Range 
                  value={musicVolume} 
                  onChange={handleMusicVolumeChange} 
                  min="0" 
                  max="1" 
                  step="0.1" 
                />
              </div>
              
              <div>
                <label className="form-label d-flex justify-content-between align-items-center">
                  <span><i className="fas fa-volume-up me-1"></i> Effects Volume</span>
                  <span>{Math.round(effectsVolume * 100)}%</span>
                </label>
                <Form.Range 
                  value={effectsVolume} 
                  onChange={handleEffectsVolumeChange} 
                  min="0" 
                  max="1" 
                  step="0.1" 
                />
              </div>
            </div>
            
            {/* Force Audio Button */}
            <div className="mb-3">
              <Button 
                variant={darkMode ? "danger" : "warning"} 
                size="sm"
                className="w-100"
                onClick={forceAudioButtonClick}
              >
                <i className="fas fa-volume-up me-2"></i>
                Force Audio / TTS
              </Button>
              <small className="text-muted d-block mt-1 text-center">
                Click if you cannot hear speech in listening mode
              </small>
            </div>
            
            {/* Audio settings */}
            <div className="audio-settings mb-3">
              <h5>Audio Settings</h5>
              <div className="d-grid gap-2">
                <Button 
                  variant={darkMode ? "outline-light" : "outline-primary"} 
                  size="sm"
                  onClick={toggleAudio}
                >
                  <i className={`fas ${isAudioPlaying ? 'fa-pause me-2' : 'fa-play me-2'}`}></i>
                  {isAudioPlaying ? 'Pause Audio' : 'Play Audio'}
                </Button>
                
                {!isReadingMode && (
                  <Button 
                    variant={darkMode ? "outline-light" : "outline-primary"} 
                    size="sm"
                    onClick={toggleSpeaking}
                  >
                    <i className={`fas ${isSpeaking ? 'fa-volume-mute me-2' : 'fa-volume-up me-2'}`}></i>
                    {isSpeaking ? 'Stop Text-to-Speech' : 'Start Text-to-Speech'}
                  </Button>
                )}
              </div>
            </div>
            
            {/* RAG loading indicator */}
            {isGeneratingRecommendation && (
              <div className="d-flex align-items-center bg-info bg-opacity-10 p-3 rounded mb-3">
                <Spinner animation="border" size="sm" className="me-2" />
                <div>
                  <strong>Analyzing Content</strong>
                  <p className="mb-0 small">Generating audio experience based on content...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFReaderPage; 