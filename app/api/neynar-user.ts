import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(req: NextRequest) {
  const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY
  if (!NEYNAR_API_KEY) {
    return NextResponse.json({ error: 'Neynar API key not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const fid = searchParams.get('fid')
  if (!fid) {
    return NextResponse.json({ error: 'fid required' }, { status: 400 })
  }

  try {
    const response = await axios.get('https://api.neynar.com/v2/farcaster/user', {
      headers: {
        'api_key': NEYNAR_API_KEY,
      },
      params: { fid },
    })
    return NextResponse.json(response.data)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Neynar user fetch failed' }, { status: 500 })
  }
}
