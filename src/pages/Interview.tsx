import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Eye, ArrowRight, CheckCircle, Clock, Camera, AlertTriangle } from "lucide-react";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useVideoRecording } from "@/hooks/useVideoRecording";
import { evaluateAnswer } from "@/utils/evaluationService";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: string;
  question_text: string;
  question_order: number;
  category: string;
  difficulty_level: string;
  expected_duration: number;
}

const Interview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Question state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);

  // Use hooks
  const { isLookingAway, gazeWarnings } = useFaceDetection(videoRef.current);
  const { 
    isListening: isRecording, 
    transcript, 
    isSupported: speechSupported, 
    startListening, 
    stopListening, 
    resetTranscript: setTranscript 
  } = useSpeechRecognition();
  const { recordedBlob, startRecording: startVideoRecording, stopRecording: stopVideoRecording } = useVideoRecording();

  // Load job-role specific questions and check authentication
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate('/auth');
          return;
        }

        // Get job role from navigation state or profile
        let jobRole = location.state?.jobRole;
        
        if (!jobRole) {
          // Fetch from profile if not in state
          const { data: profile } = await supabase
            .from('profiles')
            .select('position_applied')
            .eq('user_id', session.user.id)
            .single();
          
          jobRole = profile?.position_applied;
        }

        if (!jobRole) {
          toast({
            title: "No Job Role Selected",
            description: "Please select a job role before starting the interview",
            variant: "destructive"
          });
          navigate('/candidate/dashboard');
          return;
        }

        // Load role-specific questions
        const { data: questionsData, error } = await supabase
          .from('questions')
          .select('*')
          .eq('job_role', jobRole)
          .order('question_order');

        if (error) {
          console.error('Error loading questions:', error);
          toast({
            title: "Error",
            description: "Failed to load interview questions",
            variant: "destructive"
          });
          return;
        }

        if (!questionsData || questionsData.length === 0) {
          toast({
            title: "No Questions Available",
            description: "No questions found for the selected role",
            variant: "destructive"
          });
          navigate('/candidate/dashboard');
          return;
        }

        setQuestions(questionsData);
        setAnswers(new Array(questionsData.length).fill(""));
        setQuestionStartTime(Date.now());
      } catch (error) {
        console.error('Error in loadQuestions:', error);
        navigate('/auth');
      }
    };

    loadQuestions();
  }, [navigate, location.state, toast]);

  // Timer for question duration
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(Date.now() - questionStartTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [questionStartTime]);

  // Initialize camera and microphone
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setCameraReady(true);
        setMicReady(true);
        
        toast({
          title: "Media Access Granted",
          description: "Camera and microphone are ready for interview.",
        });

      } catch (error) {
        console.error('Media access error:', error);
        toast({
          title: "Media Access Required",
          description: "Please allow camera and microphone access to continue.",
          variant: "destructive"
        });
      }
    };

    initializeMedia();

    return () => {
      // Cleanup media stream
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [toast]);

  // Optimized gaze warning system to prevent spam
  const lastGazeWarningRef = useRef(0);
  useEffect(() => {
    if (isLookingAway) {
      const now = Date.now();
      // Only show toast warnings every 5 seconds to prevent spam
      if (now - lastGazeWarningRef.current > 5000) {
        toast({
          title: "Stay Focused",
          description: `Please maintain eye contact with the camera. Total warnings: ${gazeWarnings}`,
          variant: "destructive"
        });
        lastGazeWarningRef.current = now;
      }
    }
  }, [isLookingAway, gazeWarnings, toast]);

  const startRecording = () => {
    setHasRecorded(false);
    if (videoRef.current?.srcObject) {
      startVideoRecording(videoRef.current.srcObject as MediaStream);
    }
    
    // Start speech recognition if supported
    if (speechSupported) {
      setTranscript();
      startListening();
    }
    
    toast({
      title: "Recording Started",
      description: speechSupported ? "Speak clearly - your answer is being transcribed." : "Please answer the question clearly.",
    });
  };

  const stopRecording = () => {
    setHasRecorded(true);
    stopVideoRecording();
    
    // Stop speech recognition
    if (speechSupported) {
      stopListening();
    }
    
    toast({
      title: "Answer Recorded",
      description: "Click Submit to proceed to the next question.",
    });
  };

  const submitAnswer = () => {
    // Check if minimum time has elapsed (10 seconds)
    if (timeElapsed < 10000) {
      toast({
        title: "Please Take More Time",
        description: `You need to spend at least 10 seconds on each question. ${Math.ceil((10000 - timeElapsed) / 1000)} seconds remaining.`,
        variant: "destructive"
      });
      return;
    }

    // Allow submission if either audio was recorded OR transcript is available
    const hasValidTranscript = speechSupported && transcript.trim().length >= 10;
    const hasValidAudio = !speechSupported && hasRecorded;
    
    if (!hasValidTranscript && !hasValidAudio && !hasRecorded) {
      toast({
        title: "No Answer Recorded",
        description: speechSupported ? 
          "Please provide a detailed answer (minimum 10 characters) or record audio." :
          "Please record your answer before submitting.",
        variant: "destructive"
      });
      return;
    }

    // Validate transcript length only if speech recognition is supported and we have a transcript
    if (speechSupported && transcript.trim() && transcript.trim().length < 10) {
      toast({
        title: "Answer Too Short",
        description: "Please provide a more detailed answer (at least 10 characters).",
        variant: "destructive"
      });
      return;
    }

    // Store the answer - use transcript if available and valid, otherwise indicate audio was recorded
    const currentAnswer = (speechSupported && transcript.trim().length >= 10) ? 
      transcript.trim() : 
      "Audio response recorded";
      
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = currentAnswer;
    setAnswers(newAnswers);

    // Move to next question or complete interview
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      resetForNextQuestion();
    } else {
      completeInterview(newAnswers);
    }
  };

  const resetForNextQuestion = () => {
    setHasRecorded(false);
    setTranscript();
    setQuestionStartTime(Date.now());
    setTimeElapsed(0);
    stopRecording();
  };

  const completeInterview = async (finalAnswers: string[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!profile) {
        toast({
          title: "Error",
          description: "Profile not found",
          variant: "destructive"
        });
        return;
      }

      // Calculate total score from all answers
      const scores = finalAnswers.map((answer, index) => 
        evaluateAnswer(answer, questions[index]?.question_text || "")
      );
      const totalScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      
      // Create interview record
      const { data: interview, error: interviewError } = await supabase
        .from('interviews')
        .insert([{
          candidate_id: profile.id,
          score: totalScore,
          gaze_warnings: gazeWarnings,
          completion_time: Math.round((Date.now() - questionStartTime) / 1000),
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          status: 'completed',
          job_role: profile.position_applied as any,
          video_recording_url: recordedBlob ? URL.createObjectURL(recordedBlob) : null
        }])
        .select()
        .single();

      if (interviewError) {
        console.error('Error creating interview:', interviewError);
        toast({
          title: "Error",
          description: "Failed to save interview data",
          variant: "destructive"
        });
        return;
      }

      // Save answers
      if (interview) {
        const answerPromises = finalAnswers.map((answer, index) => {
          if (!questions[index]) return Promise.resolve();
          
          return supabase
            .from('answers')
            .insert([{
              interview_id: interview.id,
              question_id: questions[index].id,
              answer_text: answer,
              ai_score: scores[index],
              ai_feedback: "Answer evaluated successfully"
            }]);
        });

        await Promise.all(answerPromises);
      }
      
      stopVideoRecording();
      
      // Navigate to completion page
      navigate('/interview-complete', { 
        state: { 
          score: totalScore,
          answers: finalAnswers,
          gazeWarnings: gazeWarnings
        } 
      });
      
    } catch (error) {
      console.error('Error completing interview:', error);
      toast({
        title: "Error",
        description: "There was an error saving your interview. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/95 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading interview questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Interview Assessment</h1>
          <p className="text-muted-foreground">Answer the questions naturally and maintain eye contact with the camera</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>Question Progress</span>
            <span>{currentQuestion + 1} of {questions.length}</span>
          </div>
          <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-6 p-6 bg-card/50 backdrop-blur">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold flex-1">
              Question {currentQuestion + 1}: {questions[currentQuestion]?.question_text}
            </h2>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground ml-4">
              <Clock className="w-4 h-4" />
              <span>
                {Math.floor(timeElapsed / 1000)}s
                {timeElapsed >= 10000 ? ' ✓' : ` (${Math.ceil((10000 - timeElapsed) / 1000)}s required)`}
              </span>
            </div>
          </div>

          {/* Media and Controls */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Video Feed */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Video Monitor</h3>
              <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isLookingAway && (
                  <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                    <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Please look at the camera</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                  {isRecording && (
                    <div className="flex items-center space-x-2 bg-destructive/90 text-destructive-foreground px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
                      <span className="text-sm">Recording</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Indicators */}
              <div className="flex justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Camera className={`w-4 h-4 ${cameraReady ? 'text-accent' : 'text-destructive'}`} />
                    <span>Camera</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mic className={`w-4 h-4 ${micReady ? 'text-accent' : 'text-destructive'}`} />
                    <span>Microphone</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className={`w-4 h-4 ${isLookingAway ? 'text-destructive' : 'text-accent'}`} />
                  <span>Warnings: {gazeWarnings}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              <div className="flex space-x-4">
                {!isRecording ? (
                  <Button 
                    onClick={startRecording}
                    className="flex-1 bg-accent hover:bg-accent/90"
                    disabled={!cameraReady || !micReady}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start Answer
                  </Button>
                ) : (
                  <Button 
                    onClick={stopRecording}
                    variant="outline"
                    className="flex-1"
                  >
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop Recording
                  </Button>
                )}
                
                <Button 
                  onClick={submitAnswer}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                  disabled={
                    isRecording || 
                    timeElapsed < 10000 ||
                    (speechSupported ? 
                      (!hasRecorded && transcript.trim().length < 10) : 
                      !hasRecorded
                    )
                  }
                >
                  {currentQuestion < questions.length - 1 ? 'Submit & Next' : 'Submit & Complete'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Transcript Display */}
              {speechSupported && transcript && (
                <Card className="p-4 bg-muted/50">
                  <h4 className="font-semibold mb-2 text-sm">Live Transcript:</h4>
                  <p className="text-sm text-muted-foreground italic">{transcript}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Characters: {transcript.length}/10 minimum {transcript.length >= 10 ? '✓' : ''}
                  </p>
                </Card>
              )}
              
              {/* Recording Status for Non-Speech Recognition */}
              {!speechSupported && hasRecorded && (
                <Card className="p-4 bg-accent/10 border-accent/20">
                  <div className="flex items-center space-x-2 text-accent">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Audio answer recorded successfully</span>
                  </div>
                </Card>
              )}
              
              {/* Status indicator for speech recognition browsers */}
              {speechSupported && !isRecording && (
                <Card className="p-3 bg-muted/30">
                  <div className="flex items-center justify-between text-sm">
                    <span>Answer Status:</span>
                    <div className="flex items-center space-x-2">
                      {transcript.trim().length >= 10 ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-accent" />
                          <span className="text-accent">Ready to submit</span>
                        </>
                      ) : hasRecorded ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-primary" />
                          <span className="text-primary">Audio recorded</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 border-2 border-muted-foreground rounded-full" />
                          <span className="text-muted-foreground">Not ready</span>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Instructions */}
              <Card className="p-4 bg-muted">
                <h4 className="font-semibold mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-accent" />
                  Instructions
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Look directly at the camera while answering</li>
                  <li>• Speak clearly and at a normal pace</li>
                  <li>• Spend at least 10 seconds per question</li>
                  <li>• Provide detailed answers (minimum 10 characters)</li>
                  {speechSupported && <li>• Your speech is automatically transcribed</li>}
                  {!speechSupported && <li>• Speech recognition not available in this browser</li>}
                </ul>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Interview;