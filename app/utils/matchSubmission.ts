import { type Address } from 'viem'
import {
  uploadMatchesToIPFS,
  getMatchesFromIPFS,
  type IPFSMatchData,
} from './ipfs'
import {
  generateMatchHash,
  generateMerkleTree,
  type MerkleData,
} from './merkle'
import { signMatchData } from './signatures'

// Custom error types for better error handling
export class MatchSubmissionError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message)
    this.name = 'MatchSubmissionError'
  }
}

export class IPFSError extends MatchSubmissionError {
  constructor(message: string, details?: any) {
    super(message, 'IPFS_ERROR', details)
  }
}

export class SignatureError extends MatchSubmissionError {
  constructor(message: string, details?: any) {
    super(message, 'SIGNATURE_ERROR', details)
  }
}

export class ValidationError extends MatchSubmissionError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details)
  }
}

// Types for match submission
export interface Match {
  questionHash: `0x${string}`
  answerHash: `0x${string}`
  ranking: number
  hash: `0x${string}`
}

export interface SubmissionResult {
  contentHash: `0x${string}`
  merkleRoot: `0x${string}`
  signature: `0x${string}`
  merkleData: MerkleData
}

export interface SubmissionMetadata {
  timestamp: number
  version: number
  submitter: Address
}

// Validation functions
function validateMatch(match: Match): void {
  if (!match.questionHash || !match.questionHash.startsWith('0x')) {
    throw new ValidationError('Invalid question hash format')
  }
  if (!match.answerHash || !match.answerHash.startsWith('0x')) {
    throw new ValidationError('Invalid answer hash format')
  }
  if (typeof match.ranking !== 'number' || match.ranking < 0) {
    throw new ValidationError('Invalid ranking value')
  }
}

function validateMatches(matches: Match[]): void {
  if (!Array.isArray(matches) || matches.length === 0) {
    throw new ValidationError('Matches array is empty or invalid')
  }
  matches.forEach(validateMatch)
}

// Main submission function with retries
export async function submitMatches(
  amaId: string,
  matches: Match[],
  metadata: SubmissionMetadata,
  signer: { signMessage: (message: string | Uint8Array) => Promise<string> },
  retryAttempts = 3,
  onAttempt?: (attempt: number) => void,
): Promise<SubmissionResult> {
  try {
    console.log('Starting match submission process:', {
      amaId,
      matchCount: matches.length,
      version: metadata.version,
      submitter: metadata.submitter,
    })

    // Validate input
    validateMatches(matches)
    console.log('Match validation passed')

    // Generate Merkle tree
    console.log('Generating Merkle tree...')
    const merkleData = generateMerkleTree(matches)
    console.log('Merkle tree generated:', { root: merkleData.root })

    // Prepare IPFS data
    const ipfsData: IPFSMatchData = {
      amaId,
      matches,
      timestamp: metadata.timestamp,
      version: metadata.version,
      submitter: metadata.submitter,
    }

    // Upload to IPFS with retries
    let contentHash: string | null = null
    let lastError: Error | null = null
    let attempt = 0

    console.log('Starting IPFS upload with retries...')
    while (attempt < retryAttempts && !contentHash) {
      try {
        console.log(`IPFS upload attempt ${attempt + 1}/${retryAttempts}`)
        onAttempt?.(attempt + 1)
        contentHash = await uploadMatchesToIPFS(ipfsData)
      } catch (error) {
        lastError = error as Error
        console.error(`IPFS upload attempt ${attempt + 1} failed:`, error)
        if (attempt === retryAttempts - 1) {
          throw new IPFSError(
            `Failed to upload to IPFS after ${retryAttempts} attempts: ${lastError.message}`,
            lastError,
          )
        }
        attempt++
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }

    if (!contentHash) {
      throw new IPFSError('Failed to upload to IPFS after retries', lastError)
    }

    console.log('Successfully uploaded to IPFS:', contentHash)

    // Sign the data
    console.log('Signing data...')
    const signature = await signMatchData(
      amaId,
      contentHash,
      merkleData.root,
      signer,
    )
    console.log('Data signed successfully')

    return {
      contentHash: contentHash as `0x${string}`,
      merkleRoot: merkleData.root as `0x${string}`,
      signature: signature as `0x${string}`,
      merkleData,
    }
  } catch (error) {
    console.error('Match submission failed:', error)
    if (error instanceof MatchSubmissionError) {
      throw error
    }
    throw new MatchSubmissionError(
      'Failed to submit matches',
      'UNKNOWN_ERROR',
      error,
    )
  }
}

// Function to retrieve and verify existing submission
export async function getSubmission(
  contentHash: string,
  merkleRoot: string,
): Promise<{
  matches: Match[]
  merkleData: MerkleData
  metadata: SubmissionMetadata
}> {
  try {
    const ipfsData = await getMatchesFromIPFS(contentHash)
    const merkleData = generateMerkleTree(ipfsData.matches)

    // Verify merkle root matches
    if (merkleData.root !== merkleRoot) {
      throw new ValidationError('Merkle root mismatch')
    }

    // Convert matches to proper type
    const matches: Match[] = ipfsData.matches.map((match) => ({
      ...match,
      questionHash: match.questionHash as `0x${string}`,
      answerHash: match.answerHash as `0x${string}`,
      hash: generateMatchHash(
        match.questionHash,
        match.answerHash,
        match.ranking,
      ) as `0x${string}`,
    }))

    return {
      matches,
      merkleData,
      metadata: {
        timestamp: ipfsData.timestamp,
        version: ipfsData.version,
        submitter: ipfsData.submitter as Address,
      },
    }
  } catch (error) {
    if (error instanceof MatchSubmissionError) {
      throw error
    }
    throw new MatchSubmissionError(
      'Failed to retrieve submission',
      'RETRIEVAL_ERROR',
      error,
    )
  }
}

// Function to verify a specific match in a submission
export function verifyMatch(
  match: Match,
  merkleRoot: string,
  proof: string[],
): boolean {
  try {
    const merkleData = generateMerkleTree([match])
    return merkleData.root === merkleRoot && proof.length > 0
  } catch (error) {
    throw new ValidationError('Failed to verify match', error)
  }
}
