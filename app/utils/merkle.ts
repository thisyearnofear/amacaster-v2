import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
import { keccak256, encodePacked } from 'viem'
import { type IPFSMatchData } from './ipfs'

export interface MerkleData {
  root: string
  proofs: { [key: string]: string[] }
  leaves: string[]
}

/**
 * Generate a hash for a match
 * @param questionHash Question hash
 * @param answerHash Answer hash
 * @param ranking Ranking value
 * @returns Match hash
 */
export function generateMatchHash(
  questionHash: string,
  answerHash: string,
  ranking: number,
): string {
  return keccak256(
    encodePacked(
      ['bytes32', 'bytes32', 'uint256'],
      [
        questionHash as `0x${string}`,
        answerHash as `0x${string}`,
        BigInt(ranking),
      ],
    ),
  )
}

/**
 * Generate a Merkle tree from match data
 * @param matches Match data
 * @returns Merkle tree data including root and proofs
 */
export function generateMerkleTree(
  matches: IPFSMatchData['matches'],
): MerkleData {
  // Generate leaves (match hashes)
  const leaves = matches.map((match) =>
    generateMatchHash(match.questionHash, match.answerHash, match.ranking),
  )

  // Create Merkle tree
  const tree = StandardMerkleTree.of(
    leaves.map((leaf) => [leaf]),
    ['bytes32'],
  )

  // Generate proofs for each leaf
  const proofs: { [key: string]: string[] } = {}
  leaves.forEach((leaf, index) => {
    proofs[leaf] = tree.getProof(index)
  })

  return {
    root: tree.root,
    proofs,
    leaves,
  }
}

/**
 * Verify a match against a Merkle root
 * @param matchHash Match hash to verify
 * @param proof Merkle proof
 * @param root Merkle root
 * @returns boolean indicating if the match is valid
 */
export function verifyMatch(
  matchHash: string,
  proof: string[],
  root: string,
): boolean {
  return StandardMerkleTree.verify(root, ['bytes32'], [matchHash], proof)
}

/**
 * Generate a Merkle tree and get proof for a specific match
 * @param matches All matches
 * @param targetMatch Target match to get proof for
 * @returns Merkle proof for the target match
 */
export function getProofForMatch(
  matches: IPFSMatchData['matches'],
  targetMatch: IPFSMatchData['matches'][0],
): {
  proof: string[]
  root: string
  matchHash: string
} {
  const merkleData = generateMerkleTree(matches)
  const matchHash = generateMatchHash(
    targetMatch.questionHash,
    targetMatch.answerHash,
    targetMatch.ranking,
  )

  return {
    proof: merkleData.proofs[matchHash],
    root: merkleData.root,
    matchHash,
  }
}

/**
 * Verify multiple matches against a Merkle root
 * @param matches Matches to verify
 * @param proofs Proofs for each match
 * @param root Merkle root
 * @returns boolean indicating if all matches are valid
 */
export function verifyMatches(
  matches: IPFSMatchData['matches'],
  proofs: { [key: string]: string[] },
  root: string,
): boolean {
  return matches.every((match) => {
    const matchHash = generateMatchHash(
      match.questionHash,
      match.answerHash,
      match.ranking,
    )
    return verifyMatch(matchHash, proofs[matchHash], root)
  })
}
