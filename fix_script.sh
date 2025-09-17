#!/bin/bash

echo "🔧 Applying comprehensive login fixes..."

# Fix 1: Update login endpoint from /login to /signin
echo "📝 Fixing login endpoint..."
sed -i 's|/auth/login|/auth/signin|g' src/config/api.js

# Fix 2: Update backend port from 8080 to 8082
echo "🔌 Fixing backend port..."
sed -i 's|localhost:8080|localhost:8082|g' src/config/api.js

# Fix 3: Update AuthContext login function to handle different token field names
echo "🔐 Updating AuthContext login function..."
cat > /tmp/login_function_fix.js << 'EOF'
  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      console.log('Attempting login with credentials:', { username: credentials.usernameOrEmail });
      
      const response = await authAPI.login(credentials);
      console.log('Login response received:', response);
      
      // Access response.data properly - handle different possible field names
      const responseData = response.data;
      console.log('Response data:', responseData);
      
      // Try different possible field names for the token
      const token = responseData.accessToken || responseData.jwt || responseData.token;
      const { id, username, email, role } = responseData;
      
      if (!token) {
        console.error('No token found in response:', responseData);
        throw new Error('No authentication token received from server');
      }
      
      if (!id || !username || !role) {
        console.error('Missing user data in response:', responseData);
        throw new Error('Incomplete user data received from server');
      }
      
      const user = { id, username, email, role };
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { token, user },
      });
      
      console.log('✅ Login successful');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid username/email or password';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network.';
      }
      
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };
EOF

# Replace the login function in AuthContext.jsx
sed -i '/  \/\/ Login function/,/  };/{
  /  \/\/ Login function/r /tmp/login_function_fix.js
  d
}' src/contexts/AuthContext.jsx

# Fix 4: Enhanced request interceptor
echo "🔧 Enhancing request interceptor..."
sed -i '/api.interceptors.request.use(/,/);/{
  c\
api.interceptors.request.use(\
  (config) => {\
    const token = localStorage.getItem("token");\
    if (token) {\
      config.headers.Authorization = `Bearer ${token}`;\
    }\
    \
    if (!config.headers["Content-Type"]) {\
      config.headers["Content-Type"] = "application/json";\
    }\
    \
    config.baseURL = currentApiUrl;\
    console.log(`🔗 API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);\
    return config;\
  },\
  (error) => Promise.reject(error)\
);
}' src/config/api.js

# Test the fixes
echo "🧪 Testing backend connectivity..."
echo "Testing deployed backend..."
curl -s https://quiz-tournament-api.onrender.com/api/test/health && echo "✅ Deployed backend is responding" || echo "❌ Deployed backend not responding"

echo "Testing local backend (if running)..."
curl -s http://localhost:8082/api/test/health && echo "✅ Local backend is responding" || echo "❌ Local backend not responding"

echo "✅ All fixes applied!"
echo ""
echo "🔄 Next steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Try logging in with admin credentials"
echo "3. Check browser console for detailed logs"
echo "4. If still having issues, check Network tab in DevTools"

# Clean up
rm -f /tmp/login_function_fix.js
