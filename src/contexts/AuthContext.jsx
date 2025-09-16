// src/contexts/AuthContext.jsx - Complete Fixed Version
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Import API functions
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://quiz-tournament-api.onrender.com/api';

// Simple API functions for auth
const authAPI = {
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    return response.json();
  },

  register: async (userData, userType) => {
    const endpoint = userType === 'admin' ? '/auth/signup/admin' : '/auth/signup/player';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
    
    return response.json();
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send reset email');
    }
    
    return response.json();
  },

  resetPassword: async (token, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset password');
    }
    
    return response.json();
  },
};

// Auth actions
const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_INITIALIZED: 'SET_INITIALIZED',
};

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    case AUTH_ACTIONS.SET_INITIALIZED:
      return {
        ...state,
        isInitialized: true,
        isLoading: false,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
          const parsedUser = JSON.parse(user);
          
          // Basic validation of user object
          if (parsedUser && parsedUser.id && parsedUser.username && parsedUser.role) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { token, user: parsedUser },
            });
          } else {
            console.warn('Invalid user data found, clearing storage');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Invalid stored data, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        dispatch({ type: AUTH_ACTIONS.SET_INITIALIZED });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      console.log('Attempting login with credentials:', { username: credentials.usernameOrEmail });
      
      const response = await authAPI.login(credentials);
      console.log('Login response received:', response);
      
      // Extract data from response
      const { accessToken, id, username, email, role } = response;
      
      if (!accessToken || !id || !username || !role) {
        throw new Error('Invalid response from server: missing required fields');
      }
      
      const user = { id, username, email, role };
      
      // Store in localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { token: accessToken, user },
      });
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed';
      
      if (error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network.';
      }
      
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData, userType = 'player') => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      console.log('Attempting registration for:', userType);
      
      const response = await authAPI.register(userData, userType);
      console.log('Registration response received:', response);
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed';
      
      if (error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network.';
      }
      
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      await authAPI.forgotPassword(email);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Failed to send reset email';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Reset password function
  const resetPassword = async (token, newPassword) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      await authAPI.resetPassword(token, newPassword);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Failed to reset password';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    error: state.error,
    // Functions
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    clearError,
  };

  // Don't render children until auth is initialized
  if (!state.isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context - THIS IS THE IMPORTANT EXPORT
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Default export the context itself (optional)
export default AuthContext;