# Amacast

A decentralized AMA (Ask Me Anything) platform built on Optimism, integrating Farcaster social features with blockchain-based verification.

## Core Features

1. **AMA Discovery & Curation**

   - Browse featured AMAs from prominent Web3 figures
   - View curated Q&A matches ranked by usefulness
   - Stack multiple answers for comprehensive insights
   - Featured Q&As submitted on-chain for high-value content

2. **Profile Integration**

   - Farcaster profile integration with web3.bio data
   - View user's Q&A history and contributions
   - Track engagement metrics and match history
   - Display both IPFS-verified and on-chain featured Q&As

3. **Match Submission & IPFS Management**
   - Submit top 2 most useful Q&As to IPFS (verified submissions)
   - Submit single most valuable Q&A on-chain (featured submissions)
   - On-chain IPFS content mapping through IPCM
   - Track and verify IPFS content history through events
   - Support for multiple answers per question
   - Chronological display of submissions

## Architecture

### Storage Strategy

- **On-chain Storage**:
  - Featured Q&A pairs stored directly on-chain
  - IPFS content mapping through IPCM contract
  - Minimal storage using Merkle roots for regular submissions
  - Event-based history tracking for content updates
- **Off-chain Storage**:
  - IPFS via Pinata for regular match data and content
  - Content-addressed storage with version history
- **Verification**:
  - Merkle proofs for efficient data verification
  - IPFS content integrity through CIDs
- **Security**:
  - ECDSA signatures for data authenticity
  - Owner-controlled IPFS content updates

### Key Components

1. **Smart Contracts**

   - `AMAContract`: Core AMA functionality and user profiles
   - `AMAMatcher`: Optimized match submission and verification system
   - `AMARegistry`: Registry of AMAs and their creators
   - `AMAFeatured`: On-chain storage for featured Q&A submissions
   - `AMAIPCM`: On-chain IPFS content mapping and history

2. **Off-chain Storage (IPFS/Pinata)**

   - Regular question-answer pairs
   - Match submissions with version control
   - User metadata and profile data
   - Content history through IPFS CIDs

3. **Frontend**
   - Next.js application with TypeScript
   - RainbowKit for wallet connection
   - Farcaster integration for social features
   - Web3.bio integration for profile data
   - IPFS content history viewer

## Contract Addresses (Optimism Sepolia)

- AMAFeatured: `0xA78d4FcDaee13A11c11AEaD7f3a68CD15E8CB722`
- AMARegistry: [Address]
- AMAMatcher: [Address]
- AMAContract: [Address]
- AMAIPCM: `0x86D7cD141775f866403161974fB941F39F4C38Ef`

## Getting Started

### Prerequisites

- Node.js 16+
- Yarn or npm
- Optimism Sepolia testnet access
- Pinata API credentials
- Neynar API key for Farcaster integration

### Environment Setup

```bash
# Copy example env file
cp .env.example .env.local

# Fill in required values:
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_PINATA_GATEWAY=your_gateway_url
NEXT_PUBLIC_AMA_CONTRACT_ADDRESS=contract_address
NEXT_PUBLIC_CHAIN_ID=11155420  # Optimism Sepolia
NEXT_PUBLIC_NEYNAR_API_KEY=your_neynar_key
```

### Installation

```bash
# Install dependencies
yarn install

# Run development server
yarn dev
```

### Smart Contract Deployment

```bash
cd contracts
yarn install
yarn compile
yarn deploy:optimism
```

## Technical Details

### Gas Optimization Strategy

1. **Merkle Trees**

   - Store only Merkle roots on-chain
   - Verify individual matches using Merkle proofs
   - Efficient batch verification

2. **IPFS Integration**

   - Content addressed storage
   - Only store content hashes on-chain
   - Pinata for reliable IPFS pinning

3. **Version Control**
   - Efficient metadata storage
   - Full history accessible via IPFS
   - Minimal on-chain footprint

### Security Features

1. **Signature Verification**

   - ECDSA signatures for data authenticity
   - Replay protection
   - Secure update mechanism

2. **Access Control**
   - Role-based permissions
   - State transition controls
   - Finalization safeguards

## Development

### Testing

```bash
# Run contract tests
cd contracts
yarn test

# Run frontend tests
yarn test
```

### Local Development

1. Start local node:

```bash
cd contracts
yarn hardhat node
```

2. Deploy contracts:

```bash
yarn deploy:local
```

3. Start frontend:

```bash
yarn dev
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
