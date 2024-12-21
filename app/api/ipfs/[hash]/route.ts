import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { hash: string } },
) {
  const hash = params.hash
  const pinataGateway =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'

  try {
    const response = await fetch(`${pinataGateway}/ipfs/${hash}`)
    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error fetching from IPFS:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from IPFS' },
      { status: 500 },
    )
  }
}
