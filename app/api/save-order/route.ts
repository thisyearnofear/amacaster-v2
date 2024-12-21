import { NextResponse } from 'next/server'
import { pinJSONToIPFS } from '../../../app/lib/pinata'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order } = body

    // Pin the order data to IPFS
    const ipfsHash = await pinJSONToIPFS(order)

    return NextResponse.json({ success: true, ipfsHash })
  } catch (error) {
    console.error('Error saving order:', error)
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const castHash = url.searchParams.get('castHash')

    if (!castHash) {
      return NextResponse.json(
        { error: 'Cast hash is required' },
        { status: 400 },
      )
    }

    // For now, just return null order since we're not using storage yet
    return NextResponse.json({ order: null })
  } catch (error) {
    console.error('Error reading order:', error)
    return NextResponse.json({ error: 'Failed to read order' }, { status: 500 })
  }
}
