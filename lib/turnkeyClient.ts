import { Turnkey } from '@turnkey/sdk-server'
import { TurnkeySigner } from '@turnkey/ethers'
import { ethers } from 'ethers'

// Initialize Turnkey client
const turnkey = new Turnkey({
  apiBaseUrl: process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL!,
  apiPublicKey: process.env.NEXT_PUBLIC_TURNKEY_API_PUBLIC_KEY!,
  apiPrivateKey: process.env.NEXT_PUBLIC_TURNKEY_API_PRIVATE_KEY!,
  defaultOrganizationId: process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID!,
})

const apiClient = turnkey.apiClient()

export interface TurnkeyAuthResponse {
  userId: string
  walletAddress: string
  email?: string
}

export async function initializeWallet(
  email: string,
): Promise<TurnkeyAuthResponse> {
  try {
    // Create a new wallet with default Ethereum accounts
    const walletResponse = await apiClient.createWallet({
      walletName: `${email}'s Wallet`,
      accounts: [
        {
          curve: 'CURVE_SECP256K1',
          pathFormat: 'PATH_FORMAT_BIP32',
          path: "m/44'/60'/0'/0/0",
          addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
        },
      ],
    })

    return {
      userId: walletResponse.walletId,
      walletAddress: walletResponse.addresses[0],
      email,
    }
  } catch (error) {
    console.error('Error initializing wallet:', error)
    throw error
  }
}

export async function createTurnkeySigner(address: string) {
  const signer = new TurnkeySigner({
    client: apiClient,
    organizationId: process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID!,
    signWith: address,
  })

  // Connect to your preferred network
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
  return signer.connect(provider)
}

export { turnkey, apiClient }
