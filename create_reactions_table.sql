-- Create post_reactions table for Facebook-style emoji reactions
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL, -- Using TEXT to match your existing posts table
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_reaction_type CHECK (reaction_type IN ('👍', '❤️', '😂', '😮', '😢', '😠')),
  UNIQUE(post_id, user_id) -- One reaction per user per post
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_reaction_type ON post_reactions(reaction_type);

-- Enable Row Level Security
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all reactions" ON post_reactions;
DROP POLICY IF EXISTS "Users can insert own reactions" ON post_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON post_reactions;
DROP POLICY IF EXISTS "Users can update own reactions" ON post_reactions;

-- Create RLS policies
CREATE POLICY "Users can view all reactions" ON post_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own reactions" ON post_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" ON post_reactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own reactions" ON post_reactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_post_reactions_updated_at ON post_reactions;
CREATE TRIGGER update_post_reactions_updated_at
    BEFORE UPDATE ON post_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify table creation
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'post_reactions' 
ORDER BY ordinal_position;