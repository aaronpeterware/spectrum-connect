-- Haven - Matching & Messaging System Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- Phase 0: Create user_profiles table if not exists
-- ============================================

-- Drop old table if it has wrong schema (ONLY run once if migrating)
-- DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table with TEXT id for anonymous users
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);

-- ============================================
-- Phase 1: Update user_profiles table
-- ============================================

-- Add new columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS seeking TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_fake BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_photos TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS communication_style TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- Phase 2: Create conversations table
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1_id TEXT NOT NULL,
  participant_2_id TEXT NOT NULL,
  last_message_text TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_sender_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_1_id, participant_2_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- ============================================
-- Phase 3: Create matches table
-- ============================================

CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_1_id TEXT NOT NULL,
  user_2_id TEXT NOT NULL,
  user_1_liked BOOLEAN DEFAULT FALSE,
  user_2_liked BOOLEAN DEFAULT FALSE,
  is_mutual BOOLEAN DEFAULT FALSE,
  matched_at TIMESTAMP WITH TIME ZONE,
  conversation_id UUID REFERENCES conversations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_1_id, user_2_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_matches_user_1 ON matches(user_1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_2 ON matches(user_2_id);
CREATE INDEX IF NOT EXISTS idx_matches_is_mutual ON matches(is_mutual);

-- ============================================
-- Phase 4: Create/update messages table
-- ============================================

-- Drop existing messages table if it has wrong schema
-- Note: Only run this if you want to reset messages
-- DROP TABLE IF EXISTS messages;

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  message_text TEXT NOT NULL,
  attachment_url TEXT,
  attachment_type TEXT,
  reply_to_id UUID REFERENCES messages(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- Phase 5: Create swipe_actions table
-- ============================================

CREATE TABLE IF NOT EXISTS swipe_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, target_user_id)
);

CREATE INDEX IF NOT EXISTS idx_swipe_actions_user_id ON swipe_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_actions_target_user_id ON swipe_actions(target_user_id);

-- ============================================
-- Phase 6: Enable Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_actions ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can see conversations they're part of
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (participant_1_id = auth.uid()::text OR participant_2_id = auth.uid()::text);

CREATE POLICY "Users can insert conversations they're part of"
  ON conversations FOR INSERT
  WITH CHECK (participant_1_id = auth.uid()::text OR participant_2_id = auth.uid()::text);

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (participant_1_id = auth.uid()::text OR participant_2_id = auth.uid()::text);

-- Matches: Users can see matches they're part of
CREATE POLICY "Users can view their matches"
  ON matches FOR SELECT
  USING (user_1_id = auth.uid()::text OR user_2_id = auth.uid()::text);

CREATE POLICY "Users can insert matches they're part of"
  ON matches FOR INSERT
  WITH CHECK (user_1_id = auth.uid()::text);

CREATE POLICY "Users can update their matches"
  ON matches FOR UPDATE
  USING (user_1_id = auth.uid()::text OR user_2_id = auth.uid()::text);

-- Messages: Users can see messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (sender_id = auth.uid()::text OR recipient_id = auth.uid()::text);

CREATE POLICY "Users can insert messages they send"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid()::text);

CREATE POLICY "Users can update messages they received"
  ON messages FOR UPDATE
  USING (recipient_id = auth.uid()::text);

-- Swipe actions: Users can see and create their own swipe actions
CREATE POLICY "Users can view their swipe actions"
  ON swipe_actions FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their swipe actions"
  ON swipe_actions FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- ============================================
-- Phase 7: Create functions for matching
-- ============================================

-- Function to check and create mutual match
CREATE OR REPLACE FUNCTION check_mutual_match(
  p_user_id TEXT,
  p_target_user_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_mutual BOOLEAN := FALSE;
  v_conversation_id UUID;
BEGIN
  -- Check if target user has already liked current user
  SELECT TRUE INTO v_is_mutual
  FROM swipe_actions
  WHERE user_id = p_target_user_id
    AND target_user_id = p_user_id
    AND action = 'like';

  IF v_is_mutual THEN
    -- Create conversation
    INSERT INTO conversations (participant_1_id, participant_2_id)
    VALUES (LEAST(p_user_id, p_target_user_id), GREATEST(p_user_id, p_target_user_id))
    ON CONFLICT (participant_1_id, participant_2_id) DO NOTHING
    RETURNING id INTO v_conversation_id;

    -- If conversation already exists, get its ID
    IF v_conversation_id IS NULL THEN
      SELECT id INTO v_conversation_id
      FROM conversations
      WHERE participant_1_id = LEAST(p_user_id, p_target_user_id)
        AND participant_2_id = GREATEST(p_user_id, p_target_user_id);
    END IF;

    -- Update or create match record
    INSERT INTO matches (user_1_id, user_2_id, user_1_liked, user_2_liked, is_mutual, matched_at, conversation_id)
    VALUES (
      LEAST(p_user_id, p_target_user_id),
      GREATEST(p_user_id, p_target_user_id),
      TRUE,
      TRUE,
      TRUE,
      NOW(),
      v_conversation_id
    )
    ON CONFLICT (user_1_id, user_2_id) DO UPDATE
    SET is_mutual = TRUE,
        matched_at = NOW(),
        conversation_id = v_conversation_id,
        updated_at = NOW();
  END IF;

  RETURN v_is_mutual;
END;
$$ LANGUAGE plpgsql;

-- Function to get potential matches for a user
CREATE OR REPLACE FUNCTION get_potential_matches(
  p_user_id TEXT,
  p_seeking TEXT[],
  p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
  id TEXT,
  name TEXT,
  age INTEGER,
  location TEXT,
  bio TEXT,
  gender TEXT,
  interests TEXT[],
  profile_photos TEXT[],
  is_fake BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.name,
    up.age,
    up.location,
    up.bio,
    up.gender,
    up.interests,
    up.profile_photos,
    up.is_fake
  FROM user_profiles up
  WHERE up.id != p_user_id
    AND up.onboarding_completed = TRUE
    AND up.gender = ANY(p_seeking)
    AND NOT EXISTS (
      SELECT 1 FROM swipe_actions sa
      WHERE sa.user_id = p_user_id AND sa.target_user_id = up.id
    )
  ORDER BY
    up.is_fake DESC,  -- Show fake profiles first for new users
    up.last_active DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Phase 8: Create real-time triggers
-- ============================================

-- Function to update conversation's last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_text = NEW.message_text,
    last_message_at = NEW.created_at,
    last_message_sender_id = NEW.sender_id,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation when new message is inserted
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ============================================
-- Phase 9: Allow anonymous access for MVP
-- ============================================

-- For MVP, allow anonymous users to access data using device IDs
-- These policies use the user_id field directly instead of auth.uid()

-- Drop existing policies if they exist (to recreate with new logic)
DROP POLICY IF EXISTS "Allow anonymous read conversations" ON conversations;
DROP POLICY IF EXISTS "Allow anonymous insert conversations" ON conversations;
DROP POLICY IF EXISTS "Allow anonymous update conversations" ON conversations;
DROP POLICY IF EXISTS "Allow anonymous read matches" ON matches;
DROP POLICY IF EXISTS "Allow anonymous insert matches" ON matches;
DROP POLICY IF EXISTS "Allow anonymous update matches" ON matches;
DROP POLICY IF EXISTS "Allow anonymous read messages" ON messages;
DROP POLICY IF EXISTS "Allow anonymous insert messages" ON messages;
DROP POLICY IF EXISTS "Allow anonymous read swipe_actions" ON swipe_actions;
DROP POLICY IF EXISTS "Allow anonymous insert swipe_actions" ON swipe_actions;
DROP POLICY IF EXISTS "Allow anonymous read user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow anonymous insert user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow anonymous update user_profiles" ON user_profiles;

-- More permissive policies for MVP (anonymous access)
CREATE POLICY "Allow anonymous read conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert conversations" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update conversations" ON conversations FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update matches" ON matches FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert messages" ON messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read swipe_actions" ON swipe_actions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert swipe_actions" ON swipe_actions FOR INSERT WITH CHECK (true);

-- Enable RLS on user_profiles if not already
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read user_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert user_profiles" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update user_profiles" ON user_profiles FOR UPDATE USING (true);
