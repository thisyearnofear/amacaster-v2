import { NextResponse } from 'next/server'
import { getNeynarClient } from '@/lib/neynarClient'

// GET /api/fetchCast?url=<castUrl>
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }
  try {
    const client = getNeynarClient()
    const response = await client.lookupCastByUrl(url)
    // Mirror original API shape for compatibility: wrap in result.cast
    return NextResponse.json({ result: { cast: response.result.cast } })
  } catch (error) {
    console.error('Error fetching cast:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
