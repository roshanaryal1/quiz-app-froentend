// Test script to verify API functions work with sanitization
import axios from 'axios';

// Simulate the API configuration
const API_BASE_URL = 'https://quiz-tournament-api.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcXVpemFwcC5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MjYwMzA2MDUsImV4cCI6MTcyNjAzNDIwNX0.example_token';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.metadata = { startTime: new Date().getTime() };
    return config;
  },
  (error) => Promise.reject(error)
);

// Sanitization function
const sanitizeTournamentData = (data, visited = new Set()) => {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeTournamentData(item, visited));
  }

  if (typeof data === 'object') {
    const objKey = `${data.constructor?.name || 'Object'}_${data.id || Math.random()}`;

    if (visited.has(objKey)) {
      return {
        id: data.id,
        name: data.name || 'Circular Reference',
        _circular: true
      };
    }

    visited.add(objKey);

    const sanitized = {};
    const safeProps = [
      'id', 'name', 'category', 'difficulty', 'startDate', 'endDate',
      'minimumPassingScore', 'description', 'status', 'participantsCount',
      'likesCount', 'createdAt', 'updatedAt', 'questions', 'scores'
    ];

    for (const prop of safeProps) {
      if (data.hasOwnProperty(prop)) {
        sanitized[prop] = data[prop];
      }
    }

    if (data.creator && typeof data.creator === 'object') {
      sanitized.creator = {
        id: data.creator.id,
        username: data.creator.username,
        email: data.creator.email,
        firstName: data.creator.firstName,
        lastName: data.creator.lastName,
        role: data.creator.role,
        picture: data.creator.picture
      };
    }

    visited.delete(objKey);
    return sanitized;
  }

  return data;
};

// Safe JSON parse function with better error handling for malformed responses
const safeJsonParse = (response) => {
  try {
    let data;
    
    // If response.data is already parsed, use it
    if (typeof response.data === 'object') {
      data = response.data;
    } else if (typeof response.data === 'string') {
      // Try to parse the string, but handle potential circular references
      try {
        data = JSON.parse(response.data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        
        // If parsing fails due to circular references, try to extract individual objects
        console.log('Attempting to extract individual tournament objects from malformed JSON...');
        
        const tournaments = [];
        const objectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
        let match;
        
        while ((match = objectRegex.exec(response.data)) !== null) {
          try {
            const obj = JSON.parse(match[0]);
            // Check if this looks like a tournament object
            if (obj.id && obj.name && obj.category) {
              tournaments.push(obj);
            }
          } catch (objParseError) {
            // Skip malformed objects
            console.log('Skipping malformed object');
          }
        }
        
        if (tournaments.length > 0) {
          console.log(`Successfully extracted ${tournaments.length} tournament objects`);
          data = tournaments;
        } else {
          // Last resort: try to find the start of valid JSON
          const jsonStart = response.data.indexOf('[{');
          if (jsonStart !== -1) {
            // Look for a valid closing bracket
            let bracketCount = 0;
            let endIndex = jsonStart;
            
            for (let i = jsonStart; i < response.data.length; i++) {
              if (response.data[i] === '{') bracketCount++;
              if (response.data[i] === '}') bracketCount--;
              
              if (bracketCount === 0 && i > jsonStart) {
                endIndex = i + 1;
                break;
              }
            }
            
            if (endIndex > jsonStart) {
              try {
                const chunk = response.data.substring(jsonStart, endIndex);
                data = JSON.parse(chunk);
                console.log('Successfully parsed JSON chunk');
              } catch (chunkError) {
                console.error('Chunk parsing also failed');
              }
            }
          }
          
          if (!data) {
            console.error('Could not extract valid JSON from malformed response');
            return {
              ...response,
              data: [],
              error: 'Failed to parse malformed JSON response'
            };
          }
        }
      }
    } else {
      data = response.data;
    }

    // Sanitize the data to remove circular references
    const sanitizedData = sanitizeTournamentData(data);
    
    return {
      ...response,
      data: sanitizedData
    };
  } catch (error) {
    console.error('Safe JSON parse error:', error);
    // Return a safe fallback response
    return {
      ...response,
      data: [],
      error: 'Failed to parse response data'
    };
  }
};

// Test the API call
const testTournamentAPI = async () => {
  try {
    console.log('Testing tournament API call...');
    const response = await api.get('/tournaments');
    console.log('Raw response received, length:', response.data?.length || 'unknown');

    const sanitizedResponse = safeJsonParse(response);
    console.log('Sanitized response data length:', sanitizedResponse.data?.length || 0);

    if (sanitizedResponse.data && Array.isArray(sanitizedResponse.data)) {
      console.log('First tournament:', JSON.stringify(sanitizedResponse.data[0], null, 2));
    }

    console.log('Test completed successfully!');
    return sanitizedResponse;
  } catch (error) {
    console.error('API test failed:', error.message);
    return { data: [], error: error.message };
  }
};

// Run the test
testTournamentAPI();
