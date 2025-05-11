import axios from 'axios';

// Create axios instance with default config
const instance = axios.create({
    baseURL: 'http://localhost:5000/api'
});

// Add a request interceptor
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default instance;
