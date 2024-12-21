'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { SignInWithNeynar } from './SignInWithNeynar'

export function AuthContainer() {
  return (
    <div className="auth-buttons-container">
      <ConnectButton />
      <SignInWithNeynar />
    </div>
  )
}
