'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { SignInWithNeynar } from './SignInWithNeynar'
import { useEffect } from 'react'

export function AuthContainer() {
  useEffect(() => {
    // Debug environment variables
    console.log(
      'Wallet Connect Project ID exists:',
      !!process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    )
    console.log(
      'Neynar Client ID exists:',
      !!process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID,
    )
  }, [])

  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-2 flex justify-center items-center gap-4">
        <ConnectButton />
        <SignInWithNeynar />
      </div>
    </div>
  )
}
