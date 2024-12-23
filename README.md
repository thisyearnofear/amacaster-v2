# Amacaster

A decentralized AMA (Ask Me Anything) platform built on Optimism, integrating Farcaster social features with blockchain-based verification.

## Core Features

1. **AMA Discovery & Curation**

   - Browse featured AMAs from prominent Web3 figures
   - View curated Q&A matches ranked by usefulness
   - Stack multiple answers for comprehensive insights

2. **Profile Integration**

   - Farcaster profile integration with web3.bio data
   - View user's Q&A history and contributions
   - Track engagement metrics and match history

3. **Match Submission**
   - Submit top 5 most useful Q&As from AMAs
   - Rank matches by usefulness
   - Support for multiple answers per question

## Architecture

### Storage Strategy

- **On-chain Storage**: Minimal storage using Merkle roots and IPFS content hashes
- **Off-chain Storage**: IPFS via Pinata for actual match data and content
- **Verification**: Merkle proofs for efficient data verification
- **Security**: ECDSA signatures for data authenticity

### Key Components

1. **Smart Contracts**

   - `AMAContract`: Core AMA functionality and user profiles
   - `AMAMatcher`: Optimized match submission and verification system

2. **Off-chain Storage (IPFS/Pinata)**

   - Question-Answer pairs
   - Match submissions
   - User metadata
   - Version history

3. **Frontend**
   - Next.js application
   - RainbowKit for wallet connection
   - Farcaster integration for social features
   - Web3.bio integration for profile data

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
