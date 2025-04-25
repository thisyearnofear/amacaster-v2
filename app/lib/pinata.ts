import axios from 'axios'

function getPinataJwt(): string {
  const jwt = process.env.PINATA_JWT
  if (!jwt) {
    throw new Error('PINATA_JWT environment variable is not set')
  }
  return jwt
}

function getPinataGateway(): string {
  const gateway = process.env.PINATA_GATEWAY
  if (!gateway) {
    throw new Error('PINATA_GATEWAY environment variable is not set')
  }
  return gateway
}

/**
 * Pin JSON data to IPFS using Pinata
 * @param jsonData The JSON data to pin
 * @returns The IPFS hash (CID) of the pinned content
 */
export async function pinJSONToIPFS(jsonData: any): Promise<string> {
  try {
    const jwt = getPinataJwt()
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      jsonData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
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
    const gateway = getPinataGateway()
    const response = await axios.get(`${gateway}/ipfs/${hash}`)
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
    const jwt = getPinataJwt()
    await axios.delete(`https://api.pinata.cloud/pinning/unpin/${hash}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    })
  } catch (error) {
    console.error('Error unpinning from IPFS:', error)
    throw new Error('Failed to unpin content from IPFS')
  }
}