export const AMAIPCM_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'string',
        name: 'value',
        type: 'string',
      },
    ],
    name: 'MappingUpdated',
    type: 'event',
  },
  {
    inputs: [],
    name: 'getMapping',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'value',
        type: 'string',
      },
    ],
    name: 'updateMapping',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
