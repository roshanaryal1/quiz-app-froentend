// Debug utility for login issues
import { authAPI, getCurrentApiUrl, checkApiHealth } from '../config/api';

export const debugLogin = async (credentials) => {
  console.group('🔍 Login Debug Information');
  
  // 1. Check current API URL
  const currentUrl = getCurrentApiUrl();
  console.log('📡 Current API URL:', currentUrl);
  
  // 2. Check if backend is reachable
  console.log('🏥 Checking backend health...');
  const isHealthy = await checkApiHealth();
  console.log('🏥 Backend health:', isHealthy ? '✅ Healthy' : '❌ Unhealthy');
  
  // 3. Test network connectivity
  console.log('🌐 Online status:', navigator.onLine ? '✅ Online' : '❌ Offline');
  
  // 4. Try to ping the auth endpoint directly
  try {
    console.log('🔐 Testing auth endpoint...');
    const response = await fetch(`${currentUrl}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    console.log('🔐 Auth endpoint response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries()),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response data:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
  
  // 5. Try the actual API call
  try {
    console.log('🔄 Testing authAPI.login...');
    const result = await authAPI.login(credentials);
    console.log('✅ authAPI.login success:', result.data);
  } catch (error) {
    console.error('❌ authAPI.login error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
      }
    });
  }
  
  console.groupEnd();
};

// Quick test function you can call from browser console
window.debugLogin = debugLogin;
