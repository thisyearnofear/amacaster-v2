import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { fid: string } },
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
    console.log('Fetching Farcaster user with FID:', params.fid)
    // Try the v1 endpoint instead
    const pinataResponse = await fetch(
      `https://api.pinata.cloud/v1/farcaster/user/${params.fid}`,
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
        url: pinataResponse.url,
      })

      // If v1 fails, try v3 as fallback
      if (pinataResponse.status === 404) {
        console.log('Trying v3 endpoint as fallback')
        const v3Response = await fetch(
          `https://api.pinata.cloud/v3/farcaster/users/${params.fid}`,
          {
            headers: {
              Authorization: `Bearer ${pinataJwt}`,
              'Cache-Control': 'no-cache',
            },
            cache: 'no-store',
          },
        )

        if (!v3Response.ok) {
          console.error('V3 API error:', {
            status: v3Response.status,
            statusText: v3Response.statusText,
            url: v3Response.url,
          })
          return NextResponse.json(
            { error: 'Failed to fetch user data from Pinata' },
            { status: v3Response.status },
          )
        }

        const v3Data = await v3Response.json()
        console.log('Successfully fetched Farcaster user data from v3')
        return NextResponse.json(v3Data, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        })
      }

      return NextResponse.json(
        { error: 'Failed to fetch user data from Pinata' },
        { status: pinataResponse.status },
      )
    }

    const pinataData = await pinataResponse.json()
    console.log('Successfully fetched Farcaster user data from v1')

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
