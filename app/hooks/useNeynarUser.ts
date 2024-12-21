import { useEffect, useState } from 'react'
import type {
  NeynarUser,
  NeynarSignInResponse,
  UseNeynarUserReturn,
} from '../types/neynar'

export function useNeynarUser(): UseNeynarUserReturn {
  const [neynarUser, setNeynarUser] = useState<NeynarUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get user data from local storage
    const storedUser = localStorage.getItem('neynar_user')
    if (storedUser) {
      try {
        const signInData = JSON.parse(storedUser) as NeynarSignInResponse
        // Transform SignInResponse to NeynarUser
        const user: NeynarUser = {
          fid: signInData.fid,
          username: signInData.user.username,
          displayName: signInData.user.displayName,
          pfp: signInData.user.pfp,
          followerCount: 0,
          followingCount: 0,
          signer_uuid: signInData.signer_uuid,
        }
        setNeynarUser(user)
      } catch (err) {
        console.error('Error parsing stored user:', err)
        localStorage.removeItem('neynar_user')
      }
    }
    setLoading(false)
  }, [])

  const updateNeynarUser = (signInData: NeynarSignInResponse) => {
    const user: NeynarUser = {
      fid: signInData.fid,
      username: signInData.user.username,
      displayName: signInData.user.displayName,
      pfp: signInData.user.pfp,
      followerCount: 0,
      followingCount: 0,
      signer_uuid: signInData.signer_uuid,
    }
    setNeynarUser(user)
    localStorage.setItem('neynar_user', JSON.stringify(signInData))
  }

  const clearNeynarUser = () => {
    setNeynarUser(null)
    localStorage.removeItem('neynar_user')
  }

  return {
    neynarUser,
    loading,
    isLoading: loading,
    error,
    updateNeynarUser,
    clearNeynarUser,
    isConnected: !!neynarUser,
  }
}
