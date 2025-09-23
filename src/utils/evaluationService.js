// Optimized AI evaluation service using efficient scoring algorithms

// Pre-compiled keyword sets for O(1) lookup
const technicalKeywordSet = new Set([
  'algorithm', 'database', 'api', 'framework', 'programming', 'code',
  'system', 'architecture', 'design', 'development', 'testing', 'security',
  'javascript', 'react', 'node', 'sql', 'python', 'java', 'git', 'aws'
]);

const communicationKeywordSet = new Set([
  'experience', 'team', 'project', 'challenge', 'solution', 'learn',
  'collaborate', 'communicate', 'problem', 'responsibility', 'leadership',
  'mentor', 'feedback', 'conflict', 'stakeholder', 'presentation'
]);

export const evaluateInterview = (
  answers,
  gazeWarnings,
  totalQuestions
) => {
  // Filter and process answers in a single pass
  const validAnswers = answers.filter(a => a.trim().length > 10);
  const answerCompleteness = validAnswers.length / totalQuestions;
  const focusScore = Math.max(0, 100 - (gazeWarnings * 8));
  
  // Single-pass analysis for optimal performance
  let technicalMentions = 0;
  let communicationMentions = 0;
  let totalWordCount = 0;
  let uniqueTechnicalWords = new Set();
  let uniqueCommunicationWords = new Set();

  validAnswers.forEach(answer => {
    const lowerAnswer = answer.toLowerCase();
    const words = lowerAnswer.split(/\s+/);
    totalWordCount += words.length;
    
    // Single pass through words with Set lookups (O(1))
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, ''); // Remove punctuation
      if (technicalKeywordSet.has(cleanWord)) {
        technicalMentions++;
        uniqueTechnicalWords.add(cleanWord);
      }
      if (communicationKeywordSet.has(cleanWord)) {
        communicationMentions++;
        uniqueCommunicationWords.add(cleanWord);
      }
    });
  });

  // Calculate scores - only if there are valid answers
  if (validAnswers.length === 0) {
    return {
      overallScore: 0,
      communicationScore: 0,
      technicalScore: 0,
      confidenceScore: 0,
      focusScore: Math.round(focusScore),
      feedback: ["No valid answers provided. Please ensure you provide detailed responses."]
    };
  }

  const communicationScore = Math.min(100, 40 + (communicationMentions * 6) + (answerCompleteness * 30));
  const technicalScore = Math.min(100, 30 + (technicalMentions * 10) + (answerCompleteness * 35));
  const confidenceScore = Math.min(100, 50 + (totalWordCount / 30) + (answerCompleteness * 25));
  
  const overallScore = Math.round(
    (communicationScore * 0.3 + technicalScore * 0.25 + confidenceScore * 0.25 + focusScore * 0.2)
  );

  // Generate feedback
  const feedback = [];
  
  if (overallScore >= 80) {
    feedback.push("Excellent performance! You demonstrated strong communication and technical skills.");
  } else if (overallScore >= 70) {
    feedback.push("Good performance with room for improvement in some areas.");
  } else if (overallScore >= 60) {
    feedback.push("Fair performance. Consider practicing interview skills and technical knowledge.");
  } else {
    feedback.push("Needs improvement. Focus on communication skills and technical preparation.");
  }

  if (gazeWarnings > 3) {
    feedback.push("Try to maintain better eye contact during interviews.");
  }

  if (answerCompleteness < 0.8) {
    feedback.push("Provide more detailed answers to showcase your knowledge and experience.");
  }

  if (technicalMentions < 3) {
    feedback.push("Include more technical details relevant to the role you're applying for.");
  }

  return {
    overallScore,
    communicationScore: Math.round(communicationScore),
    technicalScore: Math.round(technicalScore),
    confidenceScore: Math.round(confidenceScore),
    focusScore: Math.round(focusScore),
    feedback
  };
};

// Optimized single answer evaluation
export const evaluateAnswer = (answer, question) => {
  if (!answer || answer.trim().length < 10) return 0;
  
  const lowerAnswer = answer.toLowerCase();
  const words = lowerAnswer.split(/\s+/);
  const wordCount = words.length;
  
  // Base score on length and content
  let score = Math.min(80, wordCount * 2);
  
  // Efficient keyword matching using Set lookup
  let technicalMentions = 0;
  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (technicalKeywordSet.has(cleanWord)) {
      technicalMentions++;
    }
  });
  
  // Bonus points with diminishing returns
  score += Math.min(20, technicalMentions * 5);
  
  return Math.min(100, score);
};