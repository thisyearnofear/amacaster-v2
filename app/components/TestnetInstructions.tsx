'use client'

import { useAccount, useChainId } from 'wagmi'
import { optimismSepolia } from 'viem/chains'
import { useConnectModal } from '@rainbow-me/rainbowkit'

export function TestnetInstructions() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { openConnectModal } = useConnectModal()

  const isCorrectNetwork = chainId === optimismSepolia.id

  return (
    <div className="my-12 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center">
      <div className="space-y-4 max-w-md">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-600 text-sm">1</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-center">
              Connect Wallet
            </h3>
            {!isConnected ? (
              <button
                onClick={openConnectModal}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mx-auto"
              >
                Connect Now
              </button>
            ) : (
              <p className="text-green-600 text-center">✓ Wallet Connected</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 mt-4">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-600 text-sm">2</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-center">
              Switch to Optimism Sepolia
            </h3>
            {isConnected && !isCorrectNetwork ? (
              <p className="text-red-600 text-center">
                Please switch to Optimism Sepolia network
              </p>
            ) : isCorrectNetwork ? (
              <p className="text-green-600 text-center">✓ Correct Network</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center space-x-3 mt-4">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-600 text-sm">3</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-center">
              Get Test ETH
            </h3>
            <p className="text-gray-600 mt-1 text-center">
              Use the PoW faucet to get test ETH:
            </p>
            <a
              href="https://www.ethereum-ecosystem.com/faucets/optimism-sepolia"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors mx-auto"
            >
              Open Faucet ↗
            </a>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg border border-indigo-100 mx-auto">
          <p className="text-sm text-gray-600 text-center">
            <span className="font-semibold">Note:</span> Get OP Sepolia ETH 🔴
          </p>
        </div>
      </div>
    </div>
  )
}
