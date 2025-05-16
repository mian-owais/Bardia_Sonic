import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PDFReaderPage from './pages/PDFReaderPage';
import DashboardPage from './pages/DashboardPage';
import PaymentPage from './pages/PaymentPage';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';
import AudioInitializer from './components/AudioInitializer';
import { useAuth } from './contexts/AuthContext';
import { audioUtils } from './utils';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/global.css'; // Import our custom global styles

const App: React.FC = () => {
  const { isLoading } = useAuth();
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Set up audio interaction handler on app initialization
  useEffect(() => {
    // Initialize audio interaction handler to help with autoplay restrictions
    try {
      audioUtils.setupAudioInteractionHandler();
    } catch (error) {
      console.error("Error setting up audio interaction handler:", error);
      // Continue even if this fails - the AudioInitializer component will handle it
    }
    
    // Initialize Web Speech API by creating a silent speech synthesis instance
    // This helps with browser restrictions in some cases
    if ('speechSynthesis' in window) {
      // First, make sure any ongoing speech is canceled
      window.speechSynthesis.cancel();
      
      // Wait a bit to ensure all is clear
      setTimeout(() => {
        try {
          // Create a silent utterance with minimal content
          const utterance = new SpeechSynthesisUtterance(' ');
          utterance.volume = 0;
          utterance.rate = 1;
          
          // Some browsers need onend handler to properly initialize
          utterance.onend = () => {
            console.log('Initial speech synthesis completed');
          };
          
          // Handle any potential errors silently
          utterance.onerror = (err) => {
            if (err.error !== 'interrupted') {
              console.warn('Speech synthesis initialization error:', err.error);
            }
          };
          
          // Speak and then cancel immediately to avoid any actual speech
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn('Speech synthesis initialization failed:', e);
        }
        
        console.log('Speech synthesis initialized');
      }, 100);
    }
  }, []);

  // Handle successful audio initialization
  const handleAudioInitialized = () => {
    console.log('Audio system initialized from AudioInitializer');
    setAudioInitialized(true);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border spinner-custom" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <NavBar />
      {/* Audio Initializer - will prompt for user interaction if needed */}
      <AudioInitializer onComplete={handleAudioInitialized} />
      
      {/* Main content wrapper with padding for fixed navbar */}
      <div className="main-content" style={{ paddingTop: '76px', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment" 
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reader/:pdfId" 
            element={
              <ProtectedRoute>
                <PDFReaderPage isAudioInitialized={audioInitialized} />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </div>
  );
};

export default App; 