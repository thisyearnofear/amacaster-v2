export const CONTRACTS = {
  AMAMatcher: {
    address: '0xa226c82f1b6983aBb7287Cd4d83C2aEC802A183F' as const,
    chainId: 11155420,
  },
  AMAContract: {
    address: '0xbcb41ff65549D5d067C603768f1B94C9cd0D6031' as const,
    chainId: 11155420,
  },
  AMAFeatured: {
    address: '0x0000000000000000000000000000000000000000' as const, // Replace with actual address after deployment
    chainId: 11155420,
  },
} as const

export const SUPPORTED_CHAINS = [11155420] // Optimism Sepolia
