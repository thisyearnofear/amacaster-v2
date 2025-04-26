import { NextResponse } from 'next/server'
import { getNeynarClient } from '@/lib/neynarClient'

// GET /api/fetchThread?threadHash=<threadHash>
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const threadHash = searchParams.get('threadHash')
  if (!threadHash) {
    return NextResponse.json({ error: 'Missing threadHash parameter' }, { status: 400 })
  }
  try {
    const client = getNeynarClient()
    const response = await client.fetchThread(threadHash)
    const casts = response.result.casts
    // Mirror original API shape: wrap casts under result.casts
    return NextResponse.json({ result: { casts } })
  } catch (error) {
    console.error('Error fetching thread:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
