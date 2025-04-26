import { NextResponse } from 'next/server'
import { getNeynarClient } from '@/lib/neynarClient'

// GET /api/fetchThread?threadHash=<threadHash>&castUrl=<castUrl>&castHash=<castHash>
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const threadHash = searchParams.get('threadHash')
  const castUrl = searchParams.get('castUrl')
  const castHash = searchParams.get('castHash')

  try {
    const client = getNeynarClient()
    let actualThreadHash = threadHash

    // If threadHash is not provided, but castUrl or castHash is, look up the cast
    if (!actualThreadHash && (castUrl || castHash)) {
      let castIdentifier: string | undefined = undefined;
      if (castUrl && typeof castUrl === 'string') {
        castIdentifier = castUrl;
      } else if (castHash && typeof castHash === 'string') {
        castIdentifier = castHash;
      }
      if (!castIdentifier) {
        return NextResponse.json({ error: 'Invalid castUrl or castHash parameter' }, { status: 400 });
      }
      const castResponse = await client.lookupCastByUrl(castIdentifier);
      if (!castResponse || !castResponse.result || !castResponse.result.cast) {
        return NextResponse.json({ error: 'Failed to lookup cast for thread' }, { status: 404 });
      }
      actualThreadHash = castResponse.result.cast.thread_hash
    }

    if (!actualThreadHash) {
      return NextResponse.json({ error: 'Missing threadHash, castUrl, or castHash parameter' }, { status: 400 })
    }

    const response = await client.fetchThread(actualThreadHash)
    const casts = response.result.casts
    return NextResponse.json({ result: { casts } })
  } catch (error) {
    console.error('Error fetching thread:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

