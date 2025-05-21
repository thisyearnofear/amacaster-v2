import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function DELETE(req: NextRequest) {
  const PINATA_JWT = process.env.PINATA_JWT
  if (!PINATA_JWT) {
    return NextResponse.json({ error: 'Pinata JWT not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const hash = searchParams.get('hash')
  if (!hash) {
    return NextResponse.json({ error: 'hash required' }, { status: 400 })
  }

  try {
    await axios.delete(`https://api.pinata.cloud/pinning/unpin/${hash}`, {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Pinata unpin failed' }, { status: 500 })
  }
}
