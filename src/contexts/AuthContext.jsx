// src/contexts/AuthContext.jsx - Fixed login function
const login = async (credentials) => {
  dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
  dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

  try {
    console.log('Attempting login with credentials:', { username: credentials.usernameOrEmail });
    
    const response = await authAPI.login(credentials);
    console.log('Login response received:', response);
    
    // Fix: Access response.data properly
    const responseData = response.data;
    const { accessToken, id, username, email, role } = responseData;
    
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
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.status === 401) {
      errorMessage = 'Invalid username/email or password';
    } else if (error.message) {
      errorMessage = error.message;
    } else if (!navigator.onLine) {
      errorMessage = 'No internet connection. Please check your network.';
    }
    
    dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};

// Add missing functions
const forgotPassword = async (email) => {
  dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
  dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

  try {
    await authAPI.forgotPassword(email);
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    return { success: true };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to send reset email';
    dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};

const resetPassword = async (token, newPassword) => {
  dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
  dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

  try {
    await authAPI.resetPassword(token, newPassword);
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    return { success: true };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to reset password';
    dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};