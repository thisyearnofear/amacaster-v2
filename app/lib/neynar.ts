import { createClient } from '@neynar/nodejs-sdk'

if (!process.env.NEXT_PUBLIC_NEYNAR_API_KEY) {
  throw new Error('Missing NEYNAR_API_KEY environment variable')
}

export const neynarClient = createClient(process.env.NEXT_PUBLIC_NEYNAR_API_KEY)
