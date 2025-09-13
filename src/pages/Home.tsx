import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, Shield, BarChart3, Camera, Mic, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                InterviewAI
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            AI-Powered Interview
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Automation Platform
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Revolutionary interview system with face recognition, gaze tracking, and intelligent AI scoring
            to streamline your hiring process.
          </p>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 shadow-soft hover:shadow-medium transition-all duration-300">
              <Camera className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Face Recognition</h3>
              <p className="text-muted-foreground text-sm">
                Advanced face verification and liveness detection
              </p>
            </Card>
            <Card className="p-6 shadow-soft hover:shadow-medium transition-all duration-300">
              <Mic className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Voice Analysis</h3>
              <p className="text-muted-foreground text-sm">
                Speech-to-text with tone and sentiment analysis
              </p>
            </Card>
            <Card className="p-6 shadow-soft hover:shadow-medium transition-all duration-300">
              <BarChart3 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI Scoring</h3>
              <p className="text-muted-foreground text-sm">
                Intelligent evaluation of answers and performance
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Module Selection */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Candidate Module */}
            <Card className="p-8 shadow-medium hover:shadow-strong transition-all duration-300 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <UserCheck className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Candidate Portal</h3>
                <p className="text-muted-foreground mb-8">
                  Start your interview journey with our AI-powered assessment system.
                  Complete registration and begin your video interview.
                </p>
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                  onClick={() => navigate('/candidate')}
                >
                  Start Interview
                </Button>
              </div>
            </Card>

            {/* Admin Module */}
            <Card className="p-8 shadow-medium hover:shadow-strong transition-all duration-300 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Admin Dashboard</h3>
                <p className="text-muted-foreground mb-8">
                  Access comprehensive analytics, review candidate performance,
                  and manage interview assessments.
                </p>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full border-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => navigate('/admin')}
                >
                  Admin Login
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2024 InterviewAI. Advanced AI-powered recruitment platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;