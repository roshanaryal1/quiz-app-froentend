// src/config/api.js - Optimized version for faster login
import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://quiz-tournament-api.onrender.com/api';

// Create axios instance with optimized settings
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Reduced from 30s to 15s
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - simplified
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

// Response interceptor - simplified
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?message=Session expired';
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
    
    const response = await fetch(`${API_BASE_URL}/test/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false; // Assume healthy if check fails quickly
  }
};

// Minimal warmup - only if really needed
export const warmupApi = async () => {
  try {
    // Single warmup request instead of multiple
    await fetch(`${API_BASE_URL}/test/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return true;
  } catch (error) {
    return false;
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