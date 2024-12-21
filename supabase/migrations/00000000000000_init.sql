-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for Web3 authentication
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AMA Sessions table
CREATE TABLE ama_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    host_fid TEXT NOT NULL,
    title TEXT NOT NULL,
    cast_hash TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES users(id)
);

-- Q&A Pairs table
CREATE TABLE qa_pairs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES ama_sessions(id) ON DELETE CASCADE,
    question_hash TEXT NOT NULL,
    answer_hash TEXT NOT NULL,
    position INTEGER NOT NULL,
    is_stacked BOOLEAN DEFAULT false,
    stack_parent_id UUID REFERENCES qa_pairs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, question_hash)
);

-- User Matches table
CREATE TABLE user_matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_fid TEXT NOT NULL,
    session_id UUID REFERENCES ama_sessions(id) ON DELETE CASCADE,
    matches JSONB NOT NULL,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for better query performance
CREATE INDEX idx_ama_sessions_cast_hash ON ama_sessions(cast_hash);
CREATE INDEX idx_qa_pairs_session_id ON qa_pairs(session_id);
CREATE INDEX idx_user_matches_session_user ON user_matches(session_id, user_fid);

-- Row Level Security (RLS) policies
ALTER TABLE ama_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_matches ENABLE ROW LEVEL SECURITY;

-- Policies for AMA Sessions
CREATE POLICY "AMA sessions are viewable by everyone" 
    ON ama_sessions FOR SELECT 
    USING (true);

CREATE POLICY "AMA sessions can be created by authenticated users" 
    ON ama_sessions FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM users
        WHERE users.wallet_address = auth.uid()::text
    ));

CREATE POLICY "AMA sessions can be updated by host" 
    ON ama_sessions FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.wallet_address = auth.uid()::text
        AND users.id = ama_sessions.user_id
    ));

-- Policies for QA Pairs
CREATE POLICY "QA pairs are viewable by everyone" 
    ON qa_pairs FOR SELECT 
    USING (true);

CREATE POLICY "QA pairs can be created by authenticated users" 
    ON qa_pairs FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "QA pairs can be updated by session host" 
    ON qa_pairs FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM ama_sessions 
        WHERE ama_sessions.id = qa_pairs.session_id 
        AND ama_sessions.host_fid = auth.uid()::text
    ));

-- Policies for User Matches
CREATE POLICY "User matches are viewable by everyone" 
    ON user_matches FOR SELECT 
    USING (true);

CREATE POLICY "Users can create their own matches" 
    ON user_matches FOR INSERT 
    WITH CHECK (auth.uid()::text = user_fid);

CREATE POLICY "Users can update their own matches" 
    ON user_matches FOR UPDATE 
    USING (auth.uid()::text = user_fid); 

-- Add policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own data"
    ON users FOR SELECT
    USING (auth.uid()::text = wallet_address);

CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    USING (auth.uid()::text = wallet_address);