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
    const token = localStorage.getItem('token'); // Changed from 'authToken' to 'token'
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
      localStorage.removeItem('token'); // Changed from 'authToken' to 'token'
      localStorage.removeItem('user'); // Also remove user data
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

// Initialize cache from localStorage on startup
const initializeTournamentCache = () => {
  try {
    const cachedData = localStorage.getItem('tournament_cache');
    const cachedTime = localStorage.getItem('tournament_cache_timestamp');
    
    if (cachedData && cachedTime) {
      const cacheAge = Date.now() - parseInt(cachedTime);
      if (cacheAge < CACHE_DURATION) {
        tournamentCache = JSON.parse(cachedData);
        cacheTimestamp = parseInt(cachedTime);
        console.log('📦 Restored tournament cache from localStorage:', tournamentCache.length, 'tournaments');
      } else {
        console.log('🗑️ Cache expired, will fetch fresh from MySQL');
        localStorage.removeItem('tournament_cache');
        localStorage.removeItem('tournament_cache_timestamp');
      }
    }
  } catch (error) {
    console.warn('⚠️ Error loading tournament cache:', error);
  }
};

// Initialize cache on module load
initializeTournamentCache();

export const clearTournamentCache = () => {
  console.log('🗑️ Clearing tournament cache - will fetch fresh from MySQL');
  tournamentCache = null;
  cacheTimestamp = null;
  // Also clear from localStorage
  localStorage.removeItem('tournament_cache');
  localStorage.removeItem('tournament_cache_timestamp');
  
  // Dispatch event to notify components to refresh
  window.dispatchEvent(new CustomEvent('tournamentCacheCleared'));
};

// Authentication API calls
export const authAPI = {
  signin: (credentials) => api.post('/auth/signin', credentials),
  login: (credentials) => api.post('/auth/signin', credentials), // Alias for signin
  register: (userData, userType) => {
    // Handle registration based on user type
    const endpoint = userType === 'admin' ? '/auth/signup/admin' : '/auth/signup/player';
    return api.post(endpoint, userData);
  },
  signupPlayer: (userData) => api.post('/auth/signup/player', userData),
  signupAdmin: (userData) => api.post('/auth/signup/admin', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// Enhanced Tournament API calls with proper MySQL data fetching
export const tournamentAPI = {
  getAll: async (forceRefresh = false) => {
    try {
      console.log('🎯 Fetching tournaments from MySQL...', forceRefresh ? '(force refresh)' : '');
      
      // Skip cache if force refresh or on page load
      if (!forceRefresh && tournamentCache && cacheTimestamp) {
        const cacheAge = Date.now() - cacheTimestamp;
        if (cacheAge < CACHE_DURATION) {
          console.log('📋 Using cached tournaments (MySQL data):', tournamentCache.length, 'tournaments');
          return { data: tournamentCache };
        }
      }
      
      // Fetch fresh data from MySQL backend
      const response = await api.get('/tournaments');
      console.log('📊 Raw response from MySQL backend:', response);
      
      // Handle different response structures your backend might return
      let tournaments = [];
      if (Array.isArray(response.data)) {
        tournaments = response.data;
      } else if (response.data && response.data.tournaments && Array.isArray(response.data.tournaments)) {
        tournaments = response.data.tournaments;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        tournaments = response.data.data;
      } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
        tournaments = response.data.content;
      } else {
        console.warn('⚠️ Unexpected response structure from backend:', response.data);
        tournaments = [];
      }
      
      console.log(`✅ Successfully fetched ${tournaments.length} tournaments from MySQL backend`);
      
      // Update cache with fresh MySQL data
      tournamentCache = tournaments;
      cacheTimestamp = Date.now();
      
      // Store in localStorage for persistence across refreshes
      localStorage.setItem('tournament_cache', JSON.stringify(tournaments));
      localStorage.setItem('tournament_cache_timestamp', cacheTimestamp.toString());
      
      return { ...response, data: tournaments };
      
    } catch (error) {
      console.error('❌ Error fetching tournaments from MySQL backend:', error);
      
      // Try localStorage cache as fallback
      const cachedData = localStorage.getItem('tournament_cache');
      const cachedTime = localStorage.getItem('tournament_cache_timestamp');
      
      if (cachedData && cachedTime) {
        const cacheAge = Date.now() - parseInt(cachedTime);
        if (cacheAge < CACHE_DURATION * 2) { // Allow stale cache during errors
          console.log('📋 Using localStorage cache due to MySQL fetch error');
          const tournaments = JSON.parse(cachedData);
          tournamentCache = tournaments;
          cacheTimestamp = parseInt(cachedTime);
          return { data: tournaments };
        }
      }
      
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      console.log('🎯 Fetching tournament details from MySQL:', id);
      const response = await api.get(`/tournaments/${id}`);
      console.log('✅ Tournament details from MySQL:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching tournament details:', error);
      throw error;
    }
  },
  
  create: async (tournament) => {
    try {
      console.log('🚀 Creating tournament in MySQL backend:', tournament);
      const response = await api.post('/tournaments', tournament);
      console.log('✅ Tournament created successfully in MySQL:', response.data);
      
      // Force clear cache so next fetch gets fresh MySQL data
      clearTournamentCache();
      
      // Trigger event for components to refresh
      window.dispatchEvent(new CustomEvent('tournamentCreated', { 
        detail: response.data 
      }));
      
      return response;
    } catch (error) {
      console.error('❌ Error creating tournament in MySQL:', error);
      throw error;
    }
  },
  
  update: async (id, tournament) => {
    try {
      console.log('🔄 Updating tournament in MySQL:', id, tournament);
      const response = await api.put(`/tournaments/${id}`, tournament);
      console.log('✅ Tournament updated in MySQL:', response.data);
      
      // Clear cache to force fresh MySQL fetch
      clearTournamentCache();
      
      return response;
    } catch (error) {
      console.error('❌ Error updating tournament:', error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      console.log('🗑️ Deleting tournament from MySQL:', id);
      const response = await api.delete(`/tournaments/${id}`);
      console.log('✅ Tournament deleted from MySQL');
      
      // Clear cache to force fresh MySQL fetch
      clearTournamentCache();
      
      return response;
    } catch (error) {
      console.error('❌ Error deleting tournament:', error);
      throw error;
    }
  },
  
  // Keep existing methods unchanged
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
  mysql: async () => {
    try {
      console.log('🗄️ Testing MySQL connection via tournaments endpoint...');
      const response = await api.get('/tournaments');
      console.log('✅ MySQL connection successful - fetched tournaments:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ MySQL connection test failed:', error);
      return { success: false, error: error.message };
    }
  },
};

export default api;