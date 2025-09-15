import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, FileVideo, Eye, Calendar, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminVideoPlayer } from "@/components/AdminVideoPlayer";

interface InterviewData {
  id: string;
  candidate_name: string;
  position_applied: string;
  score: number;
  gaze_warnings: number;
  completed_at: string;
  video_recording_url: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is authenticated
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin');
      return;
    }

    fetchInterviews();
  }, [navigate]);

  const fetchInterviews = async () => {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          id,
          score,
          gaze_warnings,
          completed_at,
          video_recording_url,
          profiles (
            full_name,
            position_applied
          )
        `)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(interview => ({
        id: interview.id,
        candidate_name: interview.profiles?.full_name || 'Unknown',
        position_applied: interview.profiles?.position_applied || 'Not specified',
        score: interview.score || 0,
        gaze_warnings: interview.gaze_warnings || 0,
        completed_at: interview.completed_at,
        video_recording_url: interview.video_recording_url || ''
      })) || [];

      setInterviews(formattedData);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast({
        title: "Error Loading Data",
        description: "Could not load interview data from database.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/admin');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading interviews...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage and review interview recordings</p>
            </div>
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
        <div className="container mx-auto max-w-7xl">
          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Interviews</p>
                  <p className="text-2xl font-bold">{interviews.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <FileVideo className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Recordings Available</p>
                  <p className="text-2xl font-bold">{interviews.filter(i => i.video_recording_url).length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Gaze Warnings</p>
                  <p className="text-2xl font-bold">
                    {interviews.length > 0 ? Math.round(interviews.reduce((sum, i) => sum + i.gaze_warnings, 0) / interviews.length) : 0}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">
                    {interviews.filter(i => 
                      new Date(i.completed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Interviews Table */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Interviews</h2>
              <div className="overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Warnings</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Video</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interviews.map((interview) => (
                      <TableRow key={interview.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{interview.candidate_name}</TableCell>
                        <TableCell>{interview.position_applied}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${getScoreColor(interview.score)} text-white`}>
                            {interview.score}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={interview.gaze_warnings > 5 ? "destructive" : "secondary"}>
                            {interview.gaze_warnings}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(interview.completed_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {interview.video_recording_url ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedInterview(interview)}
                            >
                              <FileVideo className="w-4 h-4" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">No recording</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Video Player */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Interview Recording</h2>
              {selectedInterview && selectedInterview.video_recording_url ? (
                <AdminVideoPlayer
                  videoPath={selectedInterview.video_recording_url}
                  candidateName={selectedInterview.candidate_name}
                  interviewDate={selectedInterview.completed_at}
                  interviewId={selectedInterview.id}
                />
              ) : (
                <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
                  <div className="text-center">
                    <FileVideo className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {selectedInterview ? "No recording available" : "Select an interview to view recording"}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;