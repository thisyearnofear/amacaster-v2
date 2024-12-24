export const AMA_FEATURED_ABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'amaId', type: 'bytes32' },
      { internalType: 'uint256', name: 'fid', type: 'uint256' },
    ],
    name: 'getFeaturedQA',
    outputs: [
      { internalType: 'bytes32', name: 'questionHash', type: 'bytes32' },
      { internalType: 'bytes32', name: 'answerHash', type: 'bytes32' },
      { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { internalType: 'uint256', name: 'submitterFid', type: 'uint256' },
      { internalType: 'string', name: 'username', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'amaId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'questionHash', type: 'bytes32' },
      { internalType: 'bytes32', name: 'answerHash', type: 'bytes32' },
      { internalType: 'uint256', name: 'fid', type: 'uint256' },
      { internalType: 'string', name: 'username', type: 'string' },
    ],
    name: 'submitFeaturedQA',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
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
      { indexed: true, internalType: 'uint256', name: 'fid', type: 'uint256' },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'questionHash',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'answerHash',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'username',
        type: 'string',
      },
    ],
    name: 'FeaturedQASubmitted',
    type: 'event',
  },
] as const
