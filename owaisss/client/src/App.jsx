import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { useState, useMemo } from 'react';
import { lightTheme, darkTheme } from './theme.js';
import TopBar from "./components/layout/TopBar.jsx";
import Dashboard from "./components/dashboard/Dashboard.jsx";
import Settings from './components/settings/Settings.jsx';
import Profile from './components/profile/Profile.jsx';
import Documents from './components/documents/Documents.jsx';
import LandingPage from './components/landing/LandingPage.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import Login from './components/auth/Login.jsx';
import Register from './components/auth/Register.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

// App.jsx or wherever you render PDFs

import '../src/pdfjs-worker.js';


// Configure router future flags
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

const Layout = () => {
  return (
    <>
      <TopBar />
      <Box sx={{ mt: 8, pt: 2 }}>
        <Outlet />
      </Box>
    </>
  );
};

const AppContent = () => {
  const [mode, setMode] = useState('light');
  const { isAuthenticated, isLoading } = useAuth();
  
  const theme = useMemo(() => {
    return mode === 'light' ? lightTheme : darkTheme;
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router future={router.future}>
        <Routes>
          <Route 
            path="/" 
            element={<LandingPage toggleTheme={toggleTheme} mode={mode} />} 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Layout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/documents" element={<Documents />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
