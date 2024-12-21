import { NeynarAPIClient } from '@neynar/nodejs-sdk'

export interface NeynarAuthResponse {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  custodyAddress: string
  verifications: string[]
}

class NeynarAuthClient {
  private client: NeynarAPIClient
  private signerUuid: string | null = null

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY
    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_NEYNAR_API_KEY is not set')
    }
    this.client = new NeynarAPIClient(apiKey)
  }

  async signIn(): Promise<NeynarAuthResponse> {
    try {
      return new Promise((resolve, reject) => {
        // Create a div for the SIWN button if it doesn't exist
        let siwnDiv = document.getElementById('neynar_signin')
        if (!siwnDiv) {
          siwnDiv = document.createElement('div')
          siwnDiv.id = 'neynar_signin'
          siwnDiv.className = 'neynar_signin'
          siwnDiv.setAttribute(
            'data-client_id',
            process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID!,
          )
          siwnDiv.setAttribute('data-theme', 'dark')
          document.body.appendChild(siwnDiv)
        }

        // Add the SIWN script if it hasn't been added
        if (!document.querySelector('script[src*="siwn"]')) {
          const script = document.createElement('script')
          script.src = 'https://neynarxyz.github.io/siwn/raw/1.2.0/index.js'
          script.async = true
          document.body.appendChild(script)
        }

        // Define the success callback
        window.onSignInSuccess = (data: any) => {
          this.signerUuid = data.signer_uuid
          resolve({
            fid: data.fid,
            username: data.user.username,
            displayName: data.user.display_name,
            pfpUrl: data.user.pfp_url,
            custodyAddress: data.user.custody_address,
            verifications: data.user.verifications || [],
          })

          // Clean up
          siwnDiv?.remove()
        }
      })
    } catch (error) {
      console.error('Error during Farcaster sign in:', error)
      throw error
    }
  }

  async signOut() {
    // Clear the signer UUID
    this.signerUuid = null
  }
}

// Declare the global onSignInSuccess function
declare global {
  interface Window {
    onSignInSuccess: (data: any) => void
  }
}

export const neynarAuthClient = new NeynarAuthClient()
