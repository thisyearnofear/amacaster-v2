# Amacaster Smart Contracts

This directory contains the smart contracts for the Amacaster platform, deployed on Optimism Sepolia testnet.

## Architecture Overview

### Gas-Optimized Storage Strategy

1. **IPFS Integration**

   - Match data stored on IPFS via Pinata
   - Only content hashes stored on-chain
   - Efficient content retrieval through dedicated gateway
   - Versioning support through content addressing

2. **Merkle Tree Implementation**

   - Batch verification of matches
   - Minimal on-chain storage footprint
   - Efficient proof verification
   - Support for large datasets

3. **Signature Verification**
   - ECDSA signatures for data authenticity
   - Replay attack prevention
   - Secure update mechanism

## Contracts

### AMAMatcher (`0xa226c82f1b6983aBb7287Cd4d83C2aEC802A183F`)

- Handles Q&A match submissions with gas optimization
- Stores Merkle roots and IPFS content hashes
- Manages submission states and versions
- Supports draft/finalize workflow
- Implements signature verification

### AMAContract (`0xbcb41ff65549D5d067C603768f1B94C9cd0D6031`)

- Core AMA functionality
- User profile management
- Reputation system
- Contract state management

## Data Flow

1. **Match Submission Process**

   ```
   Frontend -> IPFS -> Smart Contract
   1. Generate Merkle tree from matches
   2. Upload data to IPFS via Pinata
   3. Store IPFS hash and Merkle root on-chain
   4. Sign transaction for authenticity
   ```

2. **Verification Process**
   ```
   Smart Contract <- IPFS <- Frontend
   1. Retrieve data from IPFS
   2. Generate Merkle proof
   3. Verify proof against on-chain root
   4. Validate signature
   ```

## Development

### Prerequisites

- Node.js 16+
- Hardhat
- Pinata API credentials

### Setup

```bash
# Install dependencies
yarn install

# Copy example env file
cp .env.example .env

# Configure environment variables
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=your_gateway_url
PRIVATE_KEY=your_deployer_private_key
```

### Testing

```bash
# Run all tests
yarn test

# Run specific test file
yarn test test/AMAMatcher.test.ts
```

### Deployment

```bash
# Deploy to Optimism Sepolia
yarn deploy:optimism

# Verify contracts
yarn verify:optimism
```

## Contract Features

### AMAMatcher

- **Draft/Finalize System**

  - Save work in progress
  - Version control
  - State management
  - History tracking

- **Gas Optimization**

  - Merkle tree for batch verification
  - IPFS for data storage
  - Minimal on-chain storage
  - Efficient proof validation

- **Security**
  - Signature verification
  - Replay protection
  - State transition controls
  - Access management

### Integration Guide

1. **IPFS Setup**

   ```typescript
   import { PinataSDK } from 'pinata-web3'

   const pinata = new PinataSDK({
     pinataJwt: process.env.PINATA_JWT!,
     pinataGateway: process.env.PINATA_GATEWAY!,
   })
   ```

2. **Merkle Tree Generation**

   ```typescript
   import { StandardMerkleTree } from '@openzeppelin/merkle-tree'

   const tree = StandardMerkleTree.of(
     matches.map((m) => [m.hash]),
     ['bytes32'],
   )
   const root = tree.root
   const proof = tree.getProof(matchIndex)
   ```

3. **Contract Interaction**

   ```typescript
   const contentHash = await uploadToIPFS(matches)
   const merkleRoot = generateMerkleRoot(matches)
   const signature = await signData(contentHash, merkleRoot)

   await contract.updateMatch(amaId, contentHash, merkleRoot, signature)
   ```

## Security Considerations

1. **Data Integrity**

   - IPFS content addressing ensures data hasn't been tampered with
   - Merkle proofs verify individual matches
   - Signatures prevent unauthorized updates

2. **Access Control**

   - Role-based permissions
   - State transition guards
   - Finalization controls

3. **Gas Optimization**
   - Batch operations where possible
   - Minimal on-chain storage
   - Efficient verification methods

## Contributing

Please read [CONTRIBUTING.md](../CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.
