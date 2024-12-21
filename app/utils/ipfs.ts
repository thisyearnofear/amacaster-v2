import axios from 'axios'

// Types for our IPFS data structures
export interface IPFSMatchData {
  amaId: string
  matches: {
    questionHash: string
    answerHash: string
    ranking: number
  }[]
  timestamp: number
  version: number
  submitter: string
}

interface PinataMetadata {
  name: string
  keyvalues: {
    [key: string]: string
  }
}

interface PinataResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
}

interface PinataSearchResult {
  rows: Array<{
    ipfs_pin_hash: string
    metadata: PinataMetadata
  }>
  count: number
}

const PINATA_API_URL = 'https://api.pinata.cloud'
const PINATA_GATEWAY_URL =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'

/**
 * Upload match data to IPFS
 * @param data Match data to upload
 * @returns IPFS content hash (CID)
 */
export async function uploadMatchesToIPFS(
  data: IPFSMatchData,
): Promise<string> {
  try {
    if (!process.env.NEXT_PUBLIC_PINATA_JWT) {
      throw new Error('Pinata JWT not configured')
    }

    // Validate input data
    if (
      !data.amaId ||
      !Array.isArray(data.matches) ||
      data.matches.length === 0
    ) {
      throw new Error('Invalid match data format')
    }

    // Create form data
    const formData = new FormData()
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    formData.append('file', blob, 'matches.json')

    // Add metadata
    const metadata = {
      name: `AMA_${data.amaId}_v${data.version}`,
      keyvalues: {
        amaId: data.amaId,
        version: data.version.toString(),
        submitter: data.submitter,
        timestamp: data.timestamp.toString(),
      },
    }
    formData.append('pinataMetadata', JSON.stringify(metadata))

    // Upload to IPFS via Pinata
    const response = await axios.post<PinataResponse>(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    return response.data.IpfsHash
  } catch (error) {
    console.error('Error uploading to IPFS:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to upload to IPFS: ${error.message}`)
    }
    throw new Error('Failed to upload to IPFS: Unknown error')
  }
}

/**
 * Retrieve match data from IPFS
 * @param contentHash IPFS content hash (CID)
 * @returns Match data
 */
export async function getMatchesFromIPFS(
  contentHash: string,
): Promise<IPFSMatchData> {
  try {
    const response = await axios.get<IPFSMatchData>(
      `${PINATA_GATEWAY_URL}/ipfs/${contentHash}`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    )

    if (!isValidIPFSMatchData(response.data)) {
      throw new Error('Invalid match data format')
    }

    return response.data
  } catch (error) {
    console.error('Error fetching from IPFS:', error)
    throw new Error('Failed to fetch from IPFS')
  }
}

/**
 * Type guard to validate IPFSMatchData
 */
function isValidIPFSMatchData(data: any): data is IPFSMatchData {
  return (
    typeof data === 'object' &&
    typeof data.amaId === 'string' &&
    Array.isArray(data.matches) &&
    typeof data.timestamp === 'number' &&
    typeof data.version === 'number' &&
    typeof data.submitter === 'string' &&
    data.matches.every(
      (match: any) =>
        typeof match.questionHash === 'string' &&
        typeof match.answerHash === 'string' &&
        typeof match.ranking === 'number',
    )
  )
}

/**
 * List all versions of matches for a specific AMA
 * @param amaId AMA identifier
 * @returns Array of IPFS content hashes
 */
export async function listMatchVersions(amaId: string): Promise<string[]> {
  try {
    const response = await axios.get<PinataSearchResult>(
      `${PINATA_API_URL}/data/pinList`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
        params: {
          metadata: JSON.stringify({
            keyvalues: {
              amaId: {
                value: amaId,
                op: 'eq',
              },
            },
          }),
          status: 'pinned',
        },
      },
    )

    return response.data.rows.map((item) => item.ipfs_pin_hash)
  } catch (error) {
    console.error('Error listing match versions:', error)
    throw new Error('Failed to list match versions')
  }
}

/**
 * Unpin old versions of matches if needed
 * @param amaId AMA identifier
 * @param keepLatest Number of latest versions to keep
 */
export async function cleanupOldVersions(
  amaId: string,
  keepLatest = 5,
): Promise<void> {
  try {
    const versions = await listMatchVersions(amaId)

    if (versions.length <= keepLatest) return

    const toRemove = versions.slice(keepLatest)

    await Promise.all(
      toRemove.map((hash) =>
        axios.delete(`${PINATA_API_URL}/pinning/unpin/${hash}`, {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          },
        }),
      ),
    )
  } catch (error) {
    console.error('Error cleaning up old versions:', error)
    // Don't throw here, just log the error as this is a cleanup operation
  }
}

/**
 * Check if an IPFS hash exists and is accessible
 * @param contentHash IPFS content hash to verify
 * @returns boolean indicating if content is accessible
 */
export async function verifyIPFSContent(contentHash: string): Promise<boolean> {
  try {
    const response = await axios.head(
      `${PINATA_GATEWAY_URL}/ipfs/${contentHash}`,
    )
    return response.status === 200
  } catch {
    return false
  }
}

export async function fetchFromIPFS(contentHash: string) {
  try {
    // Use our proxy endpoint instead of direct IPFS gateway
    const response = await fetch(`/api/ipfs/${contentHash}`)
    if (!response.ok) {
      throw new Error('Failed to fetch from IPFS')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching from IPFS:', error)
    throw error
  }
}
