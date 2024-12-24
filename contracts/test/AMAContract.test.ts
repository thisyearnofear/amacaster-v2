import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { AMAContract } from '../typechain-types'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { EventLog } from 'ethers'

describe('AMAContract', function () {
  async function deployContractFixture() {
    const [owner, user1, user2] = await ethers.getSigners()
    const AMAContract = await ethers.getContractFactory('AMAContract')
    const contract = await AMAContract.deploy()
    await contract.waitForDeployment()

    return { contract, owner, user1, user2 }
  }

  // Test data
  const testFid = 378
  const testTitle = 'Test AMA'
  const testDescription = 'Test Description'
  const testStartTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  const testEndTime = testStartTime + 7200 // 2 hours after start
  const testMinQualityScore = 7000 // 70%

  describe('Contract Submission', function () {
    it('Should allow users to submit contracts', async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture)

      // Register FID first
      await contract.connect(user1).registerFid(testFid)

      const tx = await contract
        .connect(user1)
        .submitContract(
          testTitle,
          testDescription,
          testStartTime,
          testEndTime,
          testMinQualityScore,
          { value: ethers.parseEther('0.1') },
        )

      const receipt = await tx.wait()
      const event = receipt?.logs.find(
        (log): log is EventLog =>
          log instanceof EventLog && log.eventName === 'ContractSubmitted',
      )
      expect(event).to.not.be.undefined

      const contractId = event?.args[0]
      expect(contractId).to.not.be.undefined

      // Verify contract details
      const details = await contract.getContractDetails(contractId)
      expect(details.fid).to.equal(testFid)
      expect(details.title).to.equal(testTitle)
      expect(details.description).to.equal(testDescription)
      expect(details.startTime).to.equal(testStartTime)
      expect(details.endTime).to.equal(testEndTime)
      expect(details.minQualityScore).to.equal(testMinQualityScore)
      expect(details.state).to.equal(0) // Initial state
      expect(details.participantCount).to.equal(0)
      expect(details.questionCount).to.equal(0)
      expect(details.matchCount).to.equal(0)
    })

    it('Should reject contracts with invalid time parameters', async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture)

      await contract.connect(user1).registerFid(testFid)

      // Test past start time
      const pastStartTime = Math.floor(Date.now() / 1000) - 3600
      await expect(
        contract
          .connect(user1)
          .submitContract(
            testTitle,
            testDescription,
            pastStartTime,
            testEndTime,
            testMinQualityScore,
          ),
      ).to.be.revertedWith('Invalid start time')

      // Test end time before start time
      const invalidEndTime = testStartTime - 3600
      await expect(
        contract
          .connect(user1)
          .submitContract(
            testTitle,
            testDescription,
            testStartTime,
            invalidEndTime,
            testMinQualityScore,
          ),
      ).to.be.revertedWith('Invalid end time')
    })
  })

  describe('FID Registration', function () {
    it('Should allow users to register their FID', async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture)

      await expect(contract.connect(user1).registerFid(testFid))
        .to.emit(contract, 'FidRegistered')
        .withArgs(user1.address, testFid)

      // Verify registration
      const userContracts = await contract.getUserContracts(testFid)
      expect(userContracts).to.be.an('array')
    })

    it('Should not allow duplicate FID registrations', async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture)

      await contract.connect(user1).registerFid(testFid)
      await expect(
        contract.connect(user1).registerFid(testFid + 1),
      ).to.be.revertedWith('FID already registered')
    })
  })

  describe('Contract Details Retrieval', function () {
    it('Should return correct contract details', async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture)

      await contract.connect(user1).registerFid(testFid)
      const tx = await contract
        .connect(user1)
        .submitContract(
          testTitle,
          testDescription,
          testStartTime,
          testEndTime,
          testMinQualityScore,
          { value: ethers.parseEther('0.1') },
        )

      const receipt = await tx.wait()
      const event = receipt?.logs.find(
        (log): log is EventLog =>
          log instanceof EventLog && log.eventName === 'ContractSubmitted',
      )
      const contractId = event?.args[0]

      const details = await contract.getContractDetails(contractId)
      expect(details.fid).to.equal(testFid)
      expect(details.title).to.equal(testTitle)
      expect(details.description).to.equal(testDescription)
      expect(details.startTime).to.equal(testStartTime)
      expect(details.endTime).to.equal(testEndTime)
      expect(details.minQualityScore).to.equal(testMinQualityScore)
      expect(details.rewardPool).to.equal(ethers.parseEther('0.1'))
      expect(details.createdAt).to.be.gt(0)
    })

    it('Should return empty details for non-existent contracts', async function () {
      const { contract } = await loadFixture(deployContractFixture)

      const nonExistentId = ethers.id('non-existent')
      const details = await contract.getContractDetails(nonExistentId)
      expect(details.fid).to.equal(0)
      expect(details.title).to.equal('')
      expect(details.description).to.equal('')
      expect(details.rewardPool).to.equal(0)
    })
  })
})
