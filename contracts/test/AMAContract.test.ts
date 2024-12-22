import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { AMAContract } from '../typechain-types'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'

describe('AMAContract', function () {
  async function deployContractFixture() {
    const [owner, user1, user2] = await ethers.getSigners()
    const AMAContract = await ethers.getContractFactory('AMAContract')
    const contract = await AMAContract.deploy()
    await contract.waitForDeployment()

    return { contract, owner, user1, user2 }
  }

  // Test data
  const testAmaId =
    '0x1234567890123456789012345678901234567890123456789012345678901234'
  const testFid = 378
  const testMatch = {
    questionHash:
      '0x1234567890123456789012345678901234567890123456789012345678901234',
    answerHash:
      '0x2345678901234567890123456789012345678901234567890123456789012345',
    ranking: 1,
    questionContent: {
      text: 'Test question?',
      cast_id: 'cast_123',
      timestamp: Math.floor(Date.now() / 1000),
      author: {
        fid: testFid,
        username: 'testuser',
      },
    },
    answerContent: {
      text: 'Test answer',
      cast_id: 'cast_456',
      timestamp: Math.floor(Date.now() / 1000),
      author: {
        fid: testFid + 1,
        username: 'answerer',
      },
    },
    category: 'test',
    tags: ['test', 'example'],
    quality_signals: {
      relevance_score: 0.8,
      engagement_score: 0.7,
      curator_notes: 'Good Q&A pair',
    },
  }

  const testMetadata = {
    timestamp: Math.floor(Date.now() / 1000),
    version: 1,
    submitter_fid: testFid.toString(),
    ama_title: 'Test AMA',
    ama_host: 'Test Host',
    curation_criteria: {
      focus_topics: ['test'],
      quality_threshold: 0.7,
      curation_guidelines: 'Select good Q&As',
    },
  }

  describe('Registration', function () {
    it('Should allow users to register their FID', async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture)
      await expect(contract.connect(user1).registerFid(testFid))
        .to.emit(contract, 'FidRegistered')
        .withArgs(user1.address, testFid)
    })

    it('Should not allow duplicate FID registration', async function () {
      const { contract, user1, user2 } = await loadFixture(
        deployContractFixture,
      )
      await contract.connect(user1).registerFid(testFid)
      await expect(
        contract.connect(user2).registerFid(testFid),
      ).to.be.revertedWith('FID already registered')
    })
  })

  describe('Contract Submission', function () {
    it('Should allow registered users to submit contracts', async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture)
      await contract.connect(user1).registerFid(testFid)

      const merkleRoot =
        '0x1234567890123456789012345678901234567890123456789012345678901234'
      const ipfsHash =
        '0x2345678901234567890123456789012345678901234567890123456789012345'

      await expect(
        contract.connect(user1).submitContract(testAmaId, merkleRoot, ipfsHash),
      )
        .to.emit(contract, 'ContractSubmitted')
        .withArgs(user1.address, testAmaId, merkleRoot, ipfsHash)
    })

    it('Should not allow unregistered users to submit contracts', async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture)
      const merkleRoot =
        '0x1234567890123456789012345678901234567890123456789012345678901234'
      const ipfsHash =
        '0x2345678901234567890123456789012345678901234567890123456789012345'

      await expect(
        contract.connect(user1).submitContract(testAmaId, merkleRoot, ipfsHash),
      ).to.be.revertedWith('FID not registered')
    })
  })

  describe('Contract Verification', function () {
    it('Should correctly verify submitted contracts', async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture)
      await contract.connect(user1).registerFid(testFid)

      const merkleRoot =
        '0x1234567890123456789012345678901234567890123456789012345678901234'
      const ipfsHash =
        '0x2345678901234567890123456789012345678901234567890123456789012345'

      await contract
        .connect(user1)
        .submitContract(testAmaId, merkleRoot, ipfsHash)

      const submittedContract = await contract.getContract(testAmaId)
      expect(submittedContract.merkleRoot).to.equal(merkleRoot)
      expect(submittedContract.ipfsHash).to.equal(ipfsHash)
    })

    it('Should return correct user contracts', async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture)
      await contract.connect(user1).registerFid(testFid)

      const merkleRoot =
        '0x1234567890123456789012345678901234567890123456789012345678901234'
      const ipfsHash =
        '0x2345678901234567890123456789012345678901234567890123456789012345'

      await contract
        .connect(user1)
        .submitContract(testAmaId, merkleRoot, ipfsHash)

      const userContracts = await contract.getUserContracts(testFid)
      expect(userContracts).to.include(testAmaId)
    })
  })

  describe('Participation', function () {
    it('Should allow users to participate in contracts', async function () {
      const { contract, user1, user2 } = await loadFixture(
        deployContractFixture,
      )
      await contract.connect(user1).registerFid(testFid)

      const merkleRoot =
        '0x1234567890123456789012345678901234567890123456789012345678901234'
      const ipfsHash =
        '0x2345678901234567890123456789012345678901234567890123456789012345'

      await contract
        .connect(user1)
        .submitContract(testAmaId, merkleRoot, ipfsHash)

      await expect(contract.connect(user2).participate(testAmaId))
        .to.emit(contract, 'UserParticipated')
        .withArgs(user2.address, testAmaId)
    })

    it('Should track participation correctly', async function () {
      const { contract, user1, user2 } = await loadFixture(
        deployContractFixture,
      )
      await contract.connect(user1).registerFid(testFid)

      const merkleRoot =
        '0x1234567890123456789012345678901234567890123456789012345678901234'
      const ipfsHash =
        '0x2345678901234567890123456789012345678901234567890123456789012345'

      await contract
        .connect(user1)
        .submitContract(testAmaId, merkleRoot, ipfsHash)
      await contract.connect(user2).participate(testAmaId)

      const hasParticipated = await contract.hasParticipated(
        user2.address,
        testAmaId,
      )
      expect(hasParticipated).to.be.true
    })
  })
})
