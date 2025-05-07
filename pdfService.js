import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Get the authentication token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create an axios instance with default headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Add timeout for long-running operations
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.request);
    } else {
      // Other errors
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const uploadPDF = async (file) => {
  try {
    const formData = new FormData();
    formData.append('document', file);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload Progress: ${percentCompleted}%`);
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
};

export const getPDFDocuments = async () => {
  try {
    const response = await api.get('/documents');
    return response.data.map((doc) => ({
      ...doc,
      url: doc.url ? (doc.url.startsWith('http') ? doc.url : `${API_URL}${doc.url}`) : null
    }));
  } catch (error) {
    console.error('Error fetching PDF documents:', error);
    throw error;
  }
};

export const deletePDFDocument = async (id) => {
  try {
    await api.delete(`/documents/${id}`);
  } catch (error) {
    console.error('Error deleting PDF document:', error);
    throw error;
  }
};

export const convertPDFToAudio = async (id) => {
  try {
    const response = await api.post(`/documents/process/${id}`, null, {
      timeout: 300000, // 5 minutes timeout for conversion
    });
    return response.data;
  } catch (error) {
    console.error('Error converting PDF to audio:', error);
    throw error;
  }
};

export const getPDFDocumentById = async (id) => {
  try {
    const response = await api.get(`/documents/${id}`);
    const doc = response.data;
    return {
      ...doc,
      url: doc.url ? (doc.url.startsWith('http') ? doc.url : `${API_URL}${doc.url}`) : null
    };
  } catch (error) {
    console.error('Error fetching PDF document:', error);
    throw error;
  }
}; 