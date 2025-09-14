// Free AI evaluation service using simple scoring algorithms
export interface EvaluationResult {
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  confidenceScore: number;
  focusScore: number;
  feedback: string[];
}

export const evaluateInterview = (
  answers: string[],
  gazeWarnings: number,
  totalQuestions: number
): EvaluationResult => {
  // Basic scoring algorithm
  const answerCompleteness = answers.filter(a => a.trim().length > 20).length / totalQuestions;
  const focusScore = Math.max(0, 100 - (gazeWarnings * 10));
  
  // Simple keyword analysis for technical content
  const technicalKeywords = [
    'algorithm', 'database', 'api', 'framework', 'programming', 'code',
    'system', 'architecture', 'design', 'development', 'testing', 'security'
  ];
  
  const communicationKeywords = [
    'experience', 'team', 'project', 'challenge', 'solution', 'learn',
    'collaborate', 'communicate', 'problem', 'responsibility'
  ];

  let technicalMentions = 0;
  let communicationMentions = 0;
  let totalWordCount = 0;

  answers.forEach(answer => {
    const words = answer.toLowerCase().split(/\s+/);
    totalWordCount += words.length;
    
    technicalKeywords.forEach(keyword => {
      if (words.includes(keyword)) technicalMentions++;
    });
    
    communicationKeywords.forEach(keyword => {
      if (words.includes(keyword)) communicationMentions++;
    });
  });

  // Calculate scores
  const communicationScore = Math.min(100, 60 + (communicationMentions * 5) + (answerCompleteness * 20));
  const technicalScore = Math.min(100, 50 + (technicalMentions * 8) + (answerCompleteness * 25));
  const confidenceScore = Math.min(100, 70 + (totalWordCount / 50) + (answerCompleteness * 15));
  
  const overallScore = Math.round(
    (communicationScore * 0.3 + technicalScore * 0.25 + confidenceScore * 0.25 + focusScore * 0.2)
  );

  // Generate feedback
  const feedback: string[] = [];
  
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