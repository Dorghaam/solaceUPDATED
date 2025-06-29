-- Create user_affirmations table for storing custom user affirmations
CREATE TABLE IF NOT EXISTS user_affirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Affirmation content
  affirmation_text TEXT NOT NULL CHECK (char_length(affirmation_text) > 0 AND char_length(affirmation_text) <= 500),
  author TEXT DEFAULT NULL, -- Optional field for user's name or custom attribution
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_affirmations_user_id ON user_affirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_affirmations_created_at ON user_affirmations(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE user_affirmations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own affirmations" ON user_affirmations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own affirmations" ON user_affirmations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affirmations" ON user_affirmations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own affirmations" ON user_affirmations
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for automatic updated_at updates (reusing existing function)
CREATE TRIGGER update_user_affirmations_updated_at
    BEFORE UPDATE ON user_affirmations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 