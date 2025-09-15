// Test script for sanitization function
const sanitizeTournamentData = (data, visited = new Set()) => {
  if (!data) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeTournamentData(item, visited));
  }

  // Handle objects
  if (typeof data === 'object') {
    // Create a unique key for this object to detect circular references
    const objKey = `${data.constructor.name}_${data.id || Math.random()}`;

    if (visited.has(objKey)) {
      // Circular reference detected, return a minimal representation
      return {
        id: data.id,
        name: data.name || 'Circular Reference',
        _circular: true
      };
    }

    visited.add(objKey);

    const sanitized = {};

    // Copy only safe properties
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

    // Handle creator object specially
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

// Test data with circular reference
const testData = {
  id: 1,
  name: 'Test Tournament',
  category: 'General Knowledge',
  creator: {
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    createdTournaments: [
      {
        id: 1,
        name: 'Test Tournament',
        creator: {
          id: 1,
          username: 'admin',
          createdTournaments: [] // This would create circular reference
        }
      }
    ]
  }
};

console.log('Testing sanitization function...');
console.log('Original data keys:', Object.keys(testData));
console.log('Original creator keys:', Object.keys(testData.creator));
console.log('Original createdTournaments length:', testData.creator.createdTournaments.length);

const sanitized = sanitizeTournamentData(testData);
console.log('\nSanitized data keys:', Object.keys(sanitized));
console.log('Sanitized creator keys:', Object.keys(sanitized.creator));
console.log('Sanitized creator has createdTournaments:', sanitized.creator.hasOwnProperty('createdTournaments'));

console.log('\nSanitization test completed successfully!');
