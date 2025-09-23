// Scoring Validation Utility for Tournament Play
// Use this to debug and validate quiz scoring logic

export const validateQuizScoring = (questions, userAnswers) => {
  console.group('🎯 Quiz Scoring Validation');
  
  let correctCount = 0;
  let totalCount = questions.length;
  
  console.log(`📊 Total Questions: ${totalCount}`);
  console.log(`📝 User Answers Provided: ${userAnswers.length}`);
  
  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    const correctAnswer = question.correctAnswer;
    
    console.group(`Question ${index + 1}:`);
    console.log('❓ Question:', question.question);
    console.log('✅ Correct Answer:', correctAnswer);
    console.log('👤 User Answer:', userAnswer);
    console.log('🎲 Available Options:', question.options);
    
    // Check if user answer matches correct answer
    const isCorrect = userAnswer === correctAnswer;
    const isCorrectCaseInsensitive = userAnswer?.toLowerCase() === correctAnswer?.toLowerCase();
    
    if (isCorrect) {
      correctCount++;
      console.log('🎉 Result: CORRECT ✅');
    } else if (isCorrectCaseInsensitive) {
      console.log('⚠️  Result: CORRECT (case insensitive) ✅');
      correctCount++; // Still count as correct
    } else {
      console.log('❌ Result: INCORRECT');
      
      // Additional debugging
      if (userAnswer === null || userAnswer === undefined) {
        console.log('🔍 Issue: No answer provided');
      } else if (userAnswer === '') {
        console.log('🔍 Issue: Empty answer');
      } else if (!question.options.includes(userAnswer)) {
        console.log('🔍 Issue: Answer not in options list');
      } else {
        console.log('🔍 Issue: Different answer selected');
      }
    }
    
    console.groupEnd();
  });
  
  const percentage = (correctCount / totalCount) * 100;
  
  console.log(`📈 Final Score: ${correctCount}/${totalCount} (${percentage.toFixed(1)}%)`);
  console.groupEnd();
  
  return {
    correct: correctCount,
    total: totalCount,
    percentage: percentage,
    passed: percentage >= 60 // Assuming 60% pass rate
  };
};

// Function to check answer format consistency
export const checkAnswerFormat = (questions) => {
  console.group('🔍 Answer Format Analysis');
  
  questions.forEach((question, index) => {
    console.group(`Question ${index + 1}:`);
    console.log('Correct Answer Type:', typeof question.correctAnswer);
    console.log('Correct Answer Value:', question.correctAnswer);
    console.log('Options Types:', question.options.map(opt => typeof opt));
    console.log('Options Values:', question.options);
    
    // Check if correct answer is in options
    const correctInOptions = question.options.includes(question.correctAnswer);
    console.log('Correct Answer in Options:', correctInOptions ? '✅' : '❌');
    
    if (!correctInOptions) {
      console.warn('⚠️  WARNING: Correct answer not found in options!');
      
      // Try case-insensitive search
      const caseInsensitiveMatch = question.options.find(
        opt => opt.toLowerCase() === question.correctAnswer.toLowerCase()
      );
      if (caseInsensitiveMatch) {
        console.log('💡 Found case-insensitive match:', caseInsensitiveMatch);
      }
    }
    
    console.groupEnd();
  });
  
  console.groupEnd();
};

// Integration with tournament play
export const debugTournamentScoring = (questions, answers) => {
  console.log('🏆 TOURNAMENT SCORING DEBUG');
  console.log('='.repeat(50));
  
  // Check question format
  checkAnswerFormat(questions);
  
  // Validate scoring
  const result = validateQuizScoring(questions, answers);
  
  console.log('🎯 Expected Result:', result);
  
  return result;
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.validateQuizScoring = validateQuizScoring;
  window.checkAnswerFormat = checkAnswerFormat;
  window.debugTournamentScoring = debugTournamentScoring;
}
