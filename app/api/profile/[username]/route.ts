import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { username: string } },
) {
  const pinataJwt = process.env.PINATA_JWT || process.env.NEXT_PUBLIC_PINATA_JWT
  if (!pinataJwt) {
    console.error('Pinata JWT not configured')
    return NextResponse.json(
      { error: 'Pinata JWT not configured' },
      { status: 500 },
    )
  }

  try {
    console.log('Fetching Farcaster user with username:', params.username)
    // First get the Farcaster user data from Pinata
    const pinataResponse = await fetch(
      `https://api.pinata.cloud/v3/farcaster/users/${params.username}`,
      {
        headers: {
          Authorization: `Bearer ${pinataJwt}`,
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
      },
    )

    if (!pinataResponse.ok) {
      console.error('Pinata API error:', {
        status: pinataResponse.status,
        statusText: pinataResponse.statusText,
      })
      return NextResponse.json(
        { error: 'Failed to fetch user data from Pinata' },
        { status: pinataResponse.status },
      )
    }

    const pinataData = await pinataResponse.json()
    console.log('Successfully fetched Farcaster user data')

    return NextResponse.json(pinataData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 },
    )
  }
}
