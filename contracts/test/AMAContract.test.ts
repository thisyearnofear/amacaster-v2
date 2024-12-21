import { expect } from 'chai'
import { ethers } from 'hardhat'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { AMAContract } from '../typechain-types'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'

describe('AMAContract', () => {
  let amaContract: AMAContract
  let owner: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress
  let user3: SignerWithAddress

  // Test constants
  const ONE_HOUR = 3600
  const ONE_DAY = ONE_HOUR * 24
  const QUALITY_PRECISION = 10000
  const MIN_QUALITY_THRESHOLD = 7000
  const BASE_COOLDOWN = ONE_HOUR

  beforeEach(async () => {
    ;[owner, user1, user2, user3] = await ethers.getSigners()

    const AMAContract = await ethers.getContractFactory('AMAContract')
    amaContract = (await AMAContract.deploy()) as AMAContract

    // Register FIDs for testing
    await amaContract.connect(user1).registerFid(1)
    await amaContract.connect(user2).registerFid(2)
    await amaContract.connect(user3).registerFid(3)
  })

  describe('Anti-Spam Mechanisms', () => {
    describe('Rate Limiting', () => {
      let contractId: string

      beforeEach(async () => {
        // Create a standard test contract
        const startTime = (await time.latest()) + ONE_HOUR
        const endTime = startTime + ONE_DAY

        const tx = await amaContract
          .connect(user1)
          .submitContract(
            'Rate Limit Test AMA',
            'Test Description',
            BigInt(startTime),
            BigInt(endTime),
            7000,
            { value: ethers.parseEther('0.1') },
          )
        const receipt = await tx.wait()
        if (!receipt) throw new Error('No receipt')

        const event = receipt.logs.find((log) => {
          if ('topics' in log) {
            return (
              log.topics[0] ===
              amaContract.interface.getEvent('ContractSubmitted').topicHash
            )
          }
          return false
        })
        if (!event?.topics[1]) throw new Error('No contract ID in event')
        contractId = event.topics[1]
      })

      it('should enforce base cooldown for new users', async () => {
        // First participation
        await amaContract
          .connect(user2)
          .participate(contractId, [ethers.randomBytes(32)], [BigInt(1)])

        // Try immediate second participation
        await expect(
          amaContract
            .connect(user2)
            .participate(contractId, [ethers.randomBytes(32)], [BigInt(1)]),
        ).to.be.revertedWith('Rate limited')

        // Wait just under base cooldown
        await time.increase(BASE_COOLDOWN - 60)
        await expect(
          amaContract
            .connect(user2)
            .participate(contractId, [ethers.randomBytes(32)], [BigInt(1)]),
        ).to.be.revertedWith('Rate limited')

        // Wait remaining time
        await time.increase(60)
        await amaContract
          .connect(user2)
          .participate(contractId, [ethers.randomBytes(32)], [BigInt(1)])
      })

      it('should reduce cooldown for high reputation users', async () => {
        // Build up reputation
        for (let i = 0; i < 5; i++) {
          await amaContract
            .connect(user2)
            .participate(
              contractId,
              [ethers.randomBytes(32), ethers.randomBytes(32)],
              [BigInt(1), BigInt(2)],
            )
          await time.increase(BASE_COOLDOWN)
        }

        // Get current reputation
        const reputation = await amaContract.getUserReputation(
          await user2.getAddress(),
        )
        expect(reputation.effectiveScore).to.be.gt(5000)

        // Test reduced cooldown
        await amaContract
          .connect(user2)
          .participate(contractId, [ethers.randomBytes(32)], [BigInt(1)])

        // Wait reduced cooldown time
        await time.increase(BASE_COOLDOWN / 2)
        await amaContract
          .connect(user2)
          .participate(contractId, [ethers.randomBytes(32)], [BigInt(1)])
      })

      it('should handle multiple users with different cooldowns', async () => {
        // User2 builds reputation
        for (let i = 0; i < 5; i++) {
          await amaContract
            .connect(user2)
            .participate(contractId, [ethers.randomBytes(32)], [BigInt(1)])
          await time.increase(BASE_COOLDOWN)
        }

        // User3 is new
        await amaContract
          .connect(user3)
          .participate(contractId, [ethers.randomBytes(32)], [BigInt(1)])

        // Wait half base cooldown
        await time.increase(BASE_COOLDOWN / 2)

        // User2 should be able to participate again
        await amaContract
          .connect(user2)
          .participate(contractId, [ethers.randomBytes(32)], [BigInt(1)])

        // User3 should still be rate limited
        await expect(
          amaContract
            .connect(user3)
            .participate(contractId, [ethers.randomBytes(32)], [BigInt(1)]),
        ).to.be.revertedWith('Rate limited')
      })
    })

    describe('Quality Thresholds', () => {
      it('should enforce minimum quality score for participation', async () => {
        // Create a contract with high quality threshold
        const startTime = (await time.latest()) + ONE_HOUR
        const endTime = startTime + ONE_DAY

        const tx = await amaContract.connect(user1).submitContract(
          'High Quality AMA',
          'Test Description',
          BigInt(startTime),
          BigInt(endTime),
          9000, // High quality threshold
          { value: ethers.parseEther('0.1') },
        )
        const receipt = await tx.wait()
        if (!receipt) throw new Error('No receipt')

        const event = receipt.logs.find((log) => {
          if ('topics' in log) {
            return (
              log.topics[0] ===
              amaContract.interface.getEvent('ContractSubmitted').topicHash
            )
          }
          return false
        })
        if (!event?.topics[1]) throw new Error('No contract ID in event')
        const contractId = event.topics[1]

        // New user with no reputation should be rejected
        await expect(
          amaContract
            .connect(user2)
            .participate(contractId, [ethers.randomBytes(32)], [BigInt(1)]),
        ).to.be.revertedWith('Insufficient quality score')
      })

      it('should maintain quality ratio in participation metrics', async () => {
        // Create a contract
        const startTime = (await time.latest()) + ONE_HOUR
        const endTime = startTime + ONE_DAY

        const tx = await amaContract
          .connect(user1)
          .submitContract(
            'Test AMA',
            'Test Description',
            BigInt(startTime),
            BigInt(endTime),
            7000,
            { value: ethers.parseEther('0.1') },
          )
        const receipt = await tx.wait()
        if (!receipt) throw new Error('No receipt')

        const event = receipt.logs.find((log) => {
          if ('topics' in log) {
            return (
              log.topics[0] ===
              amaContract.interface.getEvent('ContractSubmitted').topicHash
            )
          }
          return false
        })
        if (!event?.topics[1]) throw new Error('No contract ID in event')
        const contractId = event.topics[1]

        // Participate with good matches
        await amaContract
          .connect(user2)
          .participate(
            contractId,
            [ethers.randomBytes(32), ethers.randomBytes(32)],
            [BigInt(1), BigInt(2)],
          )

        // Check participation metrics
        const metrics = await amaContract.contractParticipation(
          contractId,
          await user2.getAddress(),
        )
        expect(metrics.qualityRatio).to.be.gte(MIN_QUALITY_THRESHOLD)
      })
    })
  })
})
