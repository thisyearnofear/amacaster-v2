import { NextRequest, NextResponse } from 'next/server';
import { getNeynarClient } from '../../../../amacast/src/lib/neynar';

// Accepts either a hash or a Warpcast URL as the id param
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const client = getNeynarClient();
  // Get ?questions and ?answers params, default to 3 each
  const { searchParams } = new URL(req.url);
  const questionsLimit = parseInt(searchParams.get('questions') || '3', 10);
  const answersLimit = parseInt(searchParams.get('answers') || '3', 10);
  let response;
  try {
    // Try as URL first
    try {
      response = await client.lookupCastConversation({ identifier: id, type: 'url' });
      console.log(`[AMA DEBUG] Success: id=${id} type=url`);
    } catch (err) {
      console.error(`[AMA DEBUG] Failed as url: id=${id} error=`, err instanceof Error ? err.message : err);
      // Fallback: try as hash
      try {
        response = await client.lookupCastConversation({ identifier: id, type: 'hash' });
        console.log(`[AMA DEBUG] Success: id=${id} type=hash`);
      } catch (err2) {
        console.error(`[AMA DEBUG] Failed as hash: id=${id} error=`, err2 instanceof Error ? err2.message : err2);
        return NextResponse.json({ error: 'AMA not found' }, { status: 404 });
      }
    }
  } catch (outerErr) {
    console.error(`[AMA DEBUG] Unexpected error for id=${id}:`, outerErr instanceof Error ? outerErr.message : outerErr);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
  const mainCast = response.conversation.cast;
  const answers = (response.conversation as any).direct_replies || [];
  // Only return the main question (as before), but limit answers
  return NextResponse.json({
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
    answers: answers.slice(0, answersLimit).map((a: any) => ({
      hash: a.hash,
      text: a.text,
      author: {
        username: a.author.username,
        pfp: { url: a.author.pfp_url || '' },
      },
      timestamp: a.timestamp,
    })),
  });
}
