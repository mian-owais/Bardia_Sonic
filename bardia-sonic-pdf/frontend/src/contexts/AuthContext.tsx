import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPremium: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Mock users for presentation
const MOCK_USERS: Record<string, { id: string; name: string; email: string; password: string; isPremium: boolean }> = {
  'user@example.com': {
    id: '1',
    name: 'Demo User',
    email: 'user@example.com',
    password: 'password',
    isPremium: false
  },
  'admin@example.com': {
    id: '2',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password',
    isPremium: true
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage on app load
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // For presentation, use mock authentication
      const mockUser = MOCK_USERS[email];
      if (!mockUser || mockUser.password !== password) {
        throw new Error('Invalid email or password');
      }
      
      const user = {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        isPremium: mockUser.isPremium
      };
      
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // No need to verify with backend for presentation
      console.log('Logged in successfully:', user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      // For presentation, just create a new mock user
      if (MOCK_USERS[email]) {
        throw new Error('Email is already in use');
      }
      
      const newUser = {
        id: (Object.keys(MOCK_USERS).length + 1).toString(),
        name,
        email,
        password,
        isPremium: false
      };
      
      // Add to mock users
      MOCK_USERS[email] = newUser;
      
      // Set as current user
      const user = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isPremium: newUser.isPremium
      };
      
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      console.log('Registered successfully:', user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };
  
  const upgradeToPremium = () => {
    if (currentUser) {
      const upgradedUser = {
        ...currentUser,
        isPremium: true
      };
      setCurrentUser(upgradedUser);
      localStorage.setItem('currentUser', JSON.stringify(upgradedUser));
      
      // Also update in mock users
      if (MOCK_USERS[currentUser.email]) {
        MOCK_USERS[currentUser.email].isPremium = true;
      }
    }
  };

  const value = {
    currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    login,
    register,
    logout,
    upgradeToPremium
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}; 