// Quick test script to verify setup
import { testAPI } from './src/config/api.js';

const runQuickTest = async () => {
  console.log('🔍 Running Quick Setup Test...\n');

  try {
    // Test 1: API Health
    console.log('1. Testing API Health...');
    const healthResponse = await testAPI.health();
    console.log('✅ API is healthy:', healthResponse.data.message);

    // Test 2: Categories
    console.log('\n2. Testing Categories Endpoint...');
    const categoriesResponse = await testAPI.categories();
    console.log('✅ Categories loaded:', categoriesResponse.data.length, 'categories');

    // Test 3: Check localStorage
    console.log('\n3. Checking Authentication...');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      console.log('✅ Authentication data found in localStorage');
      const userData = JSON.parse(user);
      console.log('   User:', userData.username, '(' + userData.role + ')');
    } else {
      console.log('⚠️  No authentication data found - you need to log in');
    }

    console.log('\n🎉 Setup test completed successfully!');
    console.log('\nIf you see any ❌ errors above, check the troubleshooting section in README.md');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('- Check your internet connection');
    console.log('- Make sure the API server is running');
    console.log('- Try clearing browser cache');
    console.log('- See README.md for detailed troubleshooting');
  }
};

// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - expose to console
  window.runQuickTest = runQuickTest;
  console.log('💡 Run "runQuickTest()" in the browser console to test your setup');
} else {
  // Node.js environment - run immediately
  runQuickTest();
}