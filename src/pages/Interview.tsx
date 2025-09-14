import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Camera, Mic, Eye, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { evaluateInterview } from "@/utils/evaluationService";

// Sample interview questions
const INTERVIEW_QUESTIONS = [
  "Tell me about yourself and your background.",
  "Why should we hire you for this role?",
  "What are your strengths and weaknesses?",
  "Where do you see yourself in the next 5 years?",
  "Explain the concept of Object-Oriented Programming (OOP).",
  "What is the difference between supervised and unsupervised learning?",
  "Explain REST APIs and how they work.",
  "What are the differences between SQL and NoSQL databases?",
  "Explain a challenging problem you solved recently and how you approached it.",
  "How would you explain a complex technical concept to a non-technical person?"
];

const Interview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [answers, setAnswers] = useState<string[]>(new Array(INTERVIEW_QUESTIONS.length).fill(''));
  
  // Use face detection hook
  const { isLookingAway, gazeWarnings, setGazeWarnings } = useFaceDetection(videoRef.current);
  
  // Use speech recognition hook
  const { 
    isListening, 
    transcript, 
    isSupported: speechSupported, 
    startListening, 
    stopListening, 
    resetTranscript 
  } = useSpeechRecognition();

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

        // Initialize media recorder
        mediaRecorderRef.current = new MediaRecorder(stream);
        
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

  // Show gaze warnings from face detection
  useEffect(() => {
    if (isLookingAway) {
      toast({
        title: "Stay Focused",
        description: `Please look at the camera during the interview. Warning ${gazeWarnings + 1}`,
        variant: "destructive"
      });
    }
  }, [isLookingAway, gazeWarnings, toast]);

  const startRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setHasRecorded(false);
      
      // Start speech recognition if supported
      if (speechSupported) {
        resetTranscript();
        startListening();
      }
      
      toast({
        title: "Recording Started",
        description: speechSupported ? "Speak clearly - your answer is being transcribed." : "Please answer the question clearly.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setHasRecorded(true);
      
      // Stop speech recognition
      if (speechSupported && isListening) {
        stopListening();
      }
      
      toast({
        title: "Answer Recorded",
        description: "Click Submit to proceed to the next question.",
      });
    }
  };

  const submitAnswer = () => {
    if (!hasRecorded) {
      toast({
        title: "No Answer Recorded",
        description: "Please record your answer before submitting.",
        variant: "destructive"
      });
      return;
    }

    // Store the transcribed answer or placeholder
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = transcript || `Recorded answer for question ${currentQuestion + 1}`;
    setAnswers(newAnswers);

    // Move to next question
    if (currentQuestion < INTERVIEW_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setHasRecorded(false);
      toast({
        title: "Next Question",
        description: `Moving to question ${currentQuestion + 2}`,
      });
    } else {
      // Interview completed - only calculate score if answers were provided
      const answeredQuestions = newAnswers.filter(answer => answer.trim() !== '').length;
      if (answeredQuestions === 0) {
        toast({
          title: "No Answers Recorded",
          description: "Please answer at least one question to complete the interview.",
          variant: "destructive"
        });
        return;
      }
      
      // Use AI evaluation service
      const evaluation = evaluateInterview(newAnswers, gazeWarnings, INTERVIEW_QUESTIONS.length);
      
      localStorage.setItem('interviewScore', evaluation.overallScore.toString());
      localStorage.setItem('gazeWarnings', gazeWarnings.toString());
      localStorage.setItem('answeredQuestions', answeredQuestions.toString());
      localStorage.setItem('evaluationResult', JSON.stringify(evaluation));
      
      toast({
        title: "Interview Completed!",
        description: "Thank you for your participation.",
      });
      
      navigate('/interview-complete');
    }
  };

  // Remove the old nextQuestion function - replaced by submitAnswer

  const progress = ((currentQuestion + 1) / INTERVIEW_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">AI Interview Assessment</h1>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Camera className={`w-4 h-4 ${cameraReady ? 'text-accent' : 'text-destructive'}`} />
                <span>Camera</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mic className={`w-4 h-4 ${micReady ? 'text-accent' : 'text-destructive'}`} />
                <span>Microphone</span>
              </div>
                <div className="flex items-center space-x-2">
                  <Eye className={`w-4 h-4 ${isLookingAway ? 'text-destructive' : 'text-accent'}`} />
                  <span>Gaze: {gazeWarnings} warnings</span>
                </div>
                {speechSupported && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-accent animate-pulse' : 'bg-muted'}`} />
                    <span>Speech: {isListening ? 'Listening' : 'Ready'}</span>
                  </div>
                )}
            </div>
          </div>
        </div>
      </header>

      <main className="py-8 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Video Feed */}
            <Card className="p-6 shadow-medium">
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
              </div>
            </Card>

            {/* Interview Panel */}
            <Card className="p-6 shadow-medium">
              <div className="space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Question {currentQuestion + 1} of {INTERVIEW_QUESTIONS.length}</span>
                    <span>{Math.round(progress)}% Complete</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Current Question */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Current Question:</h3>
                  <Card className="p-4 bg-gradient-secondary border-l-4 border-l-primary">
                    <p className="text-lg leading-relaxed">
                      {INTERVIEW_QUESTIONS[currentQuestion]}
                    </p>
                  </Card>
                </div>

                {/* Controls */}
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
                      Stop Recording
                    </Button>
                  )}
                  
                  <Button 
                    onClick={submitAnswer}
                    className="flex-1 bg-gradient-primary hover:opacity-90"
                    disabled={isRecording || !hasRecorded}
                  >
                    {currentQuestion < INTERVIEW_QUESTIONS.length - 1 ? 'Submit & Next' : 'Submit & Complete'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {/* Transcript Display */}
                {speechSupported && transcript && (
                  <Card className="p-4 bg-muted/50">
                    <h4 className="font-semibold mb-2 text-sm">Live Transcript:</h4>
                    <p className="text-sm text-muted-foreground italic">{transcript}</p>
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
                    <li>• Take your time to think before answering</li>
                    {speechSupported && <li>• Your speech is automatically transcribed</li>}
                    {!speechSupported && <li>• Speech recognition not available in this browser</li>}
                  </ul>
                </Card>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Interview;