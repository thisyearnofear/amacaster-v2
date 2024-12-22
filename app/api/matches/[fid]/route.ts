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

    // Check content type
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      console.log('Skipping non-JSON content:', contentType)
      return []
    }

    // Try to parse response as text first
    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.log('Failed to parse JSON from IPFS:', text.slice(0, 100))
      return []
    }

    console.log('IPFS response data:', {
      amaId: data.amaId,
      merkle_root: data.merkle_root,
      matchCount: data.matches?.length,
    })

    // Transform the matches into the expected format
    if (data.matches) {
      const transformedMatches = data.matches.map((match: any) => ({
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
      console.log('Transformed matches:', transformedMatches.length)
      return transformedMatches
    }
    return []
  } catch (error) {
    console.error('Error fetching from IPFS:', error)
    return [] // Return empty array instead of throwing
  }
}

async function fetchUserSubmissions(fid: string): Promise<PinataRow[]> {
  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT
  if (!pinataJWT) {
    throw new Error('Pinata JWT not configured')
  }

  try {
    // Construct metadata filter query for new format
    const metadataFilter = {
      keyvalues: {
        fid: {
          value: fid,
          op: 'eq',
        },
      },
    }

    console.log('Fetching with metadata filter:', metadataFilter)

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
      throw new Error(`Failed to fetch from Pinata: ${errorText}`)
    }

    const data = await response.json()
    console.log('Pinata response for FID', fid, ':', data)

    if (!data.rows) {
      console.log('No rows found in Pinata response')
      return []
    }

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

    const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT
    if (!pinataJWT) {
      throw new Error('Pinata JWT not configured')
    }

    // Try both old and new metadata formats
    const metadataFilter = {
      keyvalues: {
        $or: [
          {
            fid: {
              value: params.fid,
              op: 'eq',
            },
          },
          {
            submitter_fid: {
              value: params.fid,
              op: 'eq',
            },
          },
        ],
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
      throw new Error(`Failed to fetch from Pinata: ${errorText}`)
    }

    const data = await response.json()
    console.log('Pinata response:', data)

    if (!data.rows) {
      console.log('No rows found in Pinata response')
      return NextResponse.json([])
    }

    // Sort submissions by date (newest first)
    const submissions = data.rows.sort(
      (a: PinataRow, b: PinataRow) =>
        new Date(b.date_pinned).getTime() - new Date(a.date_pinned).getTime(),
    )

    const matches: Match[] = []
    const processedAmaIds = new Map<string, Date>()

    // Process submissions in chronological order (newest first)
    for (const submission of submissions) {
      try {
        console.log('Processing submission:', submission)
        const ipfsMatches = await fetchMatchesFromIPFS(submission.ipfs_pin_hash)

        // Group matches by AMA
        for (const match of ipfsMatches) {
          const submissionDate = new Date(match.timestamp)
          const existingDate = processedAmaIds.get(match.contractId)

          if (!existingDate || submissionDate > existingDate) {
            // Remove any existing matches for this AMA
            const filteredMatches = matches.filter(
              (m) => m.contractId !== match.contractId,
            )
            // Add all matches from this submission for this AMA
            const newMatches = ipfsMatches.filter(
              (m) => m.contractId === match.contractId,
            )
            matches.splice(0, matches.length, ...filteredMatches, ...newMatches)
            processedAmaIds.set(match.contractId, submissionDate)
            console.log(
              'Updated matches for AMA:',
              match.contractId,
              'count:',
              newMatches.length,
            )
          }
        }
      } catch (error) {
        console.error('Error processing submission:', error)
        // Continue with next submission
      }
    }

    // Sort matches by ranking within each AMA
    const sortedMatches = matches.sort(
      (a, b) => (a.score || 0) - (b.score || 0),
    )

    console.log('Total matches found:', sortedMatches.length)
    return NextResponse.json(sortedMatches)
  } catch (error) {
    console.error('Error in GET handler:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch matches',
      },
      { status: 500 },
    )
  }
}
