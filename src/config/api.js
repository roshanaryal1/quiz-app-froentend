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

// Utility function to sanitize tournament data and remove circular references
const sanitizeTournamentData = (data, visited = new Set()) => {
  if (!data) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeTournamentData(item, visited));
  }

  // Handle objects
  if (typeof data === 'object') {
    // Create a unique key for this object to detect circular references
    const objKey = `${data.constructor.name}_${data.id || Math.random()}`;
    
    if (visited.has(objKey)) {
      // Circular reference detected, return a minimal representation
      return {
        id: data.id,
        name: data.name || 'Circular Reference',
        _circular: true
      };
    }
    
    visited.add(objKey);
    
    const sanitized = {};
    
    // Copy only safe properties
    const safeProps = [
      'id', 'name', 'category', 'difficulty', 'startDate', 'endDate', 
      'minimumPassingScore', 'description', 'status', 'participantsCount',
      'likesCount', 'createdAt', 'updatedAt', 'questions', 'scores'
    ];
    
    for (const prop of safeProps) {
      if (data.hasOwnProperty(prop)) {
        sanitized[prop] = data[prop];
      }
    }
    
    // Handle creator object specially
    if (data.creator && typeof data.creator === 'object') {
      sanitized.creator = {
        id: data.creator.id,
        username: data.creator.username,
        email: data.creator.email,
        firstName: data.creator.firstName,
        lastName: data.creator.lastName,
        role: data.creator.role,
        picture: data.creator.picture
      };
    }
    
    // Handle nested arrays/objects recursively
    for (const [key, value] of Object.entries(data)) {
      if (!safeProps.includes(key) && key !== 'creator') {
        if (Array.isArray(value)) {
          sanitized[key] = value.map(item => sanitizeTournamentData(item, visited));
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeTournamentData(value, visited);
        }
      }
    }
    
    visited.delete(objKey);
    return sanitized;
  }

  return data;
};

// Safe JSON parse function with better error handling for malformed responses
const safeJsonParse = (response) => {
  try {
    let data;
    
    // If response.data is already parsed, use it
    if (typeof response.data === 'object') {
      data = response.data;
    } else if (typeof response.data === 'string') {
      // Try to parse the string, but handle potential circular references
      try {
        data = JSON.parse(response.data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        
        // If parsing fails due to circular references, try to extract individual objects
        console.log('Attempting to extract individual tournament objects from malformed JSON...');
        
        const tournaments = [];
        const objectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
        let match;
        
        while ((match = objectRegex.exec(response.data)) !== null) {
          try {
            const obj = JSON.parse(match[0]);
            // Check if this looks like a tournament object
            if (obj.id && obj.name && obj.category) {
              tournaments.push(obj);
            }
          } catch (objParseError) {
            // Skip malformed objects
            console.log('Skipping malformed object');
          }
        }
        
        if (tournaments.length > 0) {
          console.log(`Successfully extracted ${tournaments.length} tournament objects`);
          data = tournaments;
        } else {
          // Last resort: try to find the start of valid JSON
          const jsonStart = response.data.indexOf('[{');
          if (jsonStart !== -1) {
            // Look for a valid closing bracket
            let bracketCount = 0;
            let endIndex = jsonStart;
            
            for (let i = jsonStart; i < response.data.length; i++) {
              if (response.data[i] === '{') bracketCount++;
              if (response.data[i] === '}') bracketCount--;
              
              if (bracketCount === 0 && i > jsonStart) {
                endIndex = i + 1;
                break;
              }
            }
            
            if (endIndex > jsonStart) {
              try {
                const chunk = response.data.substring(jsonStart, endIndex);
                data = JSON.parse(chunk);
                console.log('Successfully parsed JSON chunk');
              } catch (chunkError) {
                console.error('Chunk parsing also failed');
              }
            }
          }
          
          if (!data) {
            console.error('Could not extract valid JSON from malformed response');
            return {
              ...response,
              data: [],
              error: 'Failed to parse malformed JSON response'
            };
          }
        }
      }
    } else {
      data = response.data;
    }

    // Sanitize the data to remove circular references
    const sanitizedData = sanitizeTournamentData(data);
    
    return {
      ...response,
      data: sanitizedData
    };
  } catch (error) {
    console.error('Safe JSON parse error:', error);
    // Return a safe fallback response
    return {
      ...response,
      data: [],
      error: 'Failed to parse response data'
    };
  }
};

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
    
    // Try to sanitize response data to handle circular references
    try {
      if (response.data && typeof response.data === 'object') {
        response.data = sanitizeTournamentData(response.data);
      } else if (typeof response.data === 'string' && response.data.trim().startsWith('[{')) {
        // If response is a string that looks like JSON, try to parse and sanitize it
        try {
          const parsed = JSON.parse(response.data);
          response.data = sanitizeTournamentData(parsed);
        } catch (parseError) {
          console.warn('Response JSON parse failed:', parseError);
          
          // Try to extract individual objects using regex
          const tournaments = [];
          const objectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
          let match;
          
          while ((match = objectRegex.exec(response.data)) !== null) {
            try {
              const obj = JSON.parse(match[0]);
              if (obj.id && obj.name && obj.category) {
                tournaments.push(obj);
              }
            } catch (objParseError) {
              // Skip malformed objects
            }
          }
          
          if (tournaments.length > 0) {
            response.data = sanitizeTournamentData(tournaments);
          } else {
            response.data = [];
          }
        }
      }
    } catch (sanitizeError) {
      console.warn('Response sanitization failed:', sanitizeError);
      response.data = [];
    }
    
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - API might be sleeping');
    } else if (error.response?.status === 500 && error.response?.data?.message?.includes('circular')) {
      console.error('Server returned circular reference error');
      // Return a safe fallback response
      return Promise.resolve({
        data: [],
        status: 200,
        statusText: 'OK',
        config: error.config,
        headers: error.response?.headers || {}
      });
    } else if (error.response?.status === 200 && typeof error.response.data === 'string') {
      // Handle case where server returns 200 but with malformed data
      console.warn('Server returned 200 with malformed data');
      return Promise.resolve({
        data: [],
        status: 200,
        statusText: 'OK',
        config: error.config,
        headers: error.response?.headers || {}
      });
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
    
    try {
      const response = await api.get('/tournaments');
      const sanitizedResponse = safeJsonParse(response);
      
      tournamentCache.set(cacheKey, {
        data: sanitizedResponse.data,
        timestamp: Date.now()
      });
      
      return sanitizedResponse;
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      // Return cached data if available, otherwise empty array
      if (cached) {
        console.log('Returning cached tournament data due to API error');
        return { data: cached.data };
      }
      return { data: [], error: error.message };
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/tournaments/${id}`);
      return safeJsonParse(response);
    } catch (error) {
      console.error(`Error fetching tournament ${id}:`, error);
      return { data: null, error: error.message };
    }
  },
  create: async (tournamentData) => {
    try {
      tournamentCache.clear(); // Clear cache on create
      const response = await api.post('/tournaments', tournamentData);
      return safeJsonParse(response);
    } catch (error) {
      console.error('Error creating tournament:', error);
      return { data: null, error: error.message };
    }
  },
  update: async (id, tournamentData) => {
    try {
      tournamentCache.clear(); // Clear cache on update
      const response = await api.put(`/tournaments/${id}`, tournamentData);
      return safeJsonParse(response);
    } catch (error) {
      console.error(`Error updating tournament ${id}:`, error);
      return { data: null, error: error.message };
    }
  },
  delete: async (id) => {
    try {
      tournamentCache.clear(); // Clear cache on delete
      const response = await api.delete(`/tournaments/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting tournament ${id}:`, error);
      return { error: error.message };
    }
  },
  getQuestions: (id) => api.get(`/tournaments/${id}/questions`),
  participate: (id, answers) => api.post(`/tournaments/${id}/participate`, { answers }),
  getScores: (id) => api.get(`/tournaments/${id}/scores`),
  like: (id) => api.post(`/tournaments/${id}/like`),
  unlike: (id) => api.delete(`/tournaments/${id}/like`),
  getLikes: (id) => api.get(`/tournaments/${id}/likes`),
  getOngoing: async () => {
    try {
      const response = await api.get('/tournaments/player/ongoing');
      return safeJsonParse(response);
    } catch (error) {
      console.error('Error fetching ongoing tournaments:', error);
      return { data: [], error: error.message };
    }
  },
  getUpcoming: async () => {
    try {
      const response = await api.get('/tournaments/player/upcoming');
      return safeJsonParse(response);
    } catch (error) {
      console.error('Error fetching upcoming tournaments:', error);
      return { data: [], error: error.message };
    }
  },
  getPast: async () => {
    try {
      const response = await api.get('/tournaments/player/past');
      return safeJsonParse(response);
    } catch (error) {
      console.error('Error fetching past tournaments:', error);
      return { data: [], error: error.message };
    }
  },
  getParticipated: async () => {
    try {
      const response = await api.get('/tournaments/player/participated');
      return safeJsonParse(response);
    } catch (error) {
      console.error('Error fetching participated tournaments:', error);
      return { data: [], error: error.message };
    }
  },
};

// Cache management functions
export const clearTournamentCache = () => {
  tournamentCache.clear();
  console.log('Tournament cache cleared');
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