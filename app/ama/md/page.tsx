export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AMA({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Normalize URL param and ensure it's a string
  const rawUrl = searchParams['url']
  const urlParam: string = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl ?? ''
  if (!urlParam) {
    throw new Error('Missing url parameter')
  }

  // Fetch main cast via backend API
  const mainRes = await fetch(
    `/api/fetchCast?url=${encodeURIComponent(urlParam)}`,
    { next: { revalidate: 300 } }
  )
  if (!mainRes.ok) throw new Error(`Failed to fetch cast: ${mainRes.status}`)
  const { result: { cast: mainCast } } = await mainRes.json()

  const amaUser = mainCast.mentioned_profiles?.[0] || mainCast.author

  // Fetch thread via backend API
  const threadRes = await fetch(
    `/api/fetchThread?threadHash=${encodeURIComponent(mainCast.hash)}`,
    { next: { revalidate: 300 } }
  )
  if (!threadRes.ok) throw new Error(`Failed to fetch thread: ${threadRes.status}`)
  const { result: { casts } } = await threadRes.json()

  let items: {
    hash: string
    question: string
    answer: string
    userAvatar: string
    userUsername: string
  }[] = []

  // 1. Get all questions (direct replies to main cast), sorted by timestamp
  const questionCasts = casts
    .filter((cast: any) => cast.parentHash === mainCast.hash)
    .sort((a: any, b: any) => a.timestamp - b.timestamp)

  items = questionCasts.map((cast: any) => {
    // 2. For each question, get all answers from the AMA user, sorted by timestamp
    const replies = casts
      .filter((obj: any) => obj.parentHash === cast.hash && obj.author.username === amaUser?.username)
      .sort((a: any, b: any) => a.timestamp - b.timestamp)

    return {
      hash: cast.hash,
      question: cast.text,
      answers: replies, // all answer casts, possibly empty
      userAvatar: cast.author.pfp?.url || '',
      userUsername: cast.author.username,
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
