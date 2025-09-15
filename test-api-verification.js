// Quick test to verify our API fixes are working
import axios from 'axios';

// Simulate the API call that our components make
const testAPIResponse = async () => {
  const api = axios.create({
    baseURL: 'https://quiz-tournament-api.onrender.com/api',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' }
  });

  // Add auth header
  api.interceptors.request.use(config => {
    config.headers.Authorization = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcXVpemFwcC5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MjYwMzA2MDUsImV4cCI6MTcyNjAzNDIwNX0.example_token';
    return config;
  });

  // Sanitization function
  const sanitizeTournamentData = (data, visited = new Set()) => {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(item => sanitizeTournamentData(item, visited));
    if (typeof data === 'object') {
      const objKey = `${data.constructor?.name || 'Object'}_${data.id || Math.random()}`;
      if (visited.has(objKey)) return { id: data.id, name: data.name || 'Circular Reference', _circular: true };
      visited.add(objKey);
      const sanitized = {};
      const safeProps = ['id', 'name', 'category', 'difficulty', 'startDate', 'endDate', 'minimumPassingScore', 'description', 'status', 'participantsCount', 'likesCount', 'createdAt', 'updatedAt', 'questions', 'scores'];
      for (const prop of safeProps) if (data.hasOwnProperty(prop)) sanitized[prop] = data[prop];
      if (data.creator) sanitized.creator = { id: data.creator.id, username: data.creator.username, email: data.creator.email, firstName: data.creator.firstName, lastName: data.creator.lastName, role: data.creator.role, picture: data.creator.picture };
      visited.delete(objKey);
      return sanitized;
    }
    return data;
  };

  // Safe JSON parse
  const safeJsonParse = (response) => {
    try {
      let data;
      if (typeof response.data === 'object') {
        data = response.data;
      } else if (typeof response.data === 'string') {
        try {
          data = JSON.parse(response.data);
        } catch (parseError) {
          console.log('JSON parse failed, trying regex extraction...');
          const tournaments = [];
          const objectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
          let match;
          while ((match = objectRegex.exec(response.data)) !== null) {
            try {
              const obj = JSON.parse(match[0]);
              if (obj.id && obj.name && obj.category) tournaments.push(obj);
            } catch (e) {}
          }
          data = tournaments.length > 0 ? tournaments : [];
        }
      }
      return { ...response, data: sanitizeTournamentData(data) };
    } catch (error) {
      return { ...response, data: [], error: 'Parse failed' };
    }
  };

  try {
    console.log('Testing tournament API...');
    const response = await api.get('/tournaments');
    const parsedResponse = safeJsonParse(response);

    console.log('Response status:', response.status);
    console.log('Parsed tournaments count:', parsedResponse.data.length);

    if (parsedResponse.data.length > 0) {
      console.log('Sample tournament:', JSON.stringify(parsedResponse.data[0], null, 2));
      console.log('✅ API parsing is working correctly!');
    } else {
      console.log('❌ No tournaments found or parsing failed');
    }

    return parsedResponse;
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return { data: [], error: error.message };
  }
};

export default testAPIResponse;
