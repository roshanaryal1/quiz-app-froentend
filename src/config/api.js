// src/config/api.js - Fixed version with better error handling and API calls
import axios from 'axios';

// API Configuration - Handles both local and deployed backends
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  if (import.meta.env.DEV) {
    return 'http://localhost:8080/api';
  }
  
  return 'https://quiz-tournament-api.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log(`🔗 API Configuration: Using ${API_BASE_URL}`);

// Tournament cache management
let tournamentCache = null;
let cacheTime = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export const clearTournamentCache = () => {
  tournamentCache = null;
  cacheTime = null;
  console.log('🗑️ Tournament cache cleared');
};

// Data sanitization
const sanitizeData = (data) => {
  if (!data) return [];
  return Array.isArray(data) ? data.filter(item => item && typeof item === 'object') : [];
};

// Backend health check
export const detectBackend = async () => {
  const localUrl = 'http://localhost:8080/api';
  const deployedUrl = 'https://quiz-tournament-api.onrender.com/api';
  
  const testEndpoint = async (url) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
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
  
  if (import.meta.env.DEV) {
    console.log('🔍 Development mode: Checking local backend...');
    const localWorks = await testEndpoint(localUrl);
    if (localWorks) {
      console.log('✅ Local backend is available');
      return localUrl;
    }
  }
  
  console.log('🚀 Using deployed backend...');
  const deployedWorks = await testEndpoint(deployedUrl);
  if (deployedWorks) {
    console.log('✅ Deployed backend is available');
    return deployedUrl;
  }
  
  console.log('❌ No backend available, using default');
  return deployedUrl;
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let currentApiUrl = API_BASE_URL;

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

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?message=Session expired';
      }
      return Promise.reject(error);
    }
    
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
    
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      endpoint: error.config?.url
    });
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => {
    const endpoint = userData.role === 'admin' ? '/auth/signup/admin' : '/auth/signup/player';
    return api.post(endpoint, userData);
  },
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// Tournament API with improved error handling
export const tournamentAPI = {
  getAll: async () => {
    // Check cache first
    if (tournamentCache && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
      console.log('📦 Using cached tournaments');
      return { data: tournamentCache };
    }
    
    try {
      console.log('🌐 Fetching tournaments from API...');
      const response = await api.get('/tournaments');
      
      let tournaments = [];
      if (Array.isArray(response.data)) {
        tournaments = response.data;
      } else if (response.data?.tournaments && Array.isArray(response.data.tournaments)) {
        tournaments = response.data.tournaments;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        tournaments = response.data.data;
      } else if (response.data?.content && Array.isArray(response.data.content)) {
        tournaments = response.data.content;
      }
      
      const sanitized = sanitizeData(tournaments);
      
      // Update cache
      tournamentCache = sanitized;
      cacheTime = Date.now();
      
      console.log(`✅ Loaded ${sanitized.length} tournaments`);
      return { ...response, data: sanitized };
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      console.log(`🎯 Fetching tournament ${id}...`);
      const response = await api.get(`/tournaments/${id}`);
      console.log('✅ Tournament fetched successfully');
      return response;
    } catch (error) {
      console.error(`Failed to fetch tournament ${id}:`, error);
      throw error;
    }
  },
  
  create: async (data) => {
    console.log('➕ Creating tournament...');
    const response = await api.post('/tournaments', data);
    clearTournamentCache();
    console.log('✅ Tournament created, cache cleared');
    return response;
  },
  
  update: async (id, data) => {
    console.log(`✏️ Updating tournament ${id}...`);
    const response = await api.put(`/tournaments/${id}`, data);
    clearTournamentCache();
    console.log('✅ Tournament updated, cache cleared');
    return response;
  },
  
  delete: async (id) => {
    console.log(`🗑️ Deleting tournament ${id}...`);
    const response = await api.delete(`/tournaments/${id}`);
    clearTournamentCache();
    console.log('✅ Tournament deleted, cache cleared');
    return response;
  },
  
  // Fixed quiz participation methods
  getQuestions: async (id) => {
    try {
      console.log(`❓ Fetching questions for tournament ${id}...`);
      const response = await api.get(`/tournaments/${id}/questions`);
      console.log('✅ Questions fetched successfully');
      return response;
    } catch (error) {
      console.error(`Failed to fetch questions for tournament ${id}:`, error);
      throw error;
    }
  },
  
  participate: async (id, answersData) => {
    try {
      console.log(`🎮 Participating in tournament ${id}...`, answersData);
      const response = await api.post(`/tournaments/${id}/participate`, answersData);
      console.log('✅ Participation submitted successfully');
      clearTournamentCache(); // Clear cache after participation
      return response;
    } catch (error) {
      console.error(`Failed to participate in tournament ${id}:`, error);
      throw error;
    }
  },
  
  getScores: async (id) => {
    try {
      console.log(`📊 Fetching scores for tournament ${id}...`);
      const response = await api.get(`/tournaments/${id}/scores`);
      console.log('✅ Scores fetched successfully');
      return response;
    } catch (error) {
      console.error(`Failed to fetch scores for tournament ${id}:`, error);
      throw error;
    }
  },
  
  // Fixed like/unlike methods
  like: async (id) => {
    try {
      console.log(`❤️ Liking tournament ${id}...`);
      const response = await api.post(`/tournaments/${id}/like`);
      console.log('✅ Tournament liked successfully');
      clearTournamentCache(); // Clear cache to refresh like counts
      return response;
    } catch (error) {
      console.error(`Failed to like tournament ${id}:`, error);
      throw error;
    }
  },
  
  unlike: async (id) => {
    try {
      console.log(`💔 Unliking tournament ${id}...`);
      const response = await api.delete(`/tournaments/${id}/like`);
      console.log('✅ Tournament unliked successfully');
      clearTournamentCache(); // Clear cache to refresh like counts
      return response;
    } catch (error) {
      console.error(`Failed to unlike tournament ${id}:`, error);
      throw error;
    }
  },
  
  getLikes: async (id) => {
    try {
      console.log(`📈 Fetching likes for tournament ${id}...`);
      const response = await api.get(`/tournaments/${id}/likes`);
      console.log('✅ Likes count fetched successfully');
      return response;
    } catch (error) {
      console.error(`Failed to fetch likes for tournament ${id}:`, error);
      throw error;
    }
  },
  
  // Fixed player history methods
  getOngoing: async () => {
    try {
      console.log('🏃‍♂️ Fetching ongoing tournaments...');
      const response = await api.get('/tournaments/player/ongoing');
      console.log('✅ Ongoing tournaments fetched successfully');
      return response;
    } catch (error) {
      console.error('Failed to fetch ongoing tournaments:', error);
      throw error;
    }
  },
  
  getUpcoming: async () => {
    try {
      console.log('⏰ Fetching upcoming tournaments...');
      const response = await api.get('/tournaments/player/upcoming');
      console.log('✅ Upcoming tournaments fetched successfully');
      return response;
    } catch (error) {
      console.error('Failed to fetch upcoming tournaments:', error);
      throw error;
    }
  },
  
  getPast: async () => {
    try {
      console.log('📜 Fetching past tournaments...');
      const response = await api.get('/tournaments/player/past');
      console.log('✅ Past tournaments fetched successfully');
      return response;
    } catch (error) {
      console.error('Failed to fetch past tournaments:', error);
      throw error;
    }
  },
  
  getParticipated: async () => {
    try {
      console.log('🏆 Fetching participated tournaments...');
      const response = await api.get('/tournaments/player/participated');
      console.log('✅ Participated tournaments fetched successfully');
      return response;
    } catch (error) {
      console.error('Failed to fetch participated tournaments:', error);
      throw error;
    }
  },
};

// User API
export const userAPI = {
  getCurrentUser: async () => {
    try {
      console.log('👤 Fetching current user...');
      const response = await api.get('/users/me');
      console.log('✅ Current user fetched successfully');
      return response;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      throw error;
    }
  },
  
  updateProfile: async (data) => {
    try {
      console.log('✏️ Updating user profile...');
      const response = await api.put('/users/me', data);
      console.log('✅ Profile updated successfully');
      return response;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },
  
  getUserById: async (id) => {
    try {
      console.log(`👤 Fetching user ${id}...`);
      const response = await api.get(`/users/${id}`);
      console.log('✅ User fetched successfully');
      return response;
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      throw error;
    }
  },
};

// Test API with fallback endpoints
export const testAPI = {
  health: () => api.get('/test/health').catch(() => api.get('/actuator/health')).catch(() => api.get('/health')),
  info: () => api.get('/test/info').catch(() => api.get('/info')),
  categories: () => api.get('/test/categories').catch(() => api.get('/categories')),
};

export default api;
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
    return false;
  }
};

// Warm up API
export const warmupApi = async () => {
  try {
    const response = await fetch(`${currentApiUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Export current API URL function  

// Health check with multiple endpoints
