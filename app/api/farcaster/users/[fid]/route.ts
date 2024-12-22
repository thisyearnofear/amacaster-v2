import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { fid: string } },
) {
  const pinataJwt =
    process.env.PINATA_API_JWT || process.env.NEXT_PUBLIC_PINATA_JWT
  if (!pinataJwt) {
    console.error('Pinata JWT not configured')
    return NextResponse.json(
      { error: 'Pinata JWT not configured' },
      { status: 500 },
    )
  }

  // Log JWT details for debugging
  console.log('JWT validation:', {
    length: pinataJwt.length,
    prefix: pinataJwt.substring(0, 20),
    suffix: pinataJwt.substring(pinataJwt.length - 20),
  })

  try {
    console.log('Fetching Farcaster user with FID:', params.fid)
    const pinataResponse = await fetch(
      `https://api.pinata.cloud/v3/farcaster/users/${params.fid}`,
      {
        headers: {
          Authorization: `Bearer ${pinataJwt}`,
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      },
    )

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text()
      console.error('Pinata API error:', {
        status: pinataResponse.status,
        statusText: pinataResponse.statusText,
        url: pinataResponse.url,
        response: errorText,
      })

      return NextResponse.json(
        { error: 'Failed to fetch user data from Pinata', details: errorText },
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
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 },
    )
  }
}
