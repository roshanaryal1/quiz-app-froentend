// src/config/api.js - Optimized and fixed version
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
    return 'http://localhost:8082/api';
  }
  
  // 3. Production mode - use deployed backend
  return 'https://quiz-tournament-api.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log(`🌐 API Configuration: Using ${API_BASE_URL}`);

// Create axios instance with optimized settings
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic API instance that can switch backends
let currentApiUrl = API_BASE_URL;

// Backend health check
export const detectBackend = async () => {
  const localUrl = 'http://localhost:8082/api';
  const deployedUrl = 'https://quiz-tournament-api.onrender.com/api';
  
  const testEndpoint = async (url) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${url}/health`, {
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
  return deployedUrl;
};

export const switchBackend = async (forceDetect = false) => {
  if (forceDetect) {
    const detectedUrl = await detectBackend();
    if (detectedUrl !== currentApiUrl) {
      currentApiUrl = detectedUrl;
      api.defaults.baseURL = currentApiUrl;
      console.log(`🔄 Switched to backend: ${currentApiUrl}`);
      clearTournamentCache();
      return true;
    }
  }
  return false;
};

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

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.baseURL = currentApiUrl;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with better error handling
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

// Health check with multiple endpoints
export const checkApiHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const healthEndpoints = ['/health', '/api/health', '/actuator/health', '/test/health'];
    
    for (const endpoint of healthEndpoints) {
      try {
        const response = await fetch(`${currentApiUrl}${endpoint}`, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        });
        
        clearTimeout(timeoutId);
        if (response.ok) {
          console.log(`✅ Health check successful on: ${endpoint}`);
          return true;
        }
      } catch (endpointError) {
        continue;
      }
    }
    
    return false;
  } catch (error) {
    console.log('🔄 Health check failed, trying to switch backend...');
    const switched = await switchBackend(true);
    return switched;
  }
};

// Warm up API
export const warmupApi = async () => {
  try {
    const response = await fetch(`${currentApiUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      return true;
    }
    
    const switched = await switchBackend(true);
    return switched;
  } catch (error) {
    const switched = await switchBackend(true);
    return switched;
  }
};

// Tournament cache system
let tournamentCache = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'tournament_cache';
const CACHE_TIME_KEY = 'tournament_cache_time';

// Load cache from localStorage
const loadCacheFromStorage = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    
    if (cachedData && cachedTime) {
      const timeDiff = Date.now() - parseInt(cachedTime);
      if (timeDiff < CACHE_DURATION) {
        tournamentCache = JSON.parse(cachedData);
        cacheTime = parseInt(cachedTime);
        console.log('📦 Loaded tournaments from localStorage cache');
        return true;
      } else {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIME_KEY);
      }
    }
  } catch (error) {
    console.error('❌ Error loading cache:', error);
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
  }
  return false;
};

// Save cache to localStorage
const saveCacheToStorage = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    console.log('💾 Saved tournaments to localStorage cache');
  } catch (error) {
    console.error('❌ Error saving cache:', error);
  }
};

export const clearTournamentCache = () => {
  tournamentCache = null;
  cacheTime = null;
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIME_KEY);
  console.log('🗑️ Tournament cache cleared');
};

// Initialize cache on module load
loadCacheFromStorage();

// Data sanitization for safety
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  const safe = {};
  const essentialProps = [
    'id', 'name', 'category', 'difficulty', 'startDate', 'endDate', 
    'minimumPassingScore', 'attempts', 'creator', 'questions'
  ];
  
  for (const prop of essentialProps) {
    if (data[prop] !== undefined) {
      safe[prop] = data[prop];
    }
  }
  
  // Handle nested objects
  if (data.creator) {
    safe.creator = {
      id: data.creator.id,
      firstName: data.creator.firstName,
      lastName: data.creator.lastName,
      username: data.creator.username
    };
  }
  
  if (data.attempts && Array.isArray(data.attempts)) {
    safe.attempts = data.attempts.map(attempt => ({
      id: attempt.id,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      completedAt: attempt.completedAt,
      user: attempt.user ? {
        id: attempt.user.id,
        firstName: attempt.user.firstName,
        lastName: attempt.user.lastName,
        username: attempt.user.username
      } : null
    }));
  }
  
  return safe;
};

// Auth API
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

// Tournament API with robust caching and immediate UI updates
export const tournamentAPI = {
  getAll: async (forceRefresh = false) => {
    console.log('🎯 TournamentAPI.getAll called, forceRefresh:', forceRefresh);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && tournamentCache && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
      console.log('📦 Returning cached tournaments');
      return { data: tournamentCache };
    }
    
    try {
      console.log('🌐 Fetching fresh tournaments from API...');
      console.log(`🔗 API URL: ${currentApiUrl}/tournaments`);
      
      const response = await api.get('/tournaments');
      console.log('📊 Raw API response:', response);
      
      // Handle different response structures
      let tournaments = [];
      if (Array.isArray(response.data)) {
        tournaments = response.data;
      } else if (response.data && typeof response.data === 'object') {
        const possibleKeys = ['tournaments', 'data', 'content', 'items', 'list'];
        for (const key of possibleKeys) {
          if (Array.isArray(response.data[key])) {
            tournaments = response.data[key];
            break;
          }
        }
        
        if (tournaments.length === 0) {
          const keys = Object.keys(response.data);
          for (const key of keys) {
            if (Array.isArray(response.data[key])) {
              tournaments = response.data[key];
              break;
            }
          }
        }
      }
      
      if (!Array.isArray(tournaments)) {
        console.error('❌ No valid tournament array found in response');
        tournaments = [];
      }
      
      const sanitized = sanitizeData(tournaments);
      console.log(`📊 Processed ${sanitized.length} tournaments:`, sanitized);
      
      // Update cache
      tournamentCache = sanitized;
      cacheTime = Date.now();
      saveCacheToStorage(sanitized);
      
      return { ...response, data: sanitized };
    } catch (error) {
      console.error('❌ Tournament API error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      
      // Return cached data if available
      if (tournamentCache) {
        console.log('🔄 Returning stale cache due to API error');
        return { data: tournamentCache };
      }
      
      throw error;
    }
  },
  
  getById: (id) => api.get(`/tournaments/${id}`),
  
  create: async (data) => {
    console.log('➕ Creating tournament:', data);
    console.log(`🔗 POST URL: ${currentApiUrl}/tournaments`);
    
    try {
      const response = await api.post('/tournaments', data);
      console.log('✅ Tournament created successfully:', response.data);
      
      // Clear cache to force fresh fetch
      clearTournamentCache();
      console.log('🗑️ Cache cleared after tournament creation');
      
      return response;
    } catch (error) {
      console.error('❌ Failed to create tournament:', error);
      console.error('❌ Creation error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  },
  
  update: async (id, data) => {
    console.log('✏️ Updating tournament:', id, data);
    const response = await api.put(`/tournaments/${id}`, data);
    clearTournamentCache();
    console.log('✅ Tournament updated, cache cleared');
    return response;
  },
  
  delete: async (id) => {
    console.log('🗑️ Deleting tournament:', id);
    const response = await api.delete(`/tournaments/${id}`);
    clearTournamentCache();
    console.log('✅ Tournament deleted, cache cleared');
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

// Test API with fallback endpoints
export const testAPI = {
  health: () => api.get('/health').catch(() => api.get('/actuator/health')).catch(() => api.get('/test/health')),
  info: () => api.get('/info').catch(() => api.get('/test/info')),
  categories: () => api.get('/categories').catch(() => api.get('/test/categories')),
};

export default api;