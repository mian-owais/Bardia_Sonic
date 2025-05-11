import { 
  Box, 
  Typography, 
  Paper, 
  Stack, 
  IconButton,
  Slider,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
  alpha,
  Chip,
  Tooltip,
  CircularProgress,
  Grid,
  Alert
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  VolumeOff,
  Speed,
  Bookmark,
  NoteAdd,
  Highlight,
  Share,
  Download,
  AutoFixHigh,
  Translate
} from '@mui/icons-material';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Document, Page } from 'react-pdf';
import * as pdfjs from 'pdfjs-dist';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set the worker source to use CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const MotionPaper = motion.create(Paper);

const PDFAudioPlayer = ({ pdfUrl, audioUrl }) => {
  const theme = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [notes, setNotes] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [isTakingNote, setIsTakingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioError, setAudioError] = useState(null);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [audioChunks, setAudioChunks] = useState([]);
  const audioRef = useRef(null);
  const pdfRef = useRef(null);

  // Initialize Gemini API
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  // Load audio chunks with authorization
  useEffect(() => {
    const loadAudioChunks = async () => {
      try {
        if (!audioUrl) {
          setAudioError('No audio URL provided');
          return;
        }
        // Extract document ID from the audio file name (before _chunk or .)
        const audioFileName = audioUrl.split('/').pop();
        const documentId = audioFileName.split('_chunk')[0].split('.')[0];
        if (!documentId) {
          setAudioError('Invalid audio URL format');
          return;
        }
        // Use the correct backend endpoint
        const response = await fetch(`/api/documents/audio/${documentId}/chunks`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            setAudioError('Authentication required. Please log in again.');
            return;
          }
          throw new Error(`Failed to load audio chunks: ${response.status}`);
        }
        const chunks = await response.json();
        if (Array.isArray(chunks)) {
          setAudioChunks(chunks);
        } else {
          throw new Error('Invalid chunks data received');
        }
      } catch (error) {
        console.error('Error loading audio chunks:', error);
        setAudioError(error.message || 'Failed to load audio chunks');
      }
    };
    if (audioUrl) {
      loadAudioChunks();
    }
  }, [audioUrl]);

  // Handle audio chunk transitions
  const handleChunkEnded = () => {
    if (currentChunk < audioChunks.length - 1) {
      setCurrentChunk(prev => prev + 1);
      audioRef.current.src = audioChunks[currentChunk + 1].url;
      audioRef.current.play();
    } else {
      setIsPlaying(false);
      setCurrentChunk(0);
    }
  };

  // Update audio source when chunk changes
  useEffect(() => {
    if (audioRef.current && audioChunks.length > 0) {
      audioRef.current.src = audioChunks[currentChunk].url;
    }
  }, [currentChunk, audioChunks]);

  const handlePlayPause = async () => {
    if (!audioUrl || !audioChunks.length) {
      setAudioError('No audio available. Please convert the PDF to audio first.');
      return;
    }

    if (!audioRef.current) {
      setAudioError('Audio player not initialized');
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Playback error:', error?.message || 'Unknown error');
      setAudioError('Failed to play audio: ' + (error?.message || 'Unknown error'));
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      // Update current page based on time (assuming 30 seconds per page)
      const page = Math.floor(audioRef.current.currentTime / 30) + 1;
      setCurrentPage(Math.min(page, numPages || 1));
    }
  };

  const handleVolumeChange = (event, newValue) => {
    const volume = newValue;
    setVolume(volume);
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = volume === 0;
    }
    setIsMuted(volume === 0);
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleAddNote = () => {
    if (noteText.trim() && audioRef.current) {
      const newNote = {
        id: Date.now().toString(),
        text: noteText,
        timestamp: audioRef.current.currentTime,
        page: currentPage
      };
      setNotes([...notes, newNote]);
      setNoteText('');
      setIsTakingNote(false);
    }
  };

  const handleHighlight = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() && audioRef.current) {
      const newHighlight = {
        id: Date.now().toString(),
        text: selection.toString(),
        startTime: audioRef.current.currentTime,
        endTime: audioRef.current.currentTime + 5, // 5 seconds duration
        page: currentPage
      };
      setHighlights([...highlights, newHighlight]);
    }
  };

  const generateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Summarize the following PDF content in 3 key points: ${notes.map(note => note.text).join(' ')}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log('Generated Summary:', text);
      // TODO: Display summary in a modal or update state
    } catch (error) {
      console.error('Error generating summary:', error);
    }
    setIsGeneratingSummary(false);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  // Add an effect to check if the audio file is actually reachable
  useEffect(() => {
    if (audioUrl) {
      fetch(audioUrl, { method: 'HEAD' })
        .then(res => {
          if (!res.ok) {
            setAudioError('Audio file not found (404). Please try reconverting the PDF.');
          }
        })
        .catch(() => {
          setAudioError('Audio file could not be reached.');
        });
    }
  }, [audioUrl]);

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Grid container spacing={3} sx={{ flex: 1 }}>
        {/* PDF Viewer */}
        <Grid item xs={12} md={8}>
          <MotionPaper
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
              p: 3,
              height: '100%',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              overflow: 'auto'
            }}
          >
            <Box ref={pdfRef} sx={{ position: 'relative' }}>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<CircularProgress />}
                  onLoadError={(error) => console.error('PDF load error:', error)}
                >
                  <Page
                    pageNumber={currentPage}
                    width={pdfRef.current?.clientWidth}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Document>
              )}
              {highlights.map(highlight => (
                highlight.page === currentPage && (
                  <Box
                    key={highlight.id}
                    sx={{
                      position: 'absolute',
                      background: alpha(theme.palette.primary.main, 0.2),
                      borderRadius: 1,
                      p: 0.5
                    }}
                  >
                    {highlight.text}
                  </Box>
                )
              ))}
            </Box>
          </MotionPaper>
        </Grid>

        {/* Controls and Notes */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Audio Player */}
            <MotionPaper
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              sx={{
                p: 3,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
              }}
            >
              <Stack spacing={2}>
                {audioError && (
                  <Alert severity="error">{audioError}</Alert>
                )}
                {!audioUrl && (
                  <Alert severity="warning">No audio available. Please convert the PDF to audio.</Alert>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}
                  </Typography>
                </Box>
                <Slider
                  value={currentTime}
                  max={duration}
                  onChange={(_, value) => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = value;
                    }
                  }}
                  disabled={!audioUrl}
                />
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Tooltip title="Playback Speed">
                    <span>
                      <IconButton 
                        onClick={() => handlePlaybackRateChange(playbackRate === 1 ? 0.5 : 1)} 
                        disabled={!audioUrl}
                        size="small"
                      >
                        <Speed />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Previous">
                    <span>
                      <IconButton 
                        disabled={!audioUrl}
                        size="small"
                      >
                        <SkipPrevious />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={isPlaying ? "Pause" : "Play"}>
                    <span>
                      <IconButton 
                        onClick={handlePlayPause} 
                        size="large" 
                        disabled={!audioUrl}
                      >
                        {isPlaying ? <Pause /> : <PlayArrow />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Next">
                    <span>
                      <IconButton 
                        disabled={!audioUrl}
                        size="small"
                      >
                        <SkipNext />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={isMuted ? "Unmute" : "Mute"}>
                    <span>
                      <IconButton 
                        onClick={() => setIsMuted(!isMuted)} 
                        disabled={!audioUrl}
                        size="small"
                      >
                        {isMuted ? <VolumeOff /> : <VolumeUp />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
                <Slider
                  value={volume}
                  onChange={handleVolumeChange}
                  disabled={!audioUrl}
                />
              </Stack>
            </MotionPaper>

            {/* Notes Section */}
            <MotionPaper
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              sx={{
                p: 3,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                flex: 1,
                overflow: 'auto'
              }}
            >
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Notes</Typography>
                  <Button
                    startIcon={<NoteAdd />}
                    onClick={() => setIsTakingNote(true)}
                    variant="outlined"
                    size="small"
                  >
                    Add Note
                  </Button>
                </Box>
                {isTakingNote && (
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Type your note here..."
                    />
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button onClick={handleAddNote} variant="contained">
                        Save
                      </Button>
                      <Button onClick={() => setIsTakingNote(false)}>
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}
                <List>
                  {notes.map((note) => (
                    <ListItem key={note.id}>
                      <ListItemText
                        primary={note.text}
                        secondary={`Page ${note.page} - ${Math.floor(note.timestamp / 60)}:${(note.timestamp % 60).toFixed(0).padStart(2, '0')}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Stack>
            </MotionPaper>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Highlight Text">
                <span>
                  <IconButton onClick={handleHighlight}>
                    <Highlight />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Generate Summary">
                <span>
                  <IconButton onClick={generateSummary} disabled={isGeneratingSummary || !notes.length}>
                    {isGeneratingSummary ? <CircularProgress size={24} /> : <AutoFixHigh />}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Translate">
                <span>
                  <IconButton>
                    <Translate />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Share">
                <span>
                  <IconButton>
                    <Share />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Download">
                <span>
                  <IconButton>
                    <Download />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      {/* Hidden Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleChunkEnded}
          onError={(e) => {
            const error = e.target.error;
            setAudioError('Audio playback error: ' + (error?.message || 'Unknown error'));
          }}
        >
          {audioChunks[currentChunk]?.url && (
            <source src={audioChunks[currentChunk].url} type="audio/mpeg" />
          )}
          Your browser does not support the audio element.
        </audio>
      )}
    </Box>
  );
};

export default PDFAudioPlayer;