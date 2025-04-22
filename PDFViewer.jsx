"use client";

import React, { useState, useEffect } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin } from '@react-pdf-viewer/highlight';
import { Volume2, VolumeX, BookmarkIcon, PencilIcon } from 'lucide-react';
import useMusicPrediction from '../Hooks/useMusicPrediction';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';

const audioBaseUrl = 'https://Kom-X.github.io/Book-Reader/audio/';
const PAGES_BEFORE_PREDICTION = 3;

const PDFViewer = ({ pdfUrl }) => {
  console.group('[PDFViewer] Initialization');
  console.log('Initializing with URL:', pdfUrl);
  console.groupEnd();

  const [highlights, setHighlights] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState('highlights');
  const [currentScript, setCurrentScript] = useState('');
  const [pageChangeCount, setPageChangeCount] = useState(0);
  const [audio, setAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [lastProcessedPage, setLastProcessedPage] = useState(null);

  const { prediction, loading, error, fetchPrediction } = useMusicPrediction();

  useEffect(() => {
    console.group('[AI State Update]');
    console.log({
      hasPrediction: Boolean(prediction),
      predictionDetails: prediction,
      loading,
      error,
      hasCurrentScript: Boolean(currentScript),
      currentScriptLength: currentScript?.length
    });
    console.groupEnd();
  }, [prediction, loading, error, currentScript]);

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [],
  });

  const highlightPluginInstance = highlightPlugin({
    onHighlightClick: (highlight) => {
      console.group('[Highlight Interaction]');
      console.log('Clicked highlight:', highlight);
      
      if (highlight.note) {
        const newNote = prompt('Edit note:', highlight.note);
        if (newNote !== null) {
          console.log('Updating note:', {
            id: highlight.id,
            oldNote: highlight.note,
            newNote
          });
          setHighlights((prev) =>
            prev.map((h) => (h.id === highlight.id ? { ...h, note: newNote } : h))
          );
        }
      }
      console.groupEnd();
    },
  });

  const extractTextFromPage = async (page) => {
    console.group('[Text Extraction]');
    console.time('extractText');
    console.log('Starting extraction for page:', page.pageNumber);
    
    try {
      const textContent = await page.getTextContent();
      const extractedText = textContent.items.map(item => item.str).join(' ').trim();
      
      console.log('Extraction completed', {
        pageNumber: page.pageNumber,
        characterCount: extractedText.length,
        preview: extractedText.substring(0, 100) + '...'
      });
      console.timeEnd('extractText');
      console.groupEnd();
      return extractedText;
    } catch (error) {
      console.error('Extraction failed:', error);
      console.groupEnd();
      return '';
    }
  };

  const handlePageChange = async ({ currentPage, doc }) => {
    console.group('[Page Change Event]');
    console.log('Processing page change', { 
      currentPage,
      previousPage: lastProcessedPage,
      currentPageChangeCount: pageChangeCount 
    });
    
    try {
      if (!doc) {
        console.error('No document available');
        console.groupEnd();
        return;
      }

      if (lastProcessedPage === currentPage) {
        console.log('Skipping duplicate page processing');
        console.groupEnd();
        return;
      }

      const page = await doc.getPage(currentPage);
      const text = await extractTextFromPage(page);
      const firstParagraph = text.substring(0, 500);
      
      console.log('Text processed', {
        pageNumber: currentPage,
        totalTextLength: text.length,
        excerptLength: firstParagraph.length,
        preview: firstParagraph.substring(0, 100) + '...'
      });
      
      setCurrentScript(firstParagraph);
      setPageChangeCount(prev => prev + 1);
      setLastProcessedPage(currentPage);
      
      console.log('State updated', {
        newPageChangeCount: pageChangeCount + 1,
        willTriggerAI: (pageChangeCount + 1) >= PAGES_BEFORE_PREDICTION
      });
      
    } catch (error) {
      console.error('Error during page change:', error);
    }
    console.groupEnd();
  };

  const playBackgroundMusic = async (musicId) => {
    console.group('[Audio Playback]');
    console.log('Attempting to play:', musicId);
    
    if (!musicId) {
      console.error('No music ID provided');
      console.groupEnd();
      return;
    }

    try {
      if (audio) {
        console.log('Stopping previous audio');
        audio.pause();
        audio.currentTime = 0;
      }

      const audioUrl = `${audioBaseUrl}${musicId}.mp3`;
      console.log('Loading audio from:', audioUrl);
      
      const newAudio = new Audio(audioUrl);
      newAudio.loop = true;

      newAudio.addEventListener('canplaythrough', () => {
        console.log('Audio ready:', musicId);
      });

      newAudio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        setAudioError('Failed to load audio');
        setIsPlaying(false);
      });

      await newAudio.play();
      console.log('Playback started successfully');
      setAudio(newAudio);
      setIsPlaying(true);
      setAudioError(null);

    } catch (error) {
      console.error('Playback failed:', error);
      setAudioError('Failed to play audio');
      setIsPlaying(false);
    }
    console.groupEnd();
  };

  useEffect(() => {
    if (currentScript && pageChangeCount >= PAGES_BEFORE_PREDICTION) {
      console.group('[AI Prediction Request]');
      console.log('Preparing prediction request', {
        scriptLength: currentScript.length,
        pageChangeCount
      });
      
      console.log('Text chunk being sent to AI:');
      console.log('='.repeat(50));
      console.log(currentScript);
      console.log('='.repeat(50));
      
      const aiPayload = {
        text: currentScript,
        timestamp: new Date().toISOString(),
        pageChanges: pageChangeCount,
        metadata: {
          textLength: currentScript.length,
          containsText: currentScript.length > 0
        }
      };
      console.log('Request payload:', aiPayload);
      
      fetchPrediction(currentScript);
      setPageChangeCount(0);
      
      console.groupEnd();
    } else {
      console.log('[AI Prediction] Waiting for more page changes', {
        hasCurrentScript: Boolean(currentScript),
        pageChangeCount,
        remainingChanges: PAGES_BEFORE_PREDICTION - pageChangeCount
      });
    }
  }, [currentScript, pageChangeCount, fetchPrediction]);

  useEffect(() => {
    if (prediction || loading || error) {
      console.group('[AI Response Processing]');
      console.log({
        hasPrediction: Boolean(prediction),
        isLoading: loading,
        hasError: Boolean(error),
        backgroundMusic: prediction?.background_music
      });

      if (prediction && !loading && prediction.background_music) {
        console.log('Triggering music playback:', prediction.background_music);
        playBackgroundMusic(prediction.background_music);
      }

      if (error) {
        console.error('AI prediction error:', error);
      }

      console.groupEnd();
    }
  }, [prediction, loading, error]);

  useEffect(() => {
    return () => {
      if (audio) {
        console.log('[Cleanup] Stopping audio playback');
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  const toggleAudio = () => {
    console.group('[Audio Control]');
    console.log('Toggle requested', {
      currentState: isPlaying,
      hasAudio: Boolean(audio)
    });

    if (!audio) {
      console.log('No audio available to toggle');
      console.groupEnd();
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
        console.log('Audio paused');
      } else {
        audio.play();
        console.log('Audio resumed');
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Toggle failed:', error);
      setAudioError('Failed to toggle audio');
    }
    console.groupEnd();
  };

  const handleTextSelection = (content, info) => {
    console.group('[Text Selection]');
    console.log('New selection detected', {
      selectedText: content.selectedText,
      pageIndex: info.pageIndex,
      selectionLength: content.selectedText.length
    });

    const note = prompt('Add a note (optional):');
    
    const highlight = {
      id: `highlight-${Date.now()}`,
      content: content.selectedText,
      position: {
        pageIndex: info.pageIndex,
        boundingRect: info.boundingRect,
      },
      note: note || '',
      timestamp: new Date().toLocaleString(),
    };

    console.log('Creating highlight:', highlight);
    setHighlights(prev => [...prev, highlight]);
    console.groupEnd();
  };

  useEffect(() => {
    console.log('[Highlights Updated]', {
      count: highlights.length,
      latest: highlights[highlights.length - 1]
    });
  }, [highlights]);

  useEffect(() => {
    console.log('[Sidebar State]', { visible: showSidebar });
  }, [showSidebar]);

  useEffect(() => {
    console.log('[Tab Change]', { activeTab });
  }, [activeTab]);

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-800">PDF Reader</h1>
              <div className="h-6 w-px bg-gray-200" />
              <button 
                onClick={() => setShowSidebar(!showSidebar)}
                className="text-gray-600 hover:text-gray-900"
              >
                {showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
              </button>
              <button
                onClick={toggleAudio}
                disabled={loading}
                className={`flex items-center space-x-2 ${
                  loading 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {isPlaying ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
                <span>{isPlaying ? 'Mute' : 'Unmute'}</span>
              </button>
              {loading && <span className="text-gray-500">Loading audio...</span>}
              {audioError && <span className="text-red-500 text-sm">{audioError}</span>}
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden bg-gray-100 p-6">
          <div className="h-full bg-white rounded-xl shadow-sm">
            <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.7.107/pdf.worker.min.js">
              <Viewer
                fileUrl={pdfUrl}
                plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
                onPageChange={handlePageChange}
                onTextSelection={handleTextSelection}
                className="rounded-xl"
              />
            </Worker>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 border-l border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('highlights')}
                className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'highlights' 
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <PencilIcon className="w-5 h-5 mr-2" />
                Highlights
              </button>
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'bookmarks' 
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BookmarkIcon className="w-5 h-5 mr-2" />
                Bookmarks
              </button>
            </div>
          </div>

          <div className="p-4">
            {activeTab === 'highlights' && (
              <div className="space-y-4">
                {highlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="text-sm text-gray-500 mb-2">
                      {highlight.timestamp}
                    </div>
                    <p className="text-gray-800 mb-2">{highlight.content}</p>
                    {highlight.note && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">{highlight.note}</p>
                      </div>
                    )}
                  </div>
                ))}
                {highlights.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No highlights yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Select text to add highlights
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;