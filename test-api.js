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

// Run test (uncomment to execute)
// testTournamentCreation();
