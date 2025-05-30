'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { type NeynarSignInResponse } from '../types/neynar'
import { ErrorMessage } from './common/ErrorMessage'
import { Card } from './common/Card'

interface SignInWithNeynarProps {
  onSignInSuccess?: (data: NeynarSignInResponse) => void
}

export function SignInWithNeynar({ onSignInSuccess }: SignInWithNeynarProps) {
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<NeynarSignInResponse | null>(null)

  const handleSignInSuccess = useCallback(
    (data: NeynarSignInResponse) => {
      console.log('Sign-in success with data:', data)
      if ('error' in data) {
        setError(data.error as string)
        return
      }

      // Store user data in localStorage
      localStorage.setItem('neynar_user', JSON.stringify(data))
      localStorage.setItem('neynar_signer_uuid', data.signer_uuid)

      setUser(data)
      onSignInSuccess?.(data)
    },
    [onSignInSuccess],
  )

  useEffect(() => {
    // Try to get stored user data
    const storedUser = localStorage.getItem('neynar_user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser) as NeynarSignInResponse
        setUser(userData)
        onSignInSuccess?.(userData)
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('neynar_user')
      }
    }

    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID
    if (!clientId) {
      setError('Neynar Client ID is not configured')
      return
    }

    // Assign the callback function to window
    ;(window as any).onSignInSuccess = handleSignInSuccess

    // Load the SIWN script
    const script = document.createElement('script')
    script.src = 'https://neynarxyz.github.io/siwn/raw/1.2.0/index.js'
    script.async = true
    script.onerror = () => {
      setError('Failed to load Neynar sign-in script')
    }
    document.body.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
      delete (window as any).onSignInSuccess
    }
  }, [handleSignInSuccess, onSignInSuccess])

  const handleSignOut = () => {
    localStorage.removeItem('neynar_user')
    localStorage.removeItem('neynar_signer_uuid')
    setUser(null)
  }

  if (error) {
    return <ErrorMessage>Error: {error}</ErrorMessage>
  }

  if (user) {
    return (
      <Card className="px-4 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Image
            src={user.user.pfp?.url || '/default-avatar.png'}
            alt={user.user.displayName}
            width={24}
            height={24}
            className="rounded-full"
            unoptimized={(user.user.pfp?.url || '').startsWith('data:')}
          />
          <span>@{user.user.username}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          Sign Out
        </button>
      </Card>
    )
  }

  return (
    <div
      className="neynar_signin inline-flex"
      data-client_id={process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID}
      data-success-callback="onSignInSuccess"
      data-theme="dark"
      data-variant="farcaster"
    />
  )
}
