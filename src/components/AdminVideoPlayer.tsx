import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminVideoPlayerProps {
  videoPath: string;
  candidateName: string;
  interviewDate: string;
  interviewId: string;
}

export const AdminVideoPlayer = ({ 
  videoPath, 
  candidateName, 
  interviewDate, 
  interviewId 
}: AdminVideoPlayerProps) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const { data } = await supabase.storage
          .from('interview-recordings')
          .createSignedUrl(videoPath, 60 * 60); // 1 hour expiry

        if (data?.signedUrl) {
          setVideoUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error loading video:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVideo();
  }, [videoPath]);

  const handlePlayPause = () => {
    const video = document.getElementById(`video-${interviewId}`) as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = async () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `interview-${candidateName}-${interviewDate}.webm`;
      link.click();
    }
  };

  const handleRestart = () => {
    const video = document.getElementById(`video-${interviewId}`) as HTMLVideoElement;
    if (video) {
      video.currentTime = 0;
      if (isPlaying) {
        video.play();
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse bg-muted h-48 rounded"></div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <h4 className="font-semibold">{candidateName}</h4>
        <p className="text-sm text-muted-foreground">
          Interview Date: {new Date(interviewDate).toLocaleString()}
        </p>
      </div>

      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          id={`video-${interviewId}`}
          src={videoUrl}
          className="w-full h-48 object-cover"
          controls
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>

      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={handlePlayPause}>
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button variant="outline" size="sm" onClick={handleRestart}>
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};