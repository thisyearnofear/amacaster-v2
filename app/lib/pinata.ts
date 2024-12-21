import axios from 'axios'

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY

if (!PINATA_JWT) {
  throw new Error('PINATA_JWT environment variable is not set')
}

if (!PINATA_GATEWAY) {
  throw new Error('PINATA_GATEWAY environment variable is not set')
}

/**
 * Pin JSON data to IPFS using Pinata
 * @param jsonData The JSON data to pin
 * @returns The IPFS hash (CID) of the pinned content
 */
export async function pinJSONToIPFS(jsonData: any): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      jsonData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      },
    )

    return response.data.IpfsHash
  } catch (error) {
    console.error('Error pinning to IPFS:', error)
    throw new Error('Failed to pin content to IPFS')
  }
}

/**
 * Get content from IPFS using Pinata gateway
 * @param hash The IPFS hash (CID) to retrieve
 * @returns The content from IPFS
 */
export async function getFromIPFS(hash: string): Promise<any> {
  try {
    const response = await axios.get(`${PINATA_GATEWAY}/ipfs/${hash}`)
    return response.data
  } catch (error) {
    console.error('Error getting from IPFS:', error)
    throw new Error('Failed to get content from IPFS')
  }
}

/**
 * Unpin content from Pinata
 * @param hash The IPFS hash (CID) to unpin
 */
export async function unpinFromIPFS(hash: string): Promise<void> {
  try {
    await axios.delete(`https://api.pinata.cloud/pinning/unpin/${hash}`, {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    })
  } catch (error) {
    console.error('Error unpinning from IPFS:', error)
    throw new Error('Failed to unpin content from IPFS')
  }
} 