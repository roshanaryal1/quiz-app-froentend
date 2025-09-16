import axios from 'axios';

// API Configuration with improved backend detection
const getApiBaseUrl = () => {
  // 1. Check environment variable first (manual override)
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('🌐 Using environment API URL:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 2. Determine based on deployment environment
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Local development - try local backend first
    console.log('🛠️ Local development detected');
    return 'http://localhost:8082/api';
  } else if (hostname.includes('vercel.app') || hostname.includes('netlify.app')) {
    // Deployed frontend - use deployed backend
    console.log('🚀 Production deployment detected');
    return 'https://quiz-tournament-api.onrender.com/api';
  } else {
    // Default fallback to deployed backend
    console.log('🌐 Using default deployed backend');
    return 'https://quiz-tournament-api.onrender.com/api';
  }
};

const API_BASE_URL = getApiBaseUrl();
console.log(`🎯 Final API Base URL: ${API_BASE_URL}`);

// Function to get current API URL
export const getCurrentApiUrl = () => {
  return API_BASE_URL;
};

// Initialize API (for compatibility)
export const initializeApi = async () => {
  console.log('🚀 Initializing API...');
  const isHealthy = await checkApiHealth();
  if (isHealthy) {
    console.log('✅ API initialized successfully');
  } else {
    console.warn('⚠️ API initialization failed, but continuing...');
  }
  return isHealthy;
};

// Create axios instance with improved configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log API calls in development
    if (import.meta.env.DEV) {
      console.log(`📡 API Call: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error);
    
    // Handle different error scenarios
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('🔌 Network connection error - backend may be sleeping');
      // You could implement retry logic here for Render cold starts
    }
    
    if (error.response?.status === 401) {
      console.error('🔒 Authentication error - redirecting to login');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Backend health check with retry for cold starts
export const checkBackendHealth = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🏥 Health check attempt ${i + 1}/${retries}`);
      const response = await api.get('/test/health');
      console.log('✅ Backend is healthy:', response.data);
      return true;
    } catch (error) {
      console.warn(`⚠️ Health check failed (attempt ${i + 1}/${retries}):`, error.message);
      
      if (i < retries - 1) {
        // Wait progressively longer between retries (cold start handling)
        const delay = (i + 1) * 5000; // 5s, 10s, 15s
        console.log(`⏳ Waiting ${delay/1000}s before retry (cold start)...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
};

// API health check (alias for checkBackendHealth for compatibility)
export const checkApiHealth = async () => {
  try {
    console.log('🏥 Checking API health...');
    const response = await api.get('/test/health');
    console.log('✅ API is healthy:', response.data);
    return true;
  } catch (error) {
    console.warn('⚠️ API health check failed:', error.message);
    return false;
  }
};

// Warm up API to prevent cold starts
export const warmupApi = async () => {
  try {
    console.log('🔥 Warming up API...');
    const response = await api.get('/test/health');
    console.log('✅ API warmed up successfully');
    return true;
  } catch (error) {
    console.warn('⚠️ API warmup failed:', error.message);
    return false;
  }
};

// Tournament cache management
let tournamentCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const clearTournamentCache = () => {
  console.log('🗑️ Clearing tournament cache');
  tournamentCache = null;
  cacheTimestamp = null;
  // Also clear from localStorage if being used
  localStorage.removeItem('tournament_cache');
  localStorage.removeItem('tournament_cache_timestamp');
};

// Authentication API calls
export const authAPI = {
  signin: (credentials) => api.post('/auth/signin', credentials),
  signupPlayer: (userData) => api.post('/auth/signup/player', userData),
  signupAdmin: (userData) => api.post('/auth/signup/admin', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// Tournament API calls
export const tournamentAPI = {
  getAll: () => api.get('/tournaments'),
  getById: (id) => api.get(`/tournaments/${id}`),
  create: (tournament) => api.post('/tournaments', tournament),
  update: (id, tournament) => api.put(`/tournaments/${id}`, tournament),
  delete: (id) => api.delete(`/tournaments/${id}`),
  participate: (id, answers) => api.post(`/tournaments/${id}/participate`, answers),
  getQuestions: (id) => api.get(`/tournaments/${id}/questions`),
  like: (id) => api.post(`/tournaments/${id}/like`),
  unlike: (id) => api.delete(`/tournaments/${id}/like`),
  getStats: (id) => api.get(`/tournaments/${id}/stats`),
};

// User API calls
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData),
  getAll: () => api.get('/users'),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Test API calls
export const testAPI = {
  health: () => api.get('/test/health'),
  info: () => api.get('/test/info'),
};

export default api;