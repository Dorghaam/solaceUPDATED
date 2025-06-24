-- Create onboarding_data table for storing user preferences and analytics
CREATE TABLE IF NOT EXISTS onboarding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Demographics (for analytics and personalization)
  age_range TEXT,
  gender TEXT,
  relationship_status TEXT,
  spiritual_preference TEXT,
  
  -- User preferences
  growth_focus TEXT,
  healing_goals TEXT,
  affirmation_familiarity TEXT CHECK (affirmation_familiarity IN ('new', 'occasional', 'regular')),
  
  -- Analytics data
  discovery_source TEXT,
  
  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_onboarding_data_user_id ON onboarding_data(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_data_age_range ON onboarding_data(age_range);
CREATE INDEX IF NOT EXISTS idx_onboarding_data_gender ON onboarding_data(gender);
CREATE INDEX IF NOT EXISTS idx_onboarding_data_discovery_source ON onboarding_data(discovery_source);
CREATE INDEX IF NOT EXISTS idx_onboarding_data_completed_at ON onboarding_data(completed_at);

-- Enable RLS (Row Level Security)
ALTER TABLE onboarding_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own onboarding data" ON onboarding_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding data" ON onboarding_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding data" ON onboarding_data
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at updates
CREATE TRIGGER update_onboarding_data_updated_at
    BEFORE UPDATE ON onboarding_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 