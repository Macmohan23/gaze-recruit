import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  Eye, 
  AlertTriangle, 
  Play,
  Download,
  LogOut,
  BarChart3,
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Sample candidate data
const SAMPLE_CANDIDATES = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@email.com", 
    phone: "+1 (555) 123-4567",
    score: 85,
    gazeWarnings: 1,
    completedAt: "2024-01-15 14:30",
    status: "completed"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 987-6543", 
    score: 92,
    gazeWarnings: 0,
    completedAt: "2024-01-15 11:15",
    status: "completed"
  },
  {
    id: 3,
    name: "Michael Chen",
    email: "michael.chen@email.com",
    phone: "+1 (555) 456-7890",
    score: 78,
    gazeWarnings: 3,
    completedAt: "2024-01-14 16:45",
    status: "completed"
  },
  {
    id: 4,
    name: "Emily Rodriguez",
    email: "emily.rodriguez@email.com",
    phone: "+1 (555) 321-0987",
    score: 88,
    gazeWarnings: 2,
    completedAt: "2024-01-14 09:20",
    status: "completed"
  }
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState(SAMPLE_CANDIDATES);

  useEffect(() => {
    // Check if admin is authenticated
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin');
      return;
    }

    // Load any stored candidate data from interview completion
    const storedCandidate = localStorage.getItem('candidateData');
    const storedScore = localStorage.getItem('interviewScore');
    const storedWarnings = localStorage.getItem('gazeWarnings');

    if (storedCandidate && storedScore && storedWarnings) {
      const candidateData = JSON.parse(storedCandidate);
      const newCandidate = {
        id: Date.now(),
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone,
        score: parseInt(storedScore),
        gazeWarnings: parseInt(storedWarnings),
        completedAt: new Date().toLocaleString(),
        status: "completed"
      };

      setCandidates(prev => [newCandidate, ...prev]);
      
      // Clear stored data
      localStorage.removeItem('candidateData');
      localStorage.removeItem('interviewScore');  
      localStorage.removeItem('gazeWarnings');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/admin');
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 85) return "default";
    if (score >= 70) return "secondary";
    return "destructive";
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-accent";
    if (score >= 70) return "text-primary";
    return "text-destructive";
  };

  const averageScore = Math.round(candidates.reduce((acc, c) => acc + c.score, 0) / candidates.length);
  const totalWarnings = candidates.reduce((acc, c) => acc + c.gazeWarnings, 0);

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="py-8 px-6">
        <div className="container mx-auto max-w-7xl space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 shadow-soft">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{candidates.length}</p>
                  <p className="text-sm text-muted-foreground">Total Candidates</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-soft">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
                    {averageScore}%
                  </p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-soft">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{totalWarnings}</p>
                  <p className="text-sm text-muted-foreground">Total Warnings</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-soft">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-secondary/50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Today</p>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Candidates Table */}
          <Card className="shadow-medium">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Interview Results</h2>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-semibold">Candidate</th>
                    <th className="p-4 font-semibold">Contact</th>
                    <th className="p-4 font-semibold">Score</th>
                    <th className="p-4 font-semibold">Warnings</th>
                    <th className="p-4 font-semibold">Completed</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{candidate.name}</p>
                          <p className="text-sm text-muted-foreground">ID: {candidate.id}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="text-sm">{candidate.email}</p>
                          <p className="text-sm text-muted-foreground">{candidate.phone}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getScoreBadgeVariant(candidate.score)}>
                          {candidate.score}%
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {candidate.gazeWarnings > 0 && (
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                          )}
                          <span className={candidate.gazeWarnings > 0 ? 'text-destructive font-medium' : ''}>
                            {candidate.gazeWarnings}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {candidate.completedAt}
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Play className="w-4 h-4 mr-1" />
                            Recording
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* AI Analysis Summary */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 shadow-soft">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Performance Analytics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Excellent (85%+)</span>
                  <span className="font-medium text-accent">
                    {candidates.filter(c => c.score >= 85).length} candidates
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Good (70-84%)</span>
                  <span className="font-medium text-primary">
                    {candidates.filter(c => c.score >= 70 && c.score < 85).length} candidates
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Needs Improvement (60-69%)</span>
                  <span className="font-medium text-destructive">
                    {candidates.filter(c => c.score >= 60 && c.score < 70).length} candidates
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-soft">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Attention Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Perfect Focus (0 warnings)</span>
                  <span className="font-medium text-accent">
                    {candidates.filter(c => c.gazeWarnings === 0).length} candidates
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Minor Distractions (1-2)</span>
                  <span className="font-medium text-primary">
                    {candidates.filter(c => c.gazeWarnings >= 1 && c.gazeWarnings <= 2).length} candidates
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Attention Issues (3+)</span>
                  <span className="font-medium text-destructive">
                    {candidates.filter(c => c.gazeWarnings >= 3).length} candidates
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;