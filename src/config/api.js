// src/config/api.js - Optimized version for faster login
import axios from 'axios';

// API Configuration - Handles both local and deployed backends
const getApiBaseUrl = () => {
  // 1. Check environment variable first (manual override)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 2. Check if we're in development mode
  if (import.meta.env.DEV) {
    // Development mode - use local backend
    return 'http://localhost:8080/api';
  }
  
  // 3. Production mode - use deployed backend
  return 'https://quiz-tournament-api.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log which API URL is being used
console.log(`🌐 API Configuration: Using ${API_BASE_URL}`);

// Environment detection utility
export const isLocalEnvironment = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

// Backend health check with fallback
export const detectBackend = async () => {
  const localUrl = 'http://localhost:8080/api';
  const deployedUrl = 'https://quiz-tournament-api.onrender.com/api';
  
  const testEndpoint = async (url) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${url}/test/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  };
  
  // In development, try local first
  if (import.meta.env.DEV) {
    console.log('🔍 Development mode: Checking local backend...');
    const localWorks = await testEndpoint(localUrl);
    if (localWorks) {
      console.log('✅ Local backend is available');
      return localUrl;
    } else {
      console.log('⚠️ Local backend unavailable, trying deployed...');
      const deployedWorks = await testEndpoint(deployedUrl);
      if (deployedWorks) {
        console.log('✅ Deployed backend is available');
        return deployedUrl;
      }
    }
  } else {
    // In production, use deployed backend
    console.log('🚀 Production mode: Using deployed backend...');
    const deployedWorks = await testEndpoint(deployedUrl);
    if (deployedWorks) {
      console.log('✅ Deployed backend is available');
      return deployedUrl;
    }
  }
  
  console.log('❌ No backend available, using default');
  return deployedUrl; // Fallback to deployed
};

// Create axios instance with optimized settings
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Reduced from 30s to 15s
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic API instance that can switch backends
let currentApiUrl = API_BASE_URL;

export const switchBackend = async (forceDetect = false) => {
  if (forceDetect) {
    const detectedUrl = await detectBackend();
    if (detectedUrl !== currentApiUrl) {
      currentApiUrl = detectedUrl;
      api.defaults.baseURL = currentApiUrl;
      console.log(`🔄 Switched to backend: ${currentApiUrl}`);
      clearTournamentCache(); // Clear cache when switching
      return true;
    }
  }
  return false;
};

// Initialize with backend detection
export const initializeApi = async () => {
  try {
    const detectedUrl = await detectBackend();
    if (detectedUrl !== currentApiUrl) {
      currentApiUrl = detectedUrl;
      api.defaults.baseURL = currentApiUrl;
      console.log(`🚀 Initialized with backend: ${currentApiUrl}`);
    }
  } catch (error) {
    console.warn('⚠️ Backend detection failed, using default:', currentApiUrl);
  }
};

export const getCurrentApiUrl = () => currentApiUrl;

// Request interceptor - simplified with backend switching
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ensure we're using the current API URL
    config.baseURL = currentApiUrl;
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - with backend switching on errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?message=Session expired';
      }
      return Promise.reject(error);
    }
    
    // Handle 500/503 errors by trying to switch backend
    if (error.response?.status >= 500 || error.code === 'NETWORK_ERROR') {
      console.log('🔄 Server error detected, attempting backend switch...');
      const switched = await switchBackend(true);
      
      if (switched && error.config && !error.config._retry) {
        error.config._retry = true;
        error.config.baseURL = currentApiUrl;
        console.log('🔄 Retrying request with new backend...');
        return api.request(error.config);
      }
    }
    
    return Promise.reject(error);
  }
);

// Fast API health check - no timeout, quick response
export const checkApiHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(`${currentApiUrl}/test/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    // Try switching backend if health check fails
    console.log('🔄 Health check failed, trying to switch backend...');
    const switched = await switchBackend(true);
    if (switched) {
      try {
        const response = await fetch(`${currentApiUrl}/test/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return response.ok;
      } catch (retryError) {
        return false;
      }
    }
    return false;
  }
};

// Minimal warmup - only if really needed
export const warmupApi = async () => {
  try {
    // Try current backend first
    const response = await fetch(`${currentApiUrl}/test/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      return true;
    }
    
    // If failed, try switching backend
    const switched = await switchBackend(true);
    return switched;
  } catch (error) {
    const switched = await switchBackend(true);
    return switched;
  }
};

// Simple cache without over-engineering
let tournamentCache = null;
let cacheTime = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes only

export const clearTournamentCache = () => {
  tournamentCache = null;
  cacheTime = null;
};

// Minimal sanitization - only for critical issues
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  // Only keep essential properties
  const safe = {};
  const essentialProps = ['id', 'name', 'category', 'difficulty', 'startDate', 'endDate', 'minimumPassingScore', 'attempts'];
  
  for (const prop of essentialProps) {
    if (data[prop] !== undefined) {
      safe[prop] = data[prop];
    }
  }
  
  // Handle creator simply
  if (data.creator) {
    safe.creator = {
      id: data.creator.id,
      firstName: data.creator.firstName,
      lastName: data.creator.lastName
    };
  }
  
  return safe;
};

// Auth API - optimized for speed
export const authAPI = {
  login: (credentials) => {
    console.log('🔐 Attempting login...');
    const startTime = Date.now();
    
    return api.post('/auth/signin', credentials)
      .then(response => {
        console.log(`✅ Login successful in ${Date.now() - startTime}ms`);
        return response;
      })
      .catch(error => {
        console.log(`❌ Login failed in ${Date.now() - startTime}ms`);
        throw error;
      });
  },
  
  register: (userData, userType) => {
    const endpoint = userType === 'admin' ? '/auth/signup/admin' : '/auth/signup/player';
    return api.post(endpoint, userData);
  },
  
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// Tournament API - with smart caching
export const tournamentAPI = {
  getAll: async () => {
    // Check cache first
    if (tournamentCache && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
      return { data: tournamentCache };
    }
    
    const response = await api.get('/tournaments');
    const sanitized = sanitizeData(response.data);
    
    // Update cache
    tournamentCache = sanitized;
    cacheTime = Date.now();
    
    return { ...response, data: sanitized };
  },
  
  getById: (id) => api.get(`/tournaments/${id}`),
  
  create: async (data) => {
    const response = await api.post('/tournaments', data);
    clearTournamentCache(); // Clear cache on create
    return response;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/tournaments/${id}`, data);
    clearTournamentCache(); // Clear cache on update
    return response;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/tournaments/${id}`);
    clearTournamentCache(); // Clear cache on delete
    return response;
  },
  
  getQuestions: (id) => api.get(`/tournaments/${id}/questions`),
  participate: (id, answers) => api.post(`/tournaments/${id}/participate`, answers),
  getScores: (id) => api.get(`/tournaments/${id}/scores`),
  like: (id) => api.post(`/tournaments/${id}/like`),
  unlike: (id) => api.delete(`/tournaments/${id}/like`),
  getLikes: (id) => api.get(`/tournaments/${id}/likes`),
  getOngoing: () => api.get('/tournaments/player/ongoing'),
  getUpcoming: () => api.get('/tournaments/player/upcoming'),
  getPast: () => api.get('/tournaments/player/past'),
  getParticipated: () => api.get('/tournaments/player/participated'),
};

// User API
export const userAPI = {
  getCurrentUser: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  getUserById: (id) => api.get(`/users/${id}`),
};

// Test API
export const testAPI = {
  health: () => api.get('/test/health'),
  info: () => api.get('/test/info'),
  categories: () => api.get('/test/categories'),
};

export default api;