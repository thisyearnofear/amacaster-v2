export const AMA_MATCHER_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'amaId',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'submitter',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes32[]',
        name: 'matchHashes',
        type: 'bytes32[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'rankings',
        type: 'uint256[]',
      },
    ],
    name: 'MatchSubmitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'amaId',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes32[]',
        name: 'correctMatches',
        type: 'bytes32[]',
      },
    ],
    name: 'MatchRevealed',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'amaId',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32[]',
        name: 'matchHashes',
        type: 'bytes32[]',
      },
      {
        internalType: 'uint256[]',
        name: 'rankings',
        type: 'uint256[]',
      },
    ],
    name: 'submitMatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'amaId',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32[]',
        name: 'correctMatches',
        type: 'bytes32[]',
      },
    ],
    name: 'revealMatches',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'amaId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'submitter',
        type: 'address',
      },
    ],
    name: 'getMatch',
    outputs: [
      {
        internalType: 'bytes32[]',
        name: 'matchHashes',
        type: 'bytes32[]',
      },
      {
        internalType: 'uint256[]',
        name: 'rankings',
        type: 'uint256[]',
      },
      {
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
