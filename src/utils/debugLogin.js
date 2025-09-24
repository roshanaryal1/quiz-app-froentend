// Debug utility for testing login functionality
import { authAPI, getCurrentApiUrl, initializeApi } from '../config/api';

export const debugLogin = async () => {
  console.log('=== DEBUG LOGIN TEST ===');

  // Initialize API
  await initializeApi();

  console.log('Current API URL:', getCurrentApiUrl());

  // Test basic connectivity
  try {
    const healthResponse = await fetch(`${getCurrentApiUrl()}/test/health`);
    console.log('Health check:', healthResponse.ok ? 'PASS' : 'FAIL');
    console.log('Health response status:', healthResponse.status);
  } catch (error) {
    console.error('Health check failed:', error);
  }

  // Test admin check endpoint
  try {
    const adminCheckResponse = await fetch(`${getCurrentApiUrl()}/admin/check`);
    const adminCheckData = await adminCheckResponse.json();
    console.log('Admin check:', adminCheckData);
  } catch (error) {
    console.error('Admin check failed:', error);
  }

  // Test login endpoint
  try {
    console.log('Testing login with admin credentials...');
    const loginResponse = await authAPI.login({
      usernameOrEmail: 'admin',
      password: 'op@1234'
    });
    console.log('Login response:', loginResponse);
    console.log('Login success!', loginResponse.data);
  } catch (error) {
    console.error('Login failed:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
  }

  console.log('=== DEBUG LOGIN TEST END ===');
};

// Auto-run debug on import in development
if (import.meta.env.DEV) {
  // Wait a bit for the app to initialize
  setTimeout(() => {
    console.log('Auto-running debug login test...');
    debugLogin();
  }, 2000);
}