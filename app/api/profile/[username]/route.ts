import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { username: string } },
) {
  try {
    const { username } = params
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 },
      )
    }

    // Fetch profile from web3.bio
    const response = await fetch(`https://api.web3.bio/profile/${username}`, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
