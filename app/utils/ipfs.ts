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

/**
 * Internal function to handle the actual upload to IPFS via backend API
 */
async function uploadToIPFS(data: IPFSMatchData): Promise<string> {
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
    // Upload to IPFS via backend API
    const response = await fetch('/api/pinata-upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Pinata upload failed')
    }

    const result = await response.json()
    return result.IpfsHash
  } catch (error) {
    console.error('Pinata API Error:', error)
    throw error
  }
}

/**
 * Upload match data to IPFS
 */
export async function uploadMatchesToIPFS(
  data: IPFSMatchData,
): Promise<string> {
  try {
    const contentHash = await uploadToIPFS(data)
    return contentHash
  } catch (error) {
    console.error('Error in uploadMatchesToIPFS:', error)
    throw error
  }
}

/**
 * List all versions of matches for a specific AMA (via backend API)
 */
export async function listMatchVersions(amaId: string): Promise<string[]> {
  try {
    const response = await fetch(`/api/pinata-list?amaId=${encodeURIComponent(amaId)}`)
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Failed to list match versions')
    }
    const data = await response.json()
    return data.rows.map((item: any) => item.ipfs_pin_hash)
  } catch (error) {
    console.error('Error listing match versions:', error)
    throw new Error('Failed to list match versions')
  }
}

/**
 * Unpin old versions of matches if needed (via backend API)
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
        fetch(`/api/pinata-unpin?hash=${encodeURIComponent(hash)}`, {
          method: 'DELETE',
        })
      ),
    )
  } catch (error) {
    console.error('Error cleaning up old versions:', error)
    // Don't throw here, just log the error as this is a cleanup operation
  }
}

/**
 * Check if an IPFS hash exists and is accessible
 */
export async function verifyIPFSContent(contentHash: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/ipfs-verify/${contentHash}`)
    if (!response.ok) return false
    const result = await response.json()
    return result.exists === true
  } catch {
    return false
  }
}

/**
 * Retrieve match data from IPFS via backend API
 */
/**
 * Fetches match data from IPFS given a content hash (CID).
 * Returns the data as IPFSMatchData.
 */
export async function getMatchesFromIPFS(contentHash: string): Promise<IPFSMatchData> {
  const data = await fetchFromIPFS(contentHash);
  return data as IPFSMatchData;
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