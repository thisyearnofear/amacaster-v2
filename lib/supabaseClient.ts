import { createClient } from '@supabase/supabase-js'

// Make Supabase client optional for now
export const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      )
    : null

// Types for our database schema
export interface AMASession {
  id: string
  host_fid: string
  title: string
  cast_hash: string
  created_at: string
}

export interface QAPair {
  id: string
  session_id: string
  question_hash: string
  answer_hash: string
  position: number
  is_stacked: boolean
  stack_parent_id?: string
  created_at: string
}

export interface UserMatch {
  id: string
  user_fid: string
  session_id: string
  matches: {
    question_hash: string
    answer_hash: string
  }[]
  score: number
  created_at: string
}

// Helper functions for database operations - make them no-op for now
export async function createOrUpdateAMASession(
  castHash: string,
  hostFid: string,
  title: string,
): Promise<AMASession | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('ama_sessions')
    .upsert(
      {
        cast_hash: castHash,
        host_fid: hostFid,
        title: title,
      },
      { onConflict: 'cast_hash' },
    )
    .select()
    .single()

  if (error) {
    console.error('Error creating AMA session:', error)
    return null
  }

  return data
}

export async function saveQAPairs(
  sessionId: string,
  pairs: { questionHash: string; answerHash: string; position: number }[],
): Promise<boolean> {
  if (!supabase) return true // Return success when Supabase is not configured

  const { error } = await supabase.from('qa_pairs').upsert(
    pairs.map(({ questionHash, answerHash, position }) => ({
      session_id: sessionId,
      question_hash: questionHash,
      answer_hash: answerHash,
      position,
      is_stacked: false, // Default value, update separately for stacks
    })),
    { onConflict: 'session_id, question_hash' },
  )

  if (error) {
    console.error('Error saving QA pairs:', error)
    return false
  }

  return true
}

export async function saveUserMatch(
  userFid: string,
  sessionId: string,
  matches: { questionHash: string; answerHash: string }[],
  score: number,
): Promise<boolean> {
  if (!supabase) return true // Return success when Supabase is not configured

  const { error } = await supabase.from('user_matches').insert({
    user_fid: userFid,
    session_id: sessionId,
    matches,
    score,
  })

  if (error) {
    console.error('Error saving user match:', error)
    return false
  }

  return true
}

export async function getAMASession(
  castHash: string,
): Promise<AMASession | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('ama_sessions')
    .select()
    .eq('cast_hash', castHash)
    .single()

  if (error) {
    console.error('Error fetching AMA session:', error)
    return null
  }

  return data
}

export async function getQAPairs(sessionId: string): Promise<QAPair[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('qa_pairs')
    .select()
    .eq('session_id', sessionId)
    .order('position')

  if (error) {
    console.error('Error fetching QA pairs:', error)
    return []
  }

  return data
}

export async function getUserMatches(
  sessionId: string,
  userFid: string,
): Promise<UserMatch[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('user_matches')
    .select()
    .eq('session_id', sessionId)
    .eq('user_fid', userFid)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user matches:', error)
    return []
  }

  return data
}
