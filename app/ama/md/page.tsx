export const dynamic = 'force-dynamic'
export const revalidate = 0

// Add cache helper
async function fetchWithCache(url: string, options: RequestInit) {
  const response = await fetch(url, {
    ...options,
    next: {
      revalidate: 300, // Cache for 5 minutes
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}

export default async function AMA({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const options = {
    headers: {
      accept: 'application/json',
      api_key: process.env.NEYNAR_API_KEY ?? '',
    },
  }

  // Use cache helper
  const mainCast = await fetchWithCache(
    'https://api.neynar.com/v2/farcaster/cast?type=url&identifier=' +
      searchParams['url'],
    options,
  )

  const amaUser = mainCast.cast.mentioned_profiles?.[0] || mainCast.cast.author

  const thread = await fetchWithCache(
    'https://api.neynar.com/v1/farcaster/all-casts-in-thread?threadHash=' +
      mainCast.cast.hash,
    options,
  )

  let items: {
    hash: string
    question: string
    answer: string
    userAvatar: string
    userUsername: string
  }[] = []

  thread.result.casts.map((cast: any) => {
    if (cast.parentHash == mainCast.cast.hash) {
      // Find answer
      const replies = thread.result.casts.filter((obj: any) => {
        return (
          obj.parentHash === cast.hash &&
          obj.author.username === amaUser?.username
        )
      })
      const reply = replies?.[0]

      // Only include items with answers from the AMA user
      if (reply) {
        items.push({
          hash: cast.hash,
          question: cast.text,
          answer: reply?.text,
          userAvatar: cast?.author?.pfp?.url,
          userUsername: cast?.author?.username,
        })
      }
    }
  })

  return (
    <code>
      {items.map((item) => (
        <span key={item.hash}>
          **{item.question}**
          <br />
          {item.answer}
          <br />
          <br />
        </span>
      ))}
    </code>
  )
}
