import { ConnectButton } from '@rainbow-me/rainbowkit'

export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted
        if (!ready) {
          return null
        }

        if (!account) {
          return (
            <button
              onClick={openConnectModal}
              className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
            >
              Connect Wallet
            </button>
          )
        }

        if (chain?.unsupported) {
          return (
            <button
              onClick={openChainModal}
              className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
            >
              Wrong network
            </button>
          )
        }

        return (
          <div className="flex items-center gap-4">
            <button
              onClick={openChainModal}
              className="px-4 py-2 font-bold text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              {chain?.name ?? 'Unknown Network'}
            </button>

            <button
              onClick={openAccountModal}
              className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
            >
              {account.displayName}
              {account.displayBalance ? ` (${account.displayBalance})` : ''}
            </button>
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
