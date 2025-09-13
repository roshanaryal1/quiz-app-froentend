import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://quiz-tournament-api.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error or API is down:', error.message);
      return Promise.reject({
        message: 'Unable to connect to server. Please check your internet connection.',
        isNetworkError: true
      });
    }

    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => {
    console.log('Making login request to:', `${API_BASE_URL}/auth/signin`);
    return api.post('/auth/signin', credentials);
  },
  registerAdmin: (userData) => api.post('/auth/signup/admin', userData),
  registerPlayer: (userData) => api.post('/auth/signup/player', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// Tournament API calls
export const tournamentAPI = {
  getAll: () => api.get('/tournaments'),
  getById: (id) => api.get(`/tournaments/${id}`),
  create: (tournamentData) => api.post('/tournaments', tournamentData),
  update: (id, tournamentData) => api.put(`/tournaments/${id}`, tournamentData),
  delete: (id) => api.delete(`/tournaments/${id}`),
  getQuestions: (id) => api.get(`/tournaments/${id}/questions`),
  participate: (id, answers) => api.post(`/tournaments/${id}/participate`, { answers }),
  getScores: (id) => api.get(`/tournaments/${id}/scores`),
  like: (id) => api.post(`/tournaments/${id}/like`),
  unlike: (id) => api.delete(`/tournaments/${id}/like`),
  getLikes: (id) => api.get(`/tournaments/${id}/likes`),
  getOngoing: () => api.get('/tournaments/player/ongoing'),
  getUpcoming: () => api.get('/tournaments/player/upcoming'),
  getPast: () => api.get('/tournaments/player/past'),
  getParticipated: () => api.get('/tournaments/player/participated'),
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