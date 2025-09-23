import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Camera, Mic, Award } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  const Header = () => (
    <header className="flex items-center justify-center p-6 bg-background border-b">
      <div className="flex items-center space-x-2">
        <Bot className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">InterviewAI</h1>
      </div>
    </header>
  );

  const HeroSection = () => (
    <section className="py-16 px-6 text-center bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold mb-6 text-foreground">
          AI-Powered Interview Automation Platform
        </h2>
        <p className="text-xl text-muted-foreground mb-12">
          Experience the future of hiring with our intelligent interview system that combines 
          advanced AI analysis, real-time monitoring, and comprehensive evaluation.
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="p-6">
            <Camera className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Face Recognition</h3>
            <p className="text-sm text-muted-foreground">
              Advanced computer vision tracks attention and engagement throughout the interview
            </p>
          </Card>
          
          <Card className="p-6">
            <Mic className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Voice Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Real-time speech-to-text processing captures and analyzes candidate responses
            </p>
          </Card>
          
          <Card className="p-6">
            <Award className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">AI Scoring</h3>
            <p className="text-sm text-muted-foreground">
              Intelligent evaluation system provides detailed performance metrics and insights
            </p>
          </Card>
        </div>
      </div>
    </section>
  );

  const ModuleSelection = () => (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-3xl font-bold text-center mb-12">Choose Your Path</h3>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-6 w-6" />
                Candidate Portal
              </CardTitle>
              <CardDescription>
                Start your AI-powered interview experience. Complete personality assessment, 
                technical evaluation, and showcase your skills.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>• Interactive AI interview questions</li>
                <li>• Real-time performance feedback</li>
                <li>• Video recording and analysis</li>
                <li>• Comprehensive skill assessment</li>
              </ul>
              <Button 
                onClick={() => navigate("/candidate")} 
                className="w-full"
                size="lg"
              >
                Start Interview
              </Button>
            </CardContent>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6" />
                Admin Dashboard
              </CardTitle>
              <CardDescription>
                Access comprehensive analytics, review candidate performances, 
                and manage interview processes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>• Detailed candidate analytics</li>
                <li>• Video playback and review</li>
                <li>• Performance scoring system</li>
                <li>• Interview management tools</li>
              </ul>
              <Button 
                onClick={() => navigate("/admin")} 
                variant="outline" 
                className="w-full"
                size="lg"
              >
                Admin Access
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );

  const Footer = () => (
    <footer className="py-8 px-6 border-t bg-secondary/10 text-center">
      <p className="text-sm text-muted-foreground">
        © 2024 InterviewAI. Revolutionizing recruitment through artificial intelligence.
      </p>
    </footer>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <ModuleSelection />
      <Footer />
    </div>
  );
};

export default Home;