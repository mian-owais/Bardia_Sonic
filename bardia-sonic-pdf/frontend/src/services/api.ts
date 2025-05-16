import axios from 'axios';

// Determine the base URL for API calls based on environment
// In development, the proxy in vite.config.js will handle routing to the backend
const BASE_URL = '/api';

console.log("API connecting to:", BASE_URL);

// Create axios instance with configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true  // Enable CORS credentials
});

// Log all API requests for debugging
api.interceptors.request.use(request => {
  console.log('API Request:', request.method?.toUpperCase(), request.url);
  return request;
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    // If token exists, add it to request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', response.status, response.config.url);
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with error status
      console.error('API Error Response:', error.response.status, error.response.data, error.config?.url);
      
      // Handle authentication errors
      if (error.response.status === 401) {
        // Redirect to login or clear authentication
        localStorage.removeItem('authToken');
        // You might want to redirect to login page here
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Connection Error:', error.message, 'URL:', error.config?.url);
      console.log('Check if the backend server is running on port 5000');
    } else {
      // Error in setting up the request
      console.error('API Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api; 