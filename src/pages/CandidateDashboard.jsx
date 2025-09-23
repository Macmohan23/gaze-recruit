import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Users, Briefcase, LogOut, Play } from "lucide-react";

const jobRoles = [
  { value: 'software_developer', label: 'Software Developer' },
  { value: 'data_analyst', label: 'Data Analyst' },
  { value: 'designer', label: 'Designer' },
  { value: 'product_manager', label: 'Product Manager' },
  { value: 'marketing_specialist', label: 'Marketing Specialist' },
  { value: 'sales_representative', label: 'Sales Representative' }
];

const CandidateDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/auth");
        return;
      }

      await loadProfile(session.user.id);
      await loadInterviews();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    setProfile(data);
    setSelectedRole(data.position_applied || "");
  };

  const loadInterviews = async () => {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading interviews:', error);
      return;
    }

    setInterviews(data || []);
  };

  const handleRoleSelection = async (role) => {
    setSelectedRole(role);
    
    if (!profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({ position_applied: role })
      .eq('id', profile.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update job role",
        variant: "destructive"
      });
      return;
    }

    setProfile({ ...profile, position_applied: role });
    toast({
      title: "Role Updated",
      description: `You are now applying for ${jobRoles.find(r => r.value === role)?.label}`,
    });
  };

  const startInterview = () => {
    if (!selectedRole) {
      toast({
        title: "Please Select a Role",
        description: "You need to select a job role before starting the interview",
        variant: "destructive"
      });
      return;
    }
    
    navigate("/interview", { state: { jobRole: selectedRole } });
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/95 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Candidate Portal</h1>
              <p className="text-muted-foreground">Manage your interview applications</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>
              Your registered details and application status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-lg">{profile?.full_name || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg">{profile?.email || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-lg">{profile?.phone || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Application</p>
                <p className="text-lg">
                  {profile?.position_applied ? (
                    <Badge variant="secondary">
                      {jobRoles.find(r => r.value === profile.position_applied)?.label}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">No role selected</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Role Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5" />
              <span>Job Role Selection</span>
            </CardTitle>
            <CardDescription>
              Choose the position you want to apply for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedRole} onValueChange={handleRoleSelection}>
              <SelectTrigger>
                <SelectValue placeholder="Select a job role to apply for" />
              </SelectTrigger>
              <SelectContent>
                {jobRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedRole && (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Ready to start your interview!</p>
                  <p className="text-sm text-muted-foreground">
                    You'll be asked {jobRoles.find(r => r.value === selectedRole)?.label} specific questions
                  </p>
                </div>
                <Button onClick={startInterview} className="bg-gradient-primary hover:opacity-90">
                  <Play className="w-4 h-4 mr-2" />
                  Start Interview
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interview History */}
        <Card>
          <CardHeader>
            <CardTitle>Interview History</CardTitle>
            <CardDescription>
              Your previous interview attempts and scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {interviews.length > 0 ? (
              <div className="space-y-3">
                {interviews.map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {jobRoles.find(r => r.value === interview.job_role)?.label || 'Unknown Role'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {interview.completed_at 
                          ? `Completed: ${new Date(interview.completed_at).toLocaleDateString()}`
                          : `Status: ${interview.status}`
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'}>
                        {interview.status}
                      </Badge>
                      {interview.score && (
                        <p className="text-sm font-medium mt-1">Score: {interview.score}/100</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No interviews completed yet. Start your first interview above!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateDashboard;