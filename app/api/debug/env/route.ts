import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasPinataJWT: Boolean(process.env.PINATA_JWT),
    hasPublicPinataJWT: Boolean(process.env.NEXT_PUBLIC_PINATA_JWT),
    hasNeynarApiKey: Boolean(process.env.NEXT_PUBLIC_NEYNAR_API_KEY),
    hasNeynarClientId: Boolean(process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID),
    nodeEnv: process.env.NODE_ENV,
    nodeVersion: process.version,
  })
}
