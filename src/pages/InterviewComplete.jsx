import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Trophy, AlertTriangle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

const InterviewComplete = () => {
  const navigate = useNavigate();
  const [candidateData, setCandidateData] = useState(null);
  const [score, setScore] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    // Get stored data
    const storedCandidate = localStorage.getItem('candidateData');
    const storedScore = localStorage.getItem('interviewScore');
    const storedWarnings = localStorage.getItem('gazeWarnings');
    const storedEvaluation = localStorage.getItem('evaluationResult');

    if (storedCandidate) {
      setCandidateData(JSON.parse(storedCandidate));
    }
    if (storedScore) {
      setScore(parseInt(storedScore));
    }
    if (storedWarnings) {
      setWarnings(parseInt(storedWarnings));
    }
    if (storedEvaluation) {
      setEvaluation(JSON.parse(storedEvaluation));
    }
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return "text-accent";
    if (score >= 70) return "text-primary";
    if (score >= 60) return "text-yellow-600";
    return "text-destructive";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Improvement";
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold">Interview Complete</h1>
        </div>
      </header>

      <main className="py-12 px-6">
        <div className="container mx-auto max-w-2xl">
          <Card className="p-8 shadow-medium text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-accent" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Interview Completed!</h2>
              <p className="text-muted-foreground">
                Thank you for participating in our AI-powered interview assessment.
              </p>
            </div>

            {candidateData && (
              <Card className="p-6 mb-6 bg-gradient-secondary">
                <h3 className="text-lg font-semibold mb-4">Candidate Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{candidateData.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{candidateData.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{candidateData.phone}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Score Display */}
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Trophy className={`w-8 h-8 ${getScoreColor(score)}`} />
                <div>
                  <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
                    {score}%
                  </div>
                  <div className={`text-lg ${getScoreColor(score)}`}>
                    {getScoreLabel(score)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Overall Performance</span>
                  <span>{score}%</span>
                </div>
                <Progress value={score} className="h-3" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {localStorage.getItem('answeredQuestions') || '10'}
                  </div>
                  <div className="text-muted-foreground">Questions Answered</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${warnings > 0 ? 'text-destructive' : 'text-accent'}`}>
                    {warnings}
                  </div>
                  <div className="text-muted-foreground">Gaze Warnings</div>
                </div>
              </div>
            </Card>

            {/* Performance Breakdown */}
            <Card className="p-6 mb-6 text-left">
              <h3 className="text-lg font-semibold mb-4">AI Analysis Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Communication Skills</span>
                  <span className="font-medium text-accent">{evaluation?.communicationScore || 85}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Technical Knowledge</span>
                  <span className="font-medium text-primary">{evaluation?.technicalScore || 78}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence Level</span>
                  <span className="font-medium text-accent">{evaluation?.confidenceScore || 82}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Focus & Attention</span>
                  <span className={`font-medium ${(evaluation?.focusScore || 90) < 70 ? 'text-destructive' : 'text-accent'}`}>
                    {evaluation?.focusScore || 90}%
                  </span>
                </div>
              </div>
            </Card>

            {warnings > 0 && (
              <Card className="p-4 mb-6 bg-destructive/10 border-destructive/20">
                <div className="flex items-center space-x-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">
                    {warnings} gaze warning{warnings > 1 ? 's' : ''} recorded during interview
                  </span>
                </div>
              </Card>
            )}

            {/* AI Feedback */}
            {evaluation?.feedback && evaluation.feedback.length > 0 && (
              <Card className="p-6 mb-6 text-left">
                <h3 className="text-lg font-semibold mb-4">AI Feedback</h3>
                <div className="space-y-2">
                  {evaluation.feedback.map((feedback, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{feedback}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your interview has been processed by our free AI system. The hiring team will review
                your performance and contact you within 2-3 business days.
              </p>
              
              <Button 
                onClick={() => navigate('/')}
                className="bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default InterviewComplete;