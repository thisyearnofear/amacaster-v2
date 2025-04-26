import { NeynarAPIClient } from '@neynar/nodejs-sdk'

interface Cast {
  hash: string
  thread_hash: string
  parent_hash?: string
  author: {
    username: string
    display_name: string
    pfp_url: string
    fid: number
  }
  text: string
  timestamp: string
  reactions: {
    likes_count: number
    recasts_count: number
  }
  replies: {
    count: number
  }
  mentioned_profiles?: Array<{
    username: string
    display_name: string
    pfp_url: string
    fid: number
  }>
}

interface CastResponse {
  result: {
    cast: Cast
  }
}

interface ThreadResponse {
  result: {
    casts: Cast[]
  }
}

class NeynarClient {
  private apiUrl = 'https://api.neynar.com/v2/farcaster'
  private apiKey: string

  constructor(apiKey: string) {
    if (!apiKey) {
      console.error('Constructor error: Neynar API key is required')
      throw new Error('Neynar API key is required')
    }
    this.apiKey = apiKey
  }

  async lookupCastByUrl(url: string): Promise<CastResponse> {
    const response = await fetch(
      `${this.apiUrl}/cast?type=url&identifier=${url}`,
      {
        headers: {
          api_key: this.apiKey,
          Accept: 'application/json',
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
      throw new Error(`Failed to fetch cast: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      result: {
        cast: data.cast as Cast,
      },
    }
  }

  async fetchThread(threadHash: string): Promise<ThreadResponse> {
    const endpoint = `${this.apiUrl}/cast/conversation?identifier=${encodeURIComponent(threadHash)}&type=hash&reply_depth=2`
    const response = await fetch(endpoint, {
      headers: {
        api_key: this.apiKey,
        Accept: 'application/json',
      },
    })
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error fetching thread:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
      throw new Error(`Failed to fetch thread: ${response.statusText}`)
    }
    const data = await response.json()
    const conv = data.conversation?.cast
    if (!conv) {
      console.error('Invalid conversation response structure:', data)
      throw new Error('Invalid conversation response structure')
    }
    // Flatten root + all nested direct_replies to capture AMA user answers
    const casts: Cast[] = []
    const queue: any[] = [conv]
    while (queue.length) {
      const node = queue.shift()
      casts.push(node as Cast)
      if (node.direct_replies && Array.isArray(node.direct_replies)) {
        queue.push(...node.direct_replies)
      }
    }
    return { result: { casts } }
  }
}

// Create a function to get the client instance
export function getNeynarClient() {
  const apiKey = process.env.NEYNAR_API_KEY

  if (!apiKey) {
    console.error('NEYNAR_API_KEY is not set')
    throw new Error('NEYNAR_API_KEY is not set')
  }
  return new NeynarClient(apiKey)
}

export type { Cast }
