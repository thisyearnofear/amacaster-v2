export const AMA_CONTRACT_ABI = [
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
        name: 'contractId',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'fid',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'title',
        type: 'string',
      },
    ],
    name: 'ContractSubmitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'contractId',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'enum AMAContract.ContractState',
        name: 'state',
        type: 'uint8',
      },
    ],
    name: 'ContractStateUpdated',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'title',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'startTime',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'endTime',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'minQualityScore',
        type: 'uint256',
      },
    ],
    name: 'submitContract',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'fid',
        type: 'uint256',
      },
    ],
    name: 'registerFid',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'contractId',
        type: 'bytes32',
      },
    ],
    name: 'getContractDetails',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'fid',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'title',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'description',
            type: 'string',
          },
          {
            internalType: 'uint256',
            name: 'startTime',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'endTime',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'rewardPool',
            type: 'uint256',
          },
          {
            internalType: 'enum AMAContract.ContractState',
            name: 'state',
            type: 'uint8',
          },
          {
            internalType: 'uint256',
            name: 'participantCount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'questionCount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'matchCount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'minQualityScore',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'createdAt',
            type: 'uint256',
          },
        ],
        internalType: 'struct AMAContract.ContractSubmission',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
