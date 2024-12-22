import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { optimismSepolia } from 'viem/chains'
import { AMA_CONTRACT_ABI } from '../../../config/ama-contract'
import { CONTRACTS } from '../../../config/contracts'

interface PinataMetadata {
  keyvalues: {
    fid: string
    contractId: string
    merkleRoot: string
    matches: string[]
    rankings: number[]
  }
}

interface PinataRow {
  ipfs_pin_hash: string
  date_pinned: string
  metadata: PinataMetadata
}

export interface Match {
  id: string
  timestamp: string
  question: {
    text: string
    cast_id: string
    timestamp: number
    author: {
      fid: number
      username: string
    }
  }
  answer: {
    text: string
    cast_id: string
    timestamp: number
    author: {
      fid: number
      username: string
    }
  }
  score?: number
  category?: string
  tags?: string[]
  quality_signals?: {
    relevance_score?: number
    engagement_score?: number
    curator_notes?: string
  }
  ipfsHash: string
  merkleRoot: string
  contractId: string
  rankings: number[]
}

const client = createPublicClient({
  chain: optimismSepolia,
  transport: http(),
})

async function fetchMatchesFromIPFS(ipfsHash: string): Promise<Match[]> {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY
  if (!gateway) {
    throw new Error('Pinata gateway not configured')
  }

  try {
    console.log('Fetching matches from IPFS hash:', ipfsHash)
    const response = await fetch(`${gateway}/ipfs/${ipfsHash}`)
    if (!response.ok) throw new Error('Failed to fetch from IPFS')
    const data = await response.json()
    console.log('IPFS response:', data)

    // Transform the matches into the expected format
    if (data.matches) {
      return data.matches.map((match: any) => ({
        id:
          match.hash ||
          `${data.amaId}-${match.questionContent.cast_id}-${match.answerContent.cast_id}`,
        timestamp: new Date(match.questionContent.timestamp).toISOString(),
        question: match.questionContent,
        answer: match.answerContent,
        score: match.ranking,
        category: match.category,
        tags: match.tags,
        quality_signals: match.quality_signals,
        ipfsHash: ipfsHash,
        merkleRoot: data.merkle_root,
        contractId: data.amaId,
        rankings: [match.ranking],
      }))
    }
    return []
  } catch (error) {
    console.error('Error fetching from IPFS:', error)
    throw error
  }
}

async function fetchUserSubmissions(fid: string): Promise<PinataRow[]> {
  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT
  if (!pinataJWT) {
    throw new Error('Pinata JWT not configured')
  }

  try {
    // Construct metadata filter query for new format only
    const metadataFilter = {
      keyvalues: {
        submitter_fid: {
          value: fid,
          op: 'eq',
        },
        version_type: {
          value: 'v2',
          op: 'eq',
        },
      },
    }

    // Fetch matches from Pinata with metadata filter
    const response = await fetch(
      `https://api.pinata.cloud/data/pinList?metadata=${JSON.stringify(
        metadataFilter,
      )}&pageLimit=100&status=pinned`,
      {
        headers: {
          Authorization: `Bearer ${pinataJWT}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pinata error response:', errorText)
      throw new Error('Failed to fetch from Pinata')
    }

    const data = await response.json()
    console.log('Pinata response for FID', fid, ':', data)

    return data.rows.sort(
      (a: PinataRow, b: PinataRow) =>
        new Date(b.date_pinned).getTime() - new Date(a.date_pinned).getTime(),
    )
  } catch (error) {
    console.error('Error fetching submissions:', error)
    throw error
  }
}

export async function GET(
  request: Request,
  { params }: { params: { fid: string } },
) {
  try {
    console.log('Fetching matches for FID:', params.fid)
    const submissions = await fetchUserSubmissions(params.fid)
    console.log('Found submissions:', submissions)
    const matches: Match[] = []

    for (const submission of submissions) {
      console.log('Processing submission:', submission)
      const ipfsMatches = await fetchMatchesFromIPFS(submission.ipfs_pin_hash)
      console.log('IPFS matches:', ipfsMatches)
      matches.push(...ipfsMatches)
    }

    console.log('Total matches found:', matches.length)
    return NextResponse.json(matches)
  } catch (error) {
    console.error('Error in GET handler:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 },
    )
  }
}
