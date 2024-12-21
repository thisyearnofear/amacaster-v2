-- Create AMA sessions table
CREATE TABLE IF NOT EXISTS public.ama_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_fid TEXT NOT NULL,
  title TEXT NOT NULL,
  cast_hash TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create QA pairs table
CREATE TABLE IF NOT EXISTS public.qa_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.ama_sessions(id) ON DELETE CASCADE,
  question_hash TEXT NOT NULL,
  answer_hash TEXT NOT NULL,
  position INTEGER NOT NULL,
  is_stacked BOOLEAN DEFAULT FALSE,
  stack_parent_id UUID REFERENCES public.qa_pairs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_hash)
);

-- Create user matches table
CREATE TABLE IF NOT EXISTS public.user_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_fid TEXT NOT NULL,
  session_id UUID REFERENCES public.ama_sessions(id) ON DELETE CASCADE,
  matches JSONB NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ama_sessions_cast_hash ON public.ama_sessions(cast_hash);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_session_id ON public.qa_pairs(session_id);
CREATE INDEX IF NOT EXISTS idx_user_matches_session_user ON public.user_matches(session_id, user_fid);

-- Add RLS policies
ALTER TABLE public.ama_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_matches ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all authenticated users"
  ON public.ama_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to all authenticated users"
  ON public.qa_pairs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to all authenticated users"
  ON public.user_matches FOR SELECT
  TO authenticated
  USING (true);

-- Allow insert/update access to authenticated users for their own matches
CREATE POLICY "Allow users to insert their own matches"
  ON public.user_matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_fid);

CREATE POLICY "Allow users to update their own matches"
  ON public.user_matches FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_fid)
  WITH CHECK (auth.uid()::text = user_fid); 