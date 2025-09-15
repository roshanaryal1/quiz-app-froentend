// src/config/api.js - Optimized version
import axios from 'axios';

// API Configuration with fallback and timeout
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://quiz-tournament-api.onrender.com/api';

// Create axios instance with optimized settings
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout instead of default
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request timeout for slow responses
let requestTimeouts = new Map();

// Request interceptor with timeout handling
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date().getTime() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    // Log slow requests
    const duration = new Date().getTime() - response.config.metadata.startTime;
    if (duration > 3000) {
      console.warn(`Slow API request: ${response.config.url} took ${duration}ms`);
    }
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - API might be sleeping');
    }
    
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - clearing auth data and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Use React Router navigation if available, otherwise use window.location
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?message=Your session has expired. Please log in again.';
      }
    } else if (error.response?.status === 403) {
      console.log('403 Forbidden - user does not have permission');
      // Don't redirect, let the component handle the 403 error
    }
    
    return Promise.reject(error);
  }
);

// Health check function
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/test/health', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

// Warmup function to wake up sleeping API
export const warmupApi = async () => {
  try {
    console.log('Warming up API...');
    const response = await api.get('/test/health', { timeout: 30000 });
    console.log('API warmed up successfully');
    return true;
  } catch (error) {
    console.error('API warmup failed:', error);
    return false;
  }
};

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/signin', credentials),
  registerAdmin: (userData) => api.post('/auth/signup/admin', userData),
  registerPlayer: (userData) => api.post('/auth/signup/player', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// Tournament API calls with caching
const tournamentCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

export const tournamentAPI = {
  getAll: async () => {
    const cacheKey = 'tournaments_all';
    const cached = tournamentCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { data: cached.data };
    }
    
    const response = await api.get('/tournaments');
    tournamentCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
    
    return response;
  },
  
  getById: (id) => api.get(`/tournaments/${id}`),
  create: (tournamentData) => {
    tournamentCache.clear(); // Clear cache on create
    return api.post('/tournaments', tournamentData);
  },
  update: (id, tournamentData) => {
    tournamentCache.clear(); // Clear cache on update
    return api.put(`/tournaments/${id}`, tournamentData);
  },
  delete: (id) => {
    tournamentCache.clear(); // Clear cache on delete
    return api.delete(`/tournaments/${id}`);
  },
  getQuestions: (id) => api.get(`/tournaments/${id}/questions`),
  participate: (id, answers) => api.post(`/tournaments/${id}/participate`, { answers }),
  getScores: (id) => api.get(`/tournaments/${id}/scores`),
  like: (id) => api.post(`/tournaments/${id}/like`),
  unlike: (id) => api.delete(`/tournaments/${id}/like`),
  getLikes: (id) => api.get(`/tournaments/${id}/likes`),
  getOngoing: () => api.get('/tournaments/player/ongoing'),
  getUpcoming: () => api.get('/tournaments/player/upcoming'),
  getPast: () => api.get('/tournaments/player/past'),
  getParticipated: () => api.get('/tournaments/player/participated'),
};

// User API calls
export const userAPI = {
  getCurrentUser: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData),
  getUserById: (id) => api.get(`/users/${id}`),
};

// Test API calls
export const testAPI = {
  health: () => api.get('/test/health'),
  info: () => api.get('/test/info'),
  categories: () => api.get('/test/categories'),
};

export default api;