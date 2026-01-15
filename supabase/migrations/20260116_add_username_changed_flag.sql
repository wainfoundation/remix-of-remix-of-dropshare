-- Add username_changed flag to track if user has changed their username
-- Users can only change their username once
ALTER TABLE profiles ADD COLUMN username_changed BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX idx_profiles_username_changed ON profiles(username_changed);

-- Add comment for clarity
COMMENT ON COLUMN profiles.username_changed IS 'Tracks whether user has already changed their username. When true, username cannot be changed again.';
