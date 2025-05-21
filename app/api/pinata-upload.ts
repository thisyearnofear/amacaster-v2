import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(req: NextRequest) {
  const PINATA_JWT = process.env.PINATA_JWT
  if (!PINATA_JWT) {
    return NextResponse.json({ error: 'Pinata JWT not configured' }, { status: 500 })
  }

  const formData = await req.formData()

  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          'Content-Type': 'multipart/form-data',
        },
        maxBodyLength: Infinity,
      }
    )
    return NextResponse.json(response.data)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Pinata upload failed' }, { status: 500 })
  }
}
