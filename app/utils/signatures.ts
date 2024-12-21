import { keccak256, encodePacked, toHex, pad } from 'viem'

export async function signMatchData(
  amaId: string,
  contentHash: string,
  merkleRoot: string,
  signer: { signMessage: (message: string | Uint8Array) => Promise<string> },
): Promise<string> {
  try {
    // Ensure contentHash and merkleRoot are properly padded to bytes32
    const paddedContentHash = contentHash.startsWith('0x')
      ? pad(contentHash as `0x${string}`, { size: 32 })
      : pad(`0x${contentHash}` as `0x${string}`, { size: 32 })

    const paddedMerkleRoot = merkleRoot.startsWith('0x')
      ? pad(merkleRoot as `0x${string}`, { size: 32 })
      : pad(`0x${merkleRoot}` as `0x${string}`, { size: 32 })

    // Create the message to sign
    const messageHash = keccak256(
      encodePacked(
        ['string', 'bytes32', 'bytes32'],
        [amaId, paddedContentHash, paddedMerkleRoot],
      ),
    )

    // Sign the message
    const signature = await signer.signMessage(messageHash)
    return signature
  } catch (error) {
    console.error('Error signing match data:', error)
    throw new Error(`Failed to sign match data: ${(error as Error).message}`)
  }
}
