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
    submitter_fid: number
    submitter_username: string
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
  ipfsHash: string
  merkleRoot: string
  contractId: string
  submitter?: {
    fid: number
    username: string
  }
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
    const response = await fetch(`${gateway}/ipfs/${ipfsHash}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('IPFS fetch failed:', response.status, response.statusText)
      throw new Error(
        `Failed to fetch from IPFS: ${response.status} ${response.statusText}`,
      )
    }

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

    // Transform the matches into the expected format
    if (data.matches) {
      const transformedMatches = data.matches.slice(0, 2).map((match: any) => ({
        id:
          match.hash ||
          `${data.amaId}-${match.questionContent.cast_id}-${match.answerContent.cast_id}`,
        timestamp: new Date(match.questionContent.timestamp).toISOString(),
        question: match.questionContent,
        answer: match.answerContent,
        ipfsHash: ipfsHash,
        merkleRoot: data.merkle_root,
        contractId: data.amaId,
        submitter: {
          fid: data.submitter_fid,
          username: data.submitter_username || 'anonymous',
        },
      }))

      // Sort by timestamp (most recent first)
      return transformedMatches.sort(
        (a: Match, b: Match) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
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
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pinata error response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
      throw new Error(
        `Failed to fetch from Pinata: ${response.status} ${response.statusText}`,
      )
    }

    const data = await response.json()
    console.log('Pinata response for FID', fid, ':', {
      rowCount: data.rows?.length,
      totalCount: data.count,
    })

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
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pinata error response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
      throw new Error(
        `Failed to fetch from Pinata: ${response.status} ${response.statusText}`,
      )
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
    const seenMatches = new Set<string>() // Track unique Q&A pairs

    // Process submissions in chronological order (newest first)
    for (const submission of submissions) {
      try {
        console.log('Processing submission:', submission)
        const ipfsMatches = await fetchMatchesFromIPFS(submission.ipfs_pin_hash)

        // Group matches by AMA
        for (const match of ipfsMatches) {
          const submissionDate = new Date(match.timestamp)
          const existingDate = processedAmaIds.get(match.contractId)
          const matchKey = `${match.question.text}-${match.answer.text}`

          // Only add if this is a new match or a newer submission for the same AMA
          if (
            !seenMatches.has(matchKey) ||
            !existingDate ||
            submissionDate > existingDate
          ) {
            // Remove any existing matches for this AMA
            const filteredMatches = matches.filter(
              (m) => m.contractId !== match.contractId,
            )
            // Add matches from this submission for this AMA (limited to 2)
            const newMatches = ipfsMatches
              .filter((m) => m.contractId === match.contractId)
              .slice(0, 2)
            matches.splice(0, matches.length, ...filteredMatches, ...newMatches)
            processedAmaIds.set(match.contractId, submissionDate)
            seenMatches.add(matchKey)
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

    // Sort matches by timestamp (most recent first)
    const sortedMatches = matches.sort(
      (a: Match, b: Match) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
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
