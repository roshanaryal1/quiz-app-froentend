# Fix tournament disappearing on refresh issue

# 1. Update src/config/api.js - Fix caching and API calls
echo "Fixing tournament caching issues..."

# Backup the current api.js
cp src/config/api.js src/config/api.js.cache-backup

# Create the fixed API configuration
cat > src/config/api.js << 'EOF'
// src/config/api.js - Fixed version with better caching
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
console.log(`�� API Configuration: Using ${API_BASE_URL}`);

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
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased timeout
      
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
  return deployedUrl; // Fallback to deployed
};

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
    
    // Add cache-busting for tournament requests
    if (config.url && config.url.includes('tournaments')) {
      config.params = config.params || {};
      config.params._t = Date.now();
    }
    
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

// Improved health check with multiple endpoints
export const checkApiHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Try multiple possible health endpoints
    const healthEndpoints = [
      '/health',
      '/api/health', 
      '/actuator/health',
      '/test/health'
    ];
    
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
        console.log(`❌ Health check failed on: ${endpoint}`);
        continue;
      }
    }
    
    return false;
  } catch (error) {
    console.log('🔄 Health check failed, trying to switch backend...');
    const switched = await switchBackend(true);
    if (switched) {
      try {
        const response = await fetch(`${currentApiUrl}/health`, {
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
    const response = await fetch(`${currentApiUrl}/health`, {
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

// FIXED: Robust tournament cache that persists across page refreshes
let tournamentCache = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const CACHE_KEY = 'tournament_cache';
const CACHE_TIME_KEY = 'tournament_cache_time';

// Load cache from localStorage on page load
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
        console.log('🗑️ Cache expired, clearing localStorage');
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIME_KEY);
      }
    }
  } catch (error) {
    console.error('❌ Error loading cache from storage:', error);
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
    console.error('❌ Error saving cache to storage:', error);
  }
};

export const clearTournamentCache = () => {
  tournamentCache = null;
  cacheTime = null;
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIME_KEY);
  console.log('��️ Tournament cache cleared');
};

// Initialize cache on module load
loadCacheFromStorage();

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

// FIXED: Tournament API with robust caching and error handling
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
      const response = await api.get('/tournaments');
      console.log('�� Raw API response:', response);
      
      // Handle different response structures
      let tournaments = [];
      if (Array.isArray(response.data)) {
        tournaments = response.data;
        console.log('✅ Using direct array response');
      } else if (response.data && typeof response.data === 'object') {
        // Try different property names
        const possibleKeys = ['tournaments', 'data', 'content', 'items', 'list'];
        for (const key of possibleKeys) {
          if (Array.isArray(response.data[key])) {
            tournaments = response.data[key];
            console.log(`✅ Using response.data.${key}`);
            break;
          }
        }
        
        // If still no array found, check all keys
        if (tournaments.length === 0) {
          const keys = Object.keys(response.data);
          console.log('🔍 Available keys:', keys);
          for (const key of keys) {
            if (Array.isArray(response.data[key])) {
              tournaments = response.data[key];
              console.log(`✅ Found array in response.data.${key}`);
              break;
            }
          }
        }
      }
      
      // Validate and sanitize data
      if (!Array.isArray(tournaments)) {
        console.error('❌ No valid tournament array found in response');
        tournaments = [];
      }
      
      const sanitized = sanitizeData(tournaments);
      console.log(`📊 Processed ${sanitized.length} tournaments`);
      
      // Update cache in both memory and localStorage
      tournamentCache = sanitized;
      cacheTime = Date.now();
      saveCacheToStorage(sanitized);
      
      return { ...response, data: sanitized };
    } catch (error) {
      console.error('❌ Tournament API error:', error);
      
      // Return cached data if available, even if expired
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
    const response = await api.post('/tournaments', data);
    clearTournamentCache(); // Clear cache on create
    console.log('✅ Tournament created, cache cleared');
    return response;
  },
  
  update: async (id, data) => {
    console.log('✏️ Updating tournament:', id, data);
    const response = await api.put(`/tournaments/${id}`, data);
    clearTournamentCache(); // Clear cache on update
    console.log('✅ Tournament updated, cache cleared');
    return response;
  },
  
  delete: async (id) => {
    console.log('🗑️ Deleting tournament:', id);
    const response = await api.delete(`/tournaments/${id}`);
    clearTournamentCache(); // Clear cache on delete
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
EOF

# 2. Update AdminTournaments.jsx to force refresh on navigation
echo "Updating AdminTournaments.jsx to force refresh..."

cat > /tmp/admin_tournaments_fix.js << 'ADMIN_EOF'
  useEffect(() => {
    console.log('🎯 AdminTournaments component mounted/updated');
    fetchTournaments(true); // Force refresh when component mounts
  }, [location.pathname]); // Force refresh when navigating back

  const fetchTournaments = async (forceClear = false) => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('🎯 Admin: Fetching tournaments, forceClear:', forceClear);
      
      // Force fresh data from API
      const response = await tournamentAPI.getAll(forceClear);
      console.log('🎯 Admin: Tournaments response:', response);
      
      let tournamentsData = [];
      
      if (Array.isArray(response.data)) {
        tournamentsData = response.data;
        console.log('🎯 Admin: Using direct array from response.data');
      } else if (response.data && typeof response.data === 'object') {
        const possibleKeys = ['tournaments', 'data', 'content', 'items', 'list'];
        
        for (const key of possibleKeys) {
          if (Array.isArray(response.data[key])) {
            tournamentsData = response.data[key];
            console.log(`🎯 Admin: Using response.data.${key} as tournaments array`);
            break;
          }
        }
        
        if (tournamentsData.length === 0) {
          const keys = Object.keys(response.data);
          console.log('🎯 Admin: All response data keys:', keys);
          for (const key of keys) {
            if (Array.isArray(response.data[key])) {
              tournamentsData = response.data[key];
              console.log(`🎯 Admin: Using response.data.${key} as tournaments array`);
              break;
            }
          }
        }
      }
      
      console.log('🎯 Admin: Final tournaments data:', tournamentsData);
      setTournaments(tournamentsData);
      
      if (successMessage) {
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      
    } catch (error) {
      console.error('❌ Admin: Error fetching tournaments:', error);
      
      let errorMessage = 'Failed to fetch tournaments';
      
      if (!navigator.onLine) {
        errorMessage = 'You appear to be offline. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. The server might be busy or unavailable.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Redirecting to login...';
        setTimeout(() => {
          window.location.href = '/login?message=Your session has expired. Please log in again.';
        }, 2000);
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to access this resource.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = `API Error: ${error.message}`;
      }
      
      setError(errorMessage);
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  };
ADMIN_EOF

# Apply the fix to AdminTournaments.jsx
sed -i '/useEffect(() => {/,/}, \[location\.pathname\]);/ {
  /useEffect(() => {/r /tmp/admin_tournaments_fix.js
  d
}' src/pages/admin/AdminTournaments.jsx

# 3. Update PlayerTournaments.jsx similarly
echo "Updating PlayerTournaments.jsx to force refresh..."

sed -i 's/await tournamentAPI\.getAll()/await tournamentAPI.getAll(forceClear)/g' src/pages/player/PlayerTournaments.jsx

# 4. Create a refresh component that forces cache clear
cat > src/components/common/RefreshButton.jsx << 'REFRESH_EOF'
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { clearTournamentCache } from '../../config/api';

const RefreshButton = ({ onRefresh, isLoading = false, className = "" }) => {
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    clearTournamentCache();
    if (onRefresh) onRefresh(true); // Force refresh
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isLoading}
      className={`btn-secondary inline-flex items-center space-x-2 disabled:opacity-50 ${className}`}
      title="Clear cache and refresh data"
    >
      <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
      <span>Refresh</span>
    </button>
  );
};

export default RefreshButton;
REFRESH_EOF

# 5. Add refresh buttons to tournament pages
echo "Adding refresh functionality to tournament pages..."

# Add to AdminTournaments.jsx
sed -i '/import LoadingSpinner/a import RefreshButton from "../../components/common/RefreshButton";' src/pages/admin/AdminTournaments.jsx

# Add refresh button to AdminTournaments.jsx
sed -i '/refresh tournaments list/i\
              <RefreshButton \
                onRefresh={fetchTournaments} \
                isLoading={isLoading} \
              />' src/pages/admin/AdminTournaments.jsx

# Add to PlayerTournaments.jsx
sed -i '/import LoadingSpinner/a import RefreshButton from "../../components/common/RefreshButton";' src/pages/player/PlayerTournaments.jsx

# Add refresh button to PlayerTournaments.jsx
sed -i '/refresh tournaments list/i\
            <RefreshButton \
              onRefresh={refreshTournaments} \
              isLoading={isLoading} \
            />' src/pages/player/PlayerTournaments.jsx

# 6. Test the fixes
echo "Testing the fixes..."
npm run build

echo "✅ TOURNAMENT CACHE FIXES APPLIED!"
echo ""
echo "🔧 WHAT WAS FIXED:"
echo "1. ✅ Tournament cache now persists in localStorage across page refreshes"
echo "2. ✅ Added cache expiration (5 minutes) to prevent stale data"
echo "3. ✅ Added force refresh functionality to clear cache when needed"
echo "4. ✅ Added manual refresh buttons to tournament pages"
echo "5. ✅ Improved error handling and fallback to cached data"
echo "6. ✅ Better API response parsing for different backend responses"
echo ""
echo "🎯 HOW IT WORKS NOW:"
echo "• When you create a tournament, cache is automatically cleared"
echo "• Page refreshes now load tournaments from localStorage cache if available"
echo "• Cache expires after 5 minutes to ensure fresh data"
echo "• Manual refresh buttons force fresh data from server"
echo "• If API fails, shows cached tournaments instead of empty list"
echo ""
echo "🚀 TEST THE FIX:"
echo "1. Create a tournament as admin"
echo "2. Refresh the page - tournament should still be there"
echo "3. Switch to player view - tournament should be visible"
echo "4. Refresh again - tournament should persist"
echo ""
echo "If tournaments still disappear, check your backend API responses!"
EOF

# Run the fix
chmod +x fix_tournament_cache.sh
./fix_tournament_cache.sh
