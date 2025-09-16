// src/config/api.js - Complete version with all functions
import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://quiz-tournament-api.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for slow connections
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?message=Your session has expired. Please log in again.';
      }
    }
    return Promise.reject(error);
  }
);

// Utility functions for API health checking and warmup
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export const warmupApi = async () => {
  try {
    console.log('Warming up API server...');
    
    // Make multiple requests to wake up the server
    const warmupRequests = [
      fetch(`${API_BASE_URL}/test/health`),
      fetch(`${API_BASE_URL}/test/info`),
      fetch(`${API_BASE_URL}/test/categories`)
    ];

    await Promise.allSettled(warmupRequests);
    
    // Wait a bit for the server to fully wake up
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('API warmup completed');
    return true;
  } catch (error) {
    console.error('API warmup failed:', error);
    return false;
  }
};

// Tournament cache management
let tournamentCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const clearTournamentCache = () => {
  tournamentCache = null;
  cacheTimestamp = null;
  console.log('Tournament cache cleared');
};

// Sanitization function to handle circular references
const sanitizeTournamentData = (data, visited = new Set()) => {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeTournamentData(item, visited));
  }

  if (typeof data === 'object') {
    const objKey = `${data.constructor?.name || 'Object'}_${data.id || Math.random()}`;

    if (visited.has(objKey)) {
      return {
        id: data.id,
        name: data.name || 'Circular Reference',
        _circular: true
      };
    }

    visited.add(objKey);

    const sanitized = {};
    const safeProps = [
      'id', 'name', 'category', 'difficulty', 'startDate', 'endDate',
      'minimumPassingScore', 'description', 'status', 'participantsCount',
      'likesCount', 'createdAt', 'updatedAt', 'questions', 'scores', 'attempts'
    ];

    for (const prop of safeProps) {
      if (data.hasOwnProperty(prop)) {
        if (prop === 'attempts' && Array.isArray(data[prop])) {
          sanitized[prop] = data[prop].map(attempt => sanitizeTournamentData(attempt, visited));
        } else {
          sanitized[prop] = data[prop];
        }
      }
    }

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

    if (data.user && typeof data.user === 'object') {
      sanitized.user = {
        id: data.user.id,
        username: data.user.username,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role
      };
    }

    visited.delete(objKey);
    return sanitized;
  }

  return data;
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

// Tournament API with caching and sanitization
export const tournamentAPI = {
  getAll: async () => {
    try {
      // Check cache first
      if (tournamentCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        console.log('Returning cached tournament data');
        return { data: tournamentCache };
      }

      console.log('Fetching fresh tournament data from API');
      const response = await api.get('/tournaments');
      
      // Sanitize the data
      const sanitizedData = sanitizeTournamentData(response.data);
      
      // Update cache
      tournamentCache = sanitizedData;
      cacheTimestamp = Date.now();
      
      return { ...response, data: sanitizedData };
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      throw error;
    }
  },
  getById: (id) => api.get(`/tournaments/${id}`),
  create: async (data) => {
    try {
      const response = await api.post('/tournaments', data);
      // Clear cache when creating new tournament
      clearTournamentCache();
      return response;
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  },
  update: async (id, data) => {
    try {
      const response = await api.put(`/tournaments/${id}`, data);
      // Clear cache when updating tournament
      clearTournamentCache();
      return response;
    } catch (error) {
      console.error('Error updating tournament:', error);
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/tournaments/${id}`);
      // Clear cache when deleting tournament
      clearTournamentCache();
      return response;
    } catch (error) {
      console.error('Error deleting tournament:', error);
      throw error;
    }
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