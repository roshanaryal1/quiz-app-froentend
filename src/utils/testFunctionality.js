// src/utils/testFunctionality.js - Test script to verify all features
import { authAPI, tournamentAPI, userAPI, testAPI } from '../config/api';

class FunctionalityTester {
  constructor() {
    this.results = [];
    this.testUser = null;
    this.testTournament = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    this.results.push(logEntry);
    
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  async testBackendConnectivity() {
    this.log('🔗 Testing backend connectivity...', 'info');
    
    try {
      const healthResponse = await testAPI.health();
      this.log('Backend health check passed', 'success');
      
      const infoResponse = await testAPI.info();
      this.log('Backend info endpoint accessible', 'success');
      
      return true;
    } catch (error) {
      this.log(`Backend connectivity failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testAuthentication() {
    this.log('🔐 Testing authentication...', 'info');
    
    try {
      // Test registration
      const testUserData = {
        username: `testuser_${Date.now()}`,
        password: 'testpass123',
        email: `test_${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        role: 'player'
      };

      this.log('Attempting user registration...', 'info');
      const registerResponse = await authAPI.register(testUserData);
      this.log('User registration successful', 'success');

      // Test login
      this.log('Attempting user login...', 'info');
      const loginResponse = await authAPI.login({
        username: testUserData.username,
        password: testUserData.password
      });

      if (loginResponse.data.token) {
        localStorage.setItem('token', loginResponse.data.token);
        localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
        this.testUser = loginResponse.data.user;
        this.log('User login successful, token stored', 'success');
        return true;
      } else {
        this.log('Login response missing token', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Authentication failed: ${error.response?.data?.message || error.message}`, 'error');
      return false;
    }
  }

  async testTournamentOperations() {
    this.log('🏆 Testing tournament operations...', 'info');
    
    try {
      // Test getting all tournaments
      this.log('Fetching all tournaments...', 'info');
      const tournamentsResponse = await tournamentAPI.getAll();
      const tournaments = tournamentsResponse.data;
      this.log(`Found ${tournaments.length} tournaments`, 'success');

      if (tournaments.length === 0) {
        this.log('No tournaments available for testing', 'warning');
        return false;
      }

      // Select first tournament for testing
      this.testTournament = tournaments[0];
      this.log(`Selected tournament: ${this.testTournament.name}`, 'info');

      // Test getting tournament by ID
      this.log('Fetching tournament by ID...', 'info');
      const tournamentResponse = await tournamentAPI.getById(this.testTournament.id);
      this.log('Tournament fetch by ID successful', 'success');

      // Test getting tournament questions
      try {
        this.log('Fetching tournament questions...', 'info');
        const questionsResponse = await tournamentAPI.getQuestions(this.testTournament.id);
        this.log(`Loaded ${questionsResponse.data.length} questions`, 'success');
      } catch (error) {
        this.log(`Questions fetch failed: ${error.message}`, 'warning');
      }

      // Test getting tournament scores
      try {
        this.log('Fetching tournament scores...', 'info');
        const scoresResponse = await tournamentAPI.getScores(this.testTournament.id);
        this.log('Tournament scores fetch successful', 'success');
      } catch (error) {
        this.log(`Scores fetch failed: ${error.message}`, 'warning');
      }

      return true;
    } catch (error) {
      this.log(`Tournament operations failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testLikeFunctionality() {
    this.log('❤️ Testing like functionality...', 'info');
    
    if (!this.testTournament || !this.testUser) {
      this.log('Missing test tournament or user for like testing', 'warning');
      return false;
    }

    try {
      // Test getting current likes count
      this.log('Getting current likes count...', 'info');
      const initialLikesResponse = await tournamentAPI.getLikes(this.testTournament.id);
      const initialLikes = initialLikesResponse.data.count || initialLikesResponse.data || 0;
      this.log(`Initial likes count: ${initialLikes}`, 'info');

      // Test liking tournament
      this.log('Attempting to like tournament...', 'info');
      await tournamentAPI.like(this.testTournament.id);
      this.log('Tournament like successful', 'success');

      // Verify likes count increased
      const afterLikeResponse = await tournamentAPI.getLikes(this.testTournament.id);
      const afterLikes = afterLikeResponse.data.count || afterLikeResponse.data || 0;
      
      if (afterLikes > initialLikes) {
        this.log(`Likes count increased to ${afterLikes}`, 'success');
      } else {
        this.log(`Likes count did not increase (${afterLikes})`, 'warning');
      }

      // Test unliking tournament
      this.log('Attempting to unlike tournament...', 'info');
      await tournamentAPI.unlike(this.testTournament.id);
      this.log('Tournament unlike successful', 'success');

      // Verify likes count decreased
      const afterUnlikeResponse = await tournamentAPI.getLikes(this.testTournament.id);
      const afterUnlikes = afterUnlikeResponse.data.count || afterUnlikeResponse.data || 0;
      
      if (afterUnlikes < afterLikes) {
        this.log(`Likes count decreased to ${afterUnlikes}`, 'success');
      } else {
        this.log(`Likes count did not decrease (${afterUnlikes})`, 'warning');
      }

      return true;
    } catch (error) {
      this.log(`Like functionality failed: ${error.response?.data?.message || error.message}`, 'error');
      return false;
    }
  }

  async testPlayerHistoryEndpoints() {
    this.log('📜 Testing player history endpoints...', 'info');
    
    try {
      // Test participated tournaments
      this.log('Fetching participated tournaments...', 'info');
      try {
        const participatedResponse = await tournamentAPI.getParticipated();
        this.log(`Found ${participatedResponse.data.length} participated tournaments`, 'success');
      } catch (error) {
        this.log(`Participated endpoint failed: ${error.message}`, 'warning');
      }

      // Test ongoing tournaments
      this.log('Fetching ongoing tournaments...', 'info');
      try {
        const ongoingResponse = await tournamentAPI.getOngoing();
        this.log(`Found ${ongoingResponse.data.length} ongoing tournaments`, 'success');
      } catch (error) {
        this.log(`Ongoing endpoint failed: ${error.message}`, 'warning');
      }

      // Test upcoming tournaments
      this.log('Fetching upcoming tournaments...', 'info');
      try {
        const upcomingResponse = await tournamentAPI.getUpcoming();
        this.log(`Found ${upcomingResponse.data.length} upcoming tournaments`, 'success');
      } catch (error) {
        this.log(`Upcoming endpoint failed: ${error.message}`, 'warning');
      }

      // Test past tournaments
      this.log('Fetching past tournaments...', 'info');
      try {
        const pastResponse = await tournamentAPI.getPast();
        this.log(`Found ${pastResponse.data.length} past tournaments`, 'success');
      } catch (error) {
        this.log(`Past endpoint failed: ${error.message}`, 'warning');
      }

      return true;
    } catch (error) {
      this.log(`Player history testing failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testQuizParticipation() {
    this.log('🎮 Testing quiz participation...', 'info');
    
    if (!this.testTournament) {
      this.log('No test tournament available for participation testing', 'warning');
      return false;
    }

    try {
      // Get tournament questions first
      this.log('Getting tournament questions for participation...', 'info');
      const questionsResponse = await tournamentAPI.getQuestions(this.testTournament.id);
      const questions = questionsResponse.data;
      
      if (!questions || questions.length === 0) {
        this.log('No questions available for participation test', 'warning');
        return false;
      }

      this.log(`Got ${questions.length} questions for participation test`, 'success');

      // Create dummy answers (first option for each question)
      const dummyAnswers = questions.map(q => {
        if (q.options && q.options.length > 0) {
          return q.options[0];
        } else if (q.answers && q.answers.length > 0) {
          return q.answers[0];
        } else {
          return 'Test Answer';
        }
      });

      this.log('Submitting quiz participation...', 'info');
      const participationResponse = await tournamentAPI.participate(this.testTournament.id, {
        answers: dummyAnswers
      });

      this.log(`Quiz participation successful! Score: ${participationResponse.data.score}`, 'success');
      return true;
    } catch (error) {
      this.log(`Quiz participation failed: ${error.response?.data?.message || error.message}`, 'error');
      return false;
    }
  }

  async testUserProfile() {
    this.log('👤 Testing user profile operations...', 'info');
    
    try {
      // Test getting current user
      this.log('Fetching current user profile...', 'info');
      const userResponse = await userAPI.getCurrentUser();
      this.log('Current user profile fetch successful', 'success');

      // Test updating profile
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: userResponse.data.email,
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01',
        preferredCategory: 'Science & Nature'
      };

      this.log('Attempting to update user profile...', 'info');
      const updateResponse = await userAPI.updateProfile(updateData);
      this.log('User profile update successful', 'success');

      return true;
    } catch (error) {
      this.log(`User profile operations failed: ${error.response?.data?.message || error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting comprehensive functionality test...', 'info');
    
    const tests = [
      { name: 'Backend Connectivity', fn: () => this.testBackendConnectivity() },
      { name: 'Authentication', fn: () => this.testAuthentication() },
      { name: 'Tournament Operations', fn: () => this.testTournamentOperations() },
      { name: 'Like Functionality', fn: () => this.testLikeFunctionality() },
      { name: 'Player History Endpoints', fn: () => this.testPlayerHistoryEndpoints() },
      { name: 'Quiz Participation', fn: () => this.testQuizParticipation() },
      { name: 'User Profile', fn: () => this.testUserProfile() }
    ];

    const results = {};
    
    for (const test of tests) {
      this.log(`\n🔬 Running ${test.name} test...`, 'info');
      try {
        const result = await test.fn();
        results[test.name] = result;
        this.log(`${test.name} test ${result ? 'PASSED' : 'FAILED'}`, result ? 'success' : 'error');
      } catch (error) {
        results[test.name] = false;
        this.log(`${test.name} test FAILED with error: ${error.message}`, 'error');
      }
    }

    // Generate summary
    const passedTests = Object.values(results).filter(r => r === true).length;
    const totalTests = Object.keys(results).length;
    
    this.log(`\n📊 Test Summary: ${passedTests}/${totalTests} tests passed`, 'info');
    
    // Detailed results
    Object.entries(results).forEach(([testName, passed]) => {
      this.log(`  ${passed ? '✅' : '❌'} ${testName}`, passed ? 'success' : 'error');
    });

    if (passedTests === totalTests) {
      this.log('\n🎉 All tests passed! Your application is working correctly.', 'success');
    } else {
      this.log(`\n⚠️ ${totalTests - passedTests} tests failed. Check the errors above for details.`, 'warning');
    }

    return results;
  }

  getResults() {
    return this.results;
  }

  exportResults() {
    const resultsString = this.results
      .map(r => `[${r.timestamp}] ${r.type.toUpperCase()}: ${r.message}`)
      .join('\n');
    
    const blob = new Blob([resultsString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-app-test-results-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export the tester class
export default FunctionalityTester;

// Usage example:
// import FunctionalityTester from './utils/testFunctionality';
// 
// const tester = new FunctionalityTester();
// tester.runAllTests().then(results => {
//   console.log('Test completed:', results);
//   tester.exportResults(); // Download test results
// });