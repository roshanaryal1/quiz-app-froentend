// Tournament scoring utility functions
// Provides consistent scoring calculations across the frontend

/**
 * Calculate the absolute score required to pass based on percentage and total questions
 * @param {number} passingPercentage - The passing percentage (e.g., 70 for 70%)
 * @param {number} totalQuestions - Total number of questions in the tournament
 * @returns {number} The minimum number of correct answers required to pass
 */
export const calculatePassingScore = (passingPercentage, totalQuestions) => {
  if (!passingPercentage || !totalQuestions) return 0;
  return Math.ceil((passingPercentage * totalQuestions) / 100);
};

/**
 * Check if a score passes the minimum requirement
 * @param {number} userScore - User's actual score
 * @param {number} passingPercentage - The passing percentage (e.g., 70 for 70%)
 * @param {number} totalQuestions - Total number of questions
 * @returns {boolean} Whether the user passed
 */
export const checkIfPassed = (userScore, passingPercentage = 70, totalQuestions = 10) => {
  const requiredScore = calculatePassingScore(passingPercentage, totalQuestions);
  return userScore >= requiredScore;
};

/**
 * Get a detailed scoring summary
 * @param {number} userScore - User's actual score
 * @param {number} totalQuestions - Total number of questions
 * @param {number} passingPercentage - The passing percentage
 * @returns {object} Detailed scoring information
 */
export const getScoringDetails = (userScore, totalQuestions, passingPercentage = 70) => {
  const userPercentage = (userScore / totalQuestions) * 100;
  const requiredScore = calculatePassingScore(passingPercentage, totalQuestions);
  const passed = userScore >= requiredScore;
  
  return {
    userScore,
    totalQuestions,
    userPercentage: Math.round(userPercentage * 10) / 10, // Round to 1 decimal
    passingPercentage,
    requiredScore,
    passed,
    scoreText: `${userScore}/${totalQuestions}`,
    percentageText: `${userPercentage.toFixed(1)}%`,
    passRequirementText: `${requiredScore}/${totalQuestions} (${passingPercentage}%)`
  };
};

/**
 * Get score color class based on performance
 * @param {number} userScore - User's actual score
 * @param {number} totalQuestions - Total number of questions
 * @param {number} passingPercentage - The passing percentage
 * @returns {string} CSS class string for score display
 */
export const getScoreColorClass = (userScore, totalQuestions, passingPercentage = 70) => {
  const details = getScoringDetails(userScore, totalQuestions, passingPercentage);
  
  if (details.passed) {
    if (details.userPercentage >= 90) return 'text-green-600 bg-green-50'; // Excellent
    if (details.userPercentage >= 80) return 'text-blue-600 bg-blue-50';   // Good
    return 'text-yellow-600 bg-yellow-50'; // Passed
  } else {
    return 'text-red-600 bg-red-50'; // Failed
  }
};

/**
 * Format score for display with pass/fail indication
 * @param {number} userScore - User's actual score
 * @param {number} totalQuestions - Total number of questions
 * @param {number} passingPercentage - The passing percentage
 * @returns {object} Formatted display information
 */
export const formatScoreDisplay = (userScore, totalQuestions, passingPercentage = 70) => {
  const details = getScoringDetails(userScore, totalQuestions, passingPercentage);
  
  return {
    ...details,
    colorClass: getScoreColorClass(userScore, totalQuestions, passingPercentage),
    statusText: details.passed ? 'PASSED' : 'FAILED',
    statusIcon: details.passed ? '✅' : '❌',
    fullDisplayText: `${details.scoreText} (${details.percentageText}) - ${details.statusText}`
  };
};

/**
 * Validate tournament configuration for scoring
 * @param {object} tournament - Tournament object
 * @returns {object} Validation result with any issues found
 */
export const validateTournamentScoring = (tournament) => {
  const issues = [];
  
  if (!tournament.minimumPassingScore) {
    issues.push('Missing minimum passing score, defaulting to 70%');
  } else if (tournament.minimumPassingScore < 0 || tournament.minimumPassingScore > 100) {
    issues.push(`Invalid passing score: ${tournament.minimumPassingScore}%. Must be between 0-100%`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    normalizedPassingScore: Math.max(0, Math.min(100, tournament.minimumPassingScore || 70))
  };
};

// Export all utility functions
export default {
  calculatePassingScore,
  checkIfPassed,
  getScoringDetails,
  getScoreColorClass,
  formatScoreDisplay,
  validateTournamentScoring
};
