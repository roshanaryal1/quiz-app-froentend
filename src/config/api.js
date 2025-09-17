// src/config/api.js - Complete fixed version
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
console.log(`API Configuration: Using ${API_BASE_URL}`);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic API instance that can switch backends
let currentApiUrl = API_BASE_URL;

// Backend health check with fallback
export const detectBackend = async () => {
  const localUrl = 'http://localhost:8080/api';
  const deployedUrl = 'https://quiz-tournament-api.onrender.com/api';
  
  const testEndpoint = async (url) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${url}/test/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log(`Backend test failed for ${url}:`, error.message);
      return false;
    }
  };
  
  // In development, try local first
  if (import.meta.env.DEV) {
    console.log('Development mode: Checking local backend...');
    const localWorks = await testEndpoint(localUrl);
    if (localWorks) {
      console.log('Local backend is available');
      return localUrl;
    } else {
      console.log('Local backend unavailable, trying deployed...');
      const deployedWorks = await testEndpoint(deployedUrl);
      if (deployedWorks) {
        console.log('Deployed backend is available');
        return deployedUrl;
      }
    }
  } else {
    // In production, use deployed backend
    console.log('Production mode: Using deployed backend...');
    const deployedWorks = await testEndpoint(deployedUrl);
    if (deployedWorks) {
      console.log('Deployed backend is available');
      return deployedUrl;
    }
  }
  
  console.log('No backend available, using default');
  return deployedUrl;
};

export const switchBackend = async (forceDetect = false) => {
  if (forceDetect) {
    const detectedUrl = await detectBackend();
    if (detectedUrl !== currentApiUrl) {
      currentApiUrl = detectedUrl;
      api.defaults.baseURL = currentApiUrl;
      console.log(`Switched to backend: ${currentApiUrl}`);
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
      console.log(`Initialized with backend: ${currentApiUrl}`);
    }
  } catch (error) {
    console.warn('Backend detection failed, using default:', currentApiUrl);
  }
  return true;
};

export const getCurrentApiUrl = () => currentApiUrl;

// Request interceptor
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

// Response interceptor with error handling
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
      console.log('Server error detected, attempting backend switch...');
      const switched = await switchBackend(true);
      
      if (switched && error.config && !error.config._retry) {
        error.config._retry = true;
        error.config.baseURL = currentApiUrl;
        console.log('Retrying request with new backend...');
        return api.request(error.config);
      }
    }
    
    return Promise.reject(error);
  }
);

// Clear tournament cache function
export const clearTournamentCache = () => {
  console.log("Clearing tournament cache");
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("tournament_cache");
    localStorage.removeItem("tournament_cache_time");
  }
};

// Tournament API with enhanced error handling
export const tournamentAPI = {
  getAll: async (forceRefresh = false) => {
    console.log('TournamentAPI.getAll called, forceRefresh:', forceRefresh);
    
    try {
      console.log('Fetching tournaments from API...');
      const response = await api.get('/tournaments');
      
      // Handle different response structures
      let tournaments = [];
      if (Array.isArray(response.data)) {
        tournaments = response.data;
      } else if (response.data && Array.isArray(response.data.content)) {
        tournaments = response.data.content;
      } else if (response.data && Array.isArray(response.data.tournaments)) {
        tournaments = response.data.tournaments;
      }
      
      console.log(`Retrieved ${tournaments.length} tournaments`);
      return { ...response, data: tournaments };
    } catch (error) {
      console.error('Tournament API error:', error);
      throw error;
    }
  },
  
  getById: (id) => api.get(`/tournaments/${id}`),
  
  create: async (data) => {
    console.log('Creating tournament:', data);
    const response = await api.post('/tournaments', data);
    clearTournamentCache();
    console.log('Tournament created, cache cleared');
    return response;
  },
  
  update: async (id, data) => {
    console.log('Updating tournament:', id, data);
    const response = await api.put(`/tournaments/${id}`, data);
    clearTournamentCache();
    console.log('Tournament updated, cache cleared');
    return response;
  },
  
  delete: async (id) => {
    console.log('Deleting tournament:', id);
    const response = await api.delete(`/tournaments/${id}`);
    clearTournamentCache();
    console.log('Tournament deleted, cache cleared');
    return response;
  },
  
  getQuestions: (id) => api.get(`/tournaments/${id}/questions`),
  
  participate: async (id, answers) => {
    try {
      console.log('Participating in tournament:', id);
      const response = await api.post(`/tournaments/${id}/participate`, answers);
      console.log('Participation successful');
      return response;
    } catch (error) {
      console.error('Participation failed:', error);
      throw error;
    }
  },
  
  getScores: (id) => api.get(`/tournaments/${id}/scores`),
  
  like: async (id) => {
    try {
      console.log('Liking tournament:', id);
      const response = await api.post(`/tournaments/${id}/like`);
      console.log('Like successful');
      return response;
    } catch (error) {
      console.error('Like failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  unlike: async (id) => {
    try {
      console.log('Unliking tournament:', id);
      const response = await api.delete(`/tournaments/${id}/like`);
      console.log('Unlike successful');
      return response;
    } catch (error) {
      console.error('Unlike failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  getLikes: (id) => api.get(`/tournaments/${id}/likes`),
  getOngoing: () => api.get('/tournaments/player/ongoing'),
  getUpcoming: () => api.get('/tournaments/player/upcoming'),
  getPast: () => api.get('/tournaments/player/past'),
  getParticipated: () => api.get('/tournaments/player/participated'),
};

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/signin', credentials),
  register: (userData, userType) => {
    const endpoint = userType === 'admin' ? '/auth/signup/admin' : '/auth/signup/player';
    return api.post(endpoint, userData);
  },
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// User API
export const userAPI = {
  getCurrentUser: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  getUserById: (id) => api.get(`/users/${id}`),
};

// Test API with fallback endpoints
export const testAPI = {
  health: () => api.get('/test/health').catch(() => api.get('/health')),
  info: () => api.get('/test/info').catch(() => api.get('/info')),
  categories: () => api.get('/test/categories').catch(() => api.get('/categories')),
};

// Health check functions
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${currentApiUrl}/test/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const warmupApi = async () => {
  try {
    const response = await fetch(`${currentApiUrl}/test/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export default api;