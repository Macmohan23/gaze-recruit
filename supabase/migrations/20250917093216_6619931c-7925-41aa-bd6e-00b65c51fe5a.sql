-- Update profiles table to include position_applied field and ensure proper structure
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS position_applied TEXT;

-- Create job_roles enum for consistent role management
CREATE TYPE public.job_role AS ENUM (
  'software_developer',
  'data_analyst', 
  'designer',
  'product_manager',
  'marketing_specialist',
  'sales_representative'
);

-- Update questions table to include job_role field
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS job_role job_role;

-- Create some default questions for different roles
INSERT INTO public.questions (question_text, question_order, job_role, category, difficulty_level, expected_duration) VALUES 
-- Software Developer Questions
('Explain the difference between synchronous and asynchronous programming. Provide examples.', 1, 'software_developer', 'Technical', 'medium', 180),
('How would you optimize a slow database query? Walk through your debugging process.', 2, 'software_developer', 'Technical', 'medium', 180),
('Describe your experience with version control systems like Git. How do you handle merge conflicts?', 3, 'software_developer', 'Technical', 'easy', 120),

-- Data Analyst Questions  
('How do you ensure data quality and accuracy in your analysis? Describe your validation process.', 1, 'data_analyst', 'Technical', 'medium', 180),
('Explain the difference between supervised and unsupervised machine learning. Give examples of when to use each.', 2, 'data_analyst', 'Technical', 'medium', 180),
('Walk me through how you would analyze customer churn data to identify at-risk customers.', 3, 'data_analyst', 'Analytical', 'medium', 200),

-- Designer Questions
('Describe your design process from initial concept to final implementation.', 1, 'designer', 'Creative', 'easy', 150),
('How do you ensure your designs are accessible to users with disabilities?', 2, 'designer', 'Technical', 'medium', 180),
('Tell me about a time when you had to redesign something based on user feedback. What was your approach?', 3, 'designer', 'Behavioral', 'medium', 180),

-- Product Manager Questions
('How do you prioritize features when you have limited development resources?', 1, 'product_manager', 'Strategic', 'medium', 180),
('Describe how you would gather and validate user requirements for a new product feature.', 2, 'product_manager', 'Analytical', 'medium', 200),
('Tell me about a time when you had to make a difficult product decision with incomplete data.', 3, 'product_manager', 'Behavioral', 'medium', 180),

-- Marketing Specialist Questions
('How do you measure the success of a marketing campaign? What KPIs do you track?', 1, 'marketing_specialist', 'Analytical', 'medium', 150),
('Describe your approach to creating content for different social media platforms.', 2, 'marketing_specialist', 'Creative', 'easy', 120),
('How would you develop a go-to-market strategy for a new product launch?', 3, 'marketing_specialist', 'Strategic', 'medium', 200),

-- Sales Representative Questions
('Walk me through your sales process from lead generation to closing.', 1, 'sales_representative', 'Process', 'easy', 150),
('How do you handle objections from potential customers who say your product is too expensive?', 2, 'sales_representative', 'Behavioral', 'medium', 180),
('Describe how you build and maintain long-term relationships with clients.', 3, 'sales_representative', 'Relationship', 'medium', 150)
ON CONFLICT DO NOTHING;

-- Update existing questions to have a default job role if they don't have one
UPDATE public.questions 
SET job_role = 'software_developer' 
WHERE job_role IS NULL;

-- Create RLS policy for job-role specific question access
DROP POLICY IF EXISTS "Authenticated users can view questions" ON public.questions;

CREATE POLICY "Users can view questions for their selected role" 
ON public.questions 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    job_role IS NULL OR 
    job_role::text = (
      SELECT position_applied 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Update interviews table to store selected job role
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS job_role job_role;

-- Update the trigger to automatically set updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();