import { NextRequest, NextResponse } from 'next/server'
import { getNeynarClient } from '../../../amacast/src/lib/neynar';

// Example AMA sources: Replace with real Farcaster thread hashes or cast URLs
const AMA_THREADS = [
  'https://warpcast.com/dwr.eth/0x390ae86a', // Vitalik Buterin
  'https://warpcast.com/dwr.eth/0x7735946a', // Brian Armstrong
  'https://warpcast.com/dwr.eth/0x87e91802', // Fred Wilson
  'https://warpcast.com/dwr.eth/0xe4ec97c9', // Garry Tan
  'https://warpcast.com/dwr.eth/0x231c3b60', // Chris Dixon
  'https://warpcast.com/dwr.eth/0xd39ac80f', // Elad Gil
  'https://warpcast.com/pmarca/0x5901e102', // Marc Andreessen
  'https://warpcast.com/yb/0x8bac9cbb', // @colin
  'https://warpcast.com/yb/0x7d5219e5', // horsefacts
  'https://warpcast.com/dwr.eth/0xf41e24f1', // @dwr
  'https://warpcast.com/jam/0x794f4a4e', // @ace
  'https://warpcast.com/jam/0xe195a8e2', // @df
  'https://warpcast.com/kugusha.eth/0xa404739c', // @qualv
];

async function fetchAMAThread(threadUrl: string) {
  const client = getNeynarClient();
  try {
    const response = await client.lookupCastConversation({
      identifier: threadUrl,
      type: 'url',
    });
    const mainCast = response.conversation.cast;
    const answers = (response.conversation as any).direct_replies || [];
    return {
      id: mainCast.hash,
      title: mainCast.text.slice(0, 48) + (mainCast.text.length > 48 ? '...' : ''),
      description: mainCast.text,
      authorFid: String(mainCast.author.fid),
      createdAt: mainCast.timestamp,
      tags: [],
      questions: [{
        hash: mainCast.hash,
        text: mainCast.text,
        author: {
          username: mainCast.author.username,
          pfp: { url: mainCast.author.pfp_url || '' },
        },
        timestamp: mainCast.timestamp,
      }],
      answers: answers.map((a: any) => ({
        hash: a.hash,
        text: a.text,
        author: {
          username: a.author.username,
          pfp: { url: a.author.pfp_url || '' },
        },
        timestamp: a.timestamp,
      })),
    };
  } catch (err) {
    // Log the error and the URL for debugging
    console.error(`Failed to fetch AMA for URL: ${threadUrl}`, err instanceof Error ? err.message : err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  // Fetch all AMA threads in parallel, filter out nulls (failed fetches)
  const results = await Promise.all(AMA_THREADS.map(fetchAMAThread));
  const amas = results.filter(Boolean);
  return NextResponse.json(amas);
}
