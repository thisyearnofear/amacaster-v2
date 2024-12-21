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
    <div className="fixed top-0 right-0 flex items-center gap-4 p-4 z-[100] bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-4">
        <ConnectButton />
        <SignInWithNeynar />
      </div>
    </div>
  )
}
