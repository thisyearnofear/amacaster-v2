import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(req: NextRequest) {
  const PINATA_JWT = process.env.PINATA_JWT
  if (!PINATA_JWT) {
    return NextResponse.json({ error: 'Pinata JWT not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const amaId = searchParams.get('amaId')
  if (!amaId) {
    return NextResponse.json({ error: 'amaId required' }, { status: 400 })
  }

  try {
    const response = await axios.get('https://api.pinata.cloud/data/pinList', {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      params: {
        metadata: JSON.stringify({
          keyvalues: {
            amaId: { value: amaId, op: 'eq' },
          },
        }),
        status: 'pinned',
      },
    })
    return NextResponse.json(response.data)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Pinata list failed' }, { status: 500 })
  }
}
