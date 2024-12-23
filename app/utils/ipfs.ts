import axios from 'axios'
import type { Match } from './matchSubmission'

// Types for our IPFS data structures
export interface IPFSMatchData {
  amaId: string
  matches: Match[]
  metadata: {
    timestamp: number
    version: number
    submitter: string
    submitter_fid?: string
    ama_title: string
    ama_host?: string
    curation_criteria?: {
      focus_topics?: string[]
      quality_threshold?: number
      curation_guidelines?: string
    }
  }
  merkle_root?: string
  signature?: string
}

interface PinataMetadata {
  name: string
  keyvalues: {
    [key: string]: string | number | boolean
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

// Add IPCM integration
interface IPCMContract {
  updateMapping(value: string): Promise<void>
  getMapping(): Promise<string>
}

export async function updateIPCMMapping(
  contract: IPCMContract,
  contentHash: string,
): Promise<void> {
  try {
    await contract.updateMapping(`ipfs://${contentHash}`)
    console.log('Updated IPCM mapping to:', contentHash)
  } catch (error) {
    console.error('Error updating IPCM mapping:', error)
    throw new Error('Failed to update IPCM mapping')
  }
}

export async function getLatestIPFSHash(
  contract: IPCMContract,
): Promise<string> {
  try {
    const mapping = await contract.getMapping()
    // Remove ipfs:// prefix if present
    return mapping.replace('ipfs://', '')
  } catch (error) {
    console.error('Error getting latest IPFS hash:', error)
    throw new Error('Failed to get latest IPFS hash')
  }
}

/**
 * Internal function to handle the actual upload to IPFS
 */
async function uploadToIPFS(data: IPFSMatchData): Promise<string> {
  if (!process.env.NEXT_PUBLIC_PINATA_JWT) {
    throw new Error('Pinata JWT not configured')
  }

  // Validate input data
  if (
    !data.amaId ||
    !Array.isArray(data.matches) ||
    data.matches.length === 0 ||
    !data.metadata
  ) {
    throw new Error('Invalid match data format')
  }

  // Create form data
  const formData = new FormData()

  // Prepare data for upload
  const uploadData = {
    ...data,
    matches: data.matches.map((match) => ({
      questionHash: match.questionHash,
      answerHash: match.answerHash,
      ranking: match.ranking,
      questionContent: {
        text: match.questionContent.text,
        cast_id: match.questionContent.cast_id,
        timestamp: match.questionContent.timestamp,
        author: {
          fid: parseInt(match.questionContent.author.fid.toString()),
          username: match.questionContent.author.username,
        },
      },
      answerContent: {
        text: match.answerContent.text,
        cast_id: match.answerContent.cast_id,
        timestamp: match.answerContent.timestamp,
        author: {
          fid: parseInt(match.answerContent.author.fid.toString()),
          username: match.answerContent.author.username,
        },
      },
    })),
  }

  const blob = new Blob([JSON.stringify(uploadData)], {
    type: 'application/json',
  })
  formData.append('file', blob, 'matches.json')

  // Add metadata for better discoverability
  const metadata = {
    name: `AMA_${data.amaId.slice(0, 8)}_matches`,
    keyvalues: {
      amaId: data.amaId,
      version: data.metadata.version,
      submitter: data.metadata.submitter,
      match_count: data.matches.length,
    },
  }

  formData.append('pinataMetadata', JSON.stringify(metadata))

  try {
    // Upload to IPFS via Pinata
    const response = await axios.post<PinataResponse>(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          'Content-Type': 'multipart/form-data',
        },
        maxBodyLength: Infinity,
      },
    )

    console.log('Pinata upload successful:', response.data)
    return response.data.IpfsHash
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Pinata API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        request: {
          method: error.config?.method,
          url: error.config?.url,
        },
      })
    }
    throw error
  }
}

/**
 * Upload match data to IPFS and optionally update IPCM contract
 */
export async function uploadMatchesToIPFS(
  data: IPFSMatchData,
  updateIPFSMapping?: (cid: string) => Promise<void>,
): Promise<string> {
  try {
    const contentHash = await uploadToIPFS(data)

    // If IPCM update function is provided, update the mapping
    if (updateIPFSMapping) {
      await updateIPFSMapping(contentHash)
    }

    return contentHash
  } catch (error) {
    console.error('Error in uploadMatchesToIPFS:', error)
    throw error
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
    typeof data.metadata === 'object' &&
    typeof data.metadata.timestamp === 'number' &&
    typeof data.metadata.version === 'number' &&
    typeof data.metadata.submitter === 'string' &&
    typeof data.metadata.submitter_fid === 'string' &&
    typeof data.metadata.ama_title === 'string' &&
    typeof data.metadata.ama_host === 'string' &&
    typeof data.merkle_root === 'string' &&
    typeof data.signature === 'string' &&
    data.matches.every(
      (match: any) =>
        typeof match.questionHash === 'string' &&
        typeof match.answerHash === 'string' &&
        typeof match.ranking === 'number' &&
        typeof match.questionContent === 'object' &&
        typeof match.questionContent.text === 'string' &&
        typeof match.questionContent.cast_id === 'string' &&
        typeof match.questionContent.timestamp === 'number' &&
        typeof match.questionContent.author === 'object' &&
        typeof match.questionContent.author.fid === 'number' &&
        typeof match.questionContent.author.username === 'string' &&
        typeof match.answerContent === 'object' &&
        typeof match.answerContent.text === 'string' &&
        typeof match.answerContent.cast_id === 'string' &&
        typeof match.answerContent.timestamp === 'number' &&
        typeof match.answerContent.author === 'object' &&
        typeof match.answerContent.author.fid === 'number' &&
        typeof match.answerContent.author.username === 'string' &&
        typeof match.category === 'string' &&
        typeof match.tags === 'object' &&
        typeof match.quality_signals === 'object' &&
        typeof match.quality_signals.relevance_score === 'number' &&
        typeof match.quality_signals.engagement_score === 'number' &&
        typeof match.quality_signals.curator_notes === 'string',
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

async function testPinataConnection(): Promise<boolean> {
  try {
    const testData = {
      test: 'Hello World',
      timestamp: Date.now(),
    }
    const formData = new FormData()
    const blob = new Blob([JSON.stringify(testData)], {
      type: 'application/json',
    })
    formData.append('file', blob, 'test.json')

    const metadata = {
      name: 'test_upload',
      keyvalues: {
        test: true,
      },
    }
    formData.append('pinataMetadata', JSON.stringify(metadata))

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

    console.log('Test upload successful:', response.data)
    return true
  } catch (error) {
    console.error('Test upload failed:', error)
    return false
  }
}
