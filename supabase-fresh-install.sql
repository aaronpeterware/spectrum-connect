-- Haven - FRESH INSTALL Schema
-- WARNING: This drops and recreates all tables!
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard

-- ============================================
-- Step 1: Drop existing tables (clean slate)
-- ============================================

DROP TABLE IF EXISTS swipe_actions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ============================================
-- Step 2: Create user_profiles table
-- ============================================

CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say')),
  seeking TEXT[] DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_fake BOOLEAN DEFAULT FALSE,
  profile_photos TEXT[] DEFAULT '{}',
  location TEXT,
  bio TEXT,
  communication_style TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_id ON user_profiles(id);
CREATE INDEX idx_user_profiles_gender ON user_profiles(gender);
CREATE INDEX idx_user_profiles_is_fake ON user_profiles(is_fake);

-- ============================================
-- Step 3: Create conversations table
-- ============================================

CREATE TABLE conversations (
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

CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- ============================================
-- Step 4: Create matches table
-- ============================================

CREATE TABLE matches (
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

CREATE INDEX idx_matches_user_1 ON matches(user_1_id);
CREATE INDEX idx_matches_user_2 ON matches(user_2_id);
CREATE INDEX idx_matches_is_mutual ON matches(is_mutual);

-- ============================================
-- Step 5: Create messages table
-- ============================================

CREATE TABLE messages (
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

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- Step 6: Create swipe_actions table
-- ============================================

CREATE TABLE swipe_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, target_user_id)
);

CREATE INDEX idx_swipe_actions_user_id ON swipe_actions(user_id);
CREATE INDEX idx_swipe_actions_target_user_id ON swipe_actions(target_user_id);

-- ============================================
-- Step 7: Enable RLS with anonymous access
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_actions ENABLE ROW LEVEL SECURITY;

-- Anonymous access policies for MVP
CREATE POLICY "anon_read_user_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "anon_insert_user_profiles" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_user_profiles" ON user_profiles FOR UPDATE USING (true);

CREATE POLICY "anon_read_conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "anon_insert_conversations" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_conversations" ON conversations FOR UPDATE USING (true);

CREATE POLICY "anon_read_matches" ON matches FOR SELECT USING (true);
CREATE POLICY "anon_insert_matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_matches" ON matches FOR UPDATE USING (true);

CREATE POLICY "anon_read_messages" ON messages FOR SELECT USING (true);
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_read_swipe_actions" ON swipe_actions FOR SELECT USING (true);
CREATE POLICY "anon_insert_swipe_actions" ON swipe_actions FOR INSERT WITH CHECK (true);

-- ============================================
-- Step 8: Enable realtime
-- ============================================

-- Note: These may fail if already added, that's OK
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================
-- Step 9: Create trigger for last message
-- ============================================

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

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- ============================================
-- DONE! Now reload the API schema in Supabase:
-- Settings > API > Reload schema
-- ============================================
