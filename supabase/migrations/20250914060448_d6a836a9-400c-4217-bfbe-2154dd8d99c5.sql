-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  position_applied TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interviews table to store interview data
CREATE TABLE public.interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  score INTEGER,
  gaze_warnings INTEGER DEFAULT 0,
  completion_time INTEGER, -- in seconds
  video_recording_url TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table for interview questions
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  expected_duration INTEGER DEFAULT 120, -- in seconds
  category TEXT,
  difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create answers table to store candidate responses
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_audio_url TEXT,
  response_time INTEGER, -- in seconds
  ai_score INTEGER,
  ai_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gaze_warnings table to track detailed warning data
CREATE TABLE public.gaze_warnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  warning_type TEXT NOT NULL DEFAULT 'looking_away' CHECK (warning_type IN ('looking_away', 'multiple_faces', 'no_face_detected')),
  timestamp_offset INTEGER NOT NULL, -- offset from interview start in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaze_warnings ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for interviews
CREATE POLICY "Users can view their own interviews" 
ON public.interviews 
FOR SELECT 
USING (candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own interviews" 
ON public.interviews 
FOR INSERT 
WITH CHECK (candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own interviews" 
ON public.interviews 
FOR UPDATE 
USING (candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create policies for questions (read-only for authenticated users)
CREATE POLICY "Authenticated users can view questions" 
ON public.questions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create policies for answers
CREATE POLICY "Users can view their own answers" 
ON public.answers 
FOR SELECT 
USING (interview_id IN (
  SELECT id FROM public.interviews 
  WHERE candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
));

CREATE POLICY "Users can create their own answers" 
ON public.answers 
FOR INSERT 
WITH CHECK (interview_id IN (
  SELECT id FROM public.interviews 
  WHERE candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
));

-- Create policies for gaze_warnings
CREATE POLICY "Users can view their own gaze warnings" 
ON public.gaze_warnings 
FOR SELECT 
USING (interview_id IN (
  SELECT id FROM public.interviews 
  WHERE candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
));

CREATE POLICY "Users can create their own gaze warnings" 
ON public.gaze_warnings 
FOR INSERT 
WITH CHECK (interview_id IN (
  SELECT id FROM public.interviews 
  WHERE candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
));

-- Admin policies (users with admin role can view all data)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all interviews" 
ON public.interviews 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all answers" 
ON public.answers 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all gaze warnings" 
ON public.gaze_warnings 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');

-- Create storage buckets for video recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('interview-recordings', 'interview-recordings', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('interview-audio', 'interview-audio', false);

-- Create storage policies
CREATE POLICY "Users can upload their own recordings" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'interview-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own recordings" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'interview-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own audio" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'interview-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own audio" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'interview-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin storage policies
CREATE POLICY "Admins can view all recordings" 
ON storage.objects 
FOR SELECT 
USING ((bucket_id = 'interview-recordings' OR bucket_id = 'interview-audio') AND auth.jwt() ->> 'role' = 'admin');

-- Insert sample questions
INSERT INTO public.questions (question_text, question_order, category, difficulty_level) VALUES
('Tell me about yourself and your background.', 1, 'General', 'easy'),
('Why are you interested in this position?', 2, 'Motivation', 'easy'),
('Describe a challenging project you worked on and how you overcame obstacles.', 3, 'Experience', 'medium'),
('How do you handle working under pressure and tight deadlines?', 4, 'Behavioral', 'medium'),
('Where do you see yourself in 5 years?', 5, 'Career Goals', 'easy'),
('Describe a time when you had to work with a difficult team member.', 6, 'Teamwork', 'medium'),
('What is your greatest strength and weakness?', 7, 'Self-awareness', 'medium'),
('How do you stay updated with industry trends and technologies?', 8, 'Continuous Learning', 'medium');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();