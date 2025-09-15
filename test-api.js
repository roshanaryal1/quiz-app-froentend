// Test API connectivity and tournament creation
import { tournamentAPI, testAPI } from './src/config/api.js';

const testTournamentCreation = async () => {
  try {
    console.log('Testing API connectivity...');
    
    // Test API health
    const healthResponse = await testAPI.health();
    console.log('API Health:', healthResponse.data);
    
    // Test categories
    const categoriesResponse = await testAPI.categories();
    console.log('Categories:', categoriesResponse.data);
    
    // Test tournament creation (you'll need to be logged in for this)
    const testTournament = {
      name: 'Test Tournament',
      category: 'General Knowledge',
      difficulty: 'medium',
      startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      minimumPassingScore: 70
    };
    
    console.log('Creating test tournament:', testTournament);
    const createResponse = await tournamentAPI.create(testTournament);
    console.log('Tournament created:', createResponse.data);
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
};

// Test tournament creation in browser console
// Run this in the browser console after logging in as admin

const testTournamentCreationBrowser = async () => {
  try {
    console.log('Testing tournament creation...');

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    console.log('Auth status:', {
      hasToken: !!token,
      user: user,
      isAdmin: user.role === 'ADMIN'
    });

    if (!token || user.role !== 'ADMIN') {
      console.error('Please log in as admin first');
      return;
    }

    // Test data
    const testTournament = {
      name: 'Test Tournament ' + new Date().getTime(),
      category: 'General Knowledge',
      difficulty: 'medium',
      startDate: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      endDate: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      minimumPassingScore: 70
    };

    console.log('Creating tournament:', testTournament);

    // Make API call
    const response = await fetch('https://quiz-tournament-api.onrender.com/api/tournaments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testTournament)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Tournament created successfully:', result);
    } else {
      console.error('❌ Tournament creation failed:', {
        status: response.status,
        error: result
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// To run this test, copy and paste this function into the browser console
// then call: testTournamentCreation()
console.log('Tournament creation test function loaded. Call testTournamentCreation() to run the test.');

// Run test (uncomment to execute)
// testTournamentCreation();
