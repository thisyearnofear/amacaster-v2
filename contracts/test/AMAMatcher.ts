import { expect } from 'chai'
import { ethers } from 'hardhat'
import { keccak256, toUtf8Bytes } from 'ethers'
import { AMAMatcher } from '../typechain-types'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'

describe('AMAMatcher', function () {
  let amaMatcher: AMAMatcher
  let owner: SignerWithAddress
  let user: SignerWithAddress
  let amaId: string
  let matchHashes: string[]
  let rankings: number[]

  beforeEach(async function () {
    ;[owner, user] = await ethers.getSigners()

    const AMAMatcher = await ethers.getContractFactory('AMAMatcher')
    amaMatcher = await AMAMatcher.deploy()
    await amaMatcher.waitForDeployment()

    // Create test data
    amaId = keccak256(toUtf8Bytes('test-ama'))
    matchHashes = [
      keccak256(toUtf8Bytes('match1')),
      keccak256(toUtf8Bytes('match2')),
    ]
    rankings = [0, 1]
  })

  describe('submitMatch', function () {
    it('should allow users to submit matches', async function () {
      await expect(
        amaMatcher.connect(user).submitMatch(amaId, matchHashes, rankings),
      )
        .to.emit(amaMatcher, 'MatchSubmitted')
        .withArgs(amaId, user.address, matchHashes, rankings)

      const match = await amaMatcher.getMatch(amaId, user.address)
      expect(match[0]).to.deep.equal(matchHashes)
      expect(match[1]).to.deep.equal(rankings)
    })

    it('should revert if AMA is already revealed', async function () {
      await amaMatcher.connect(owner).revealMatches(amaId, matchHashes)
      await expect(
        amaMatcher.connect(user).submitMatch(amaId, matchHashes, rankings),
      ).to.be.revertedWith('AMA already revealed')
    })
  })

  describe('revealMatches', function () {
    it('should allow owner to reveal matches', async function () {
      await expect(amaMatcher.connect(owner).revealMatches(amaId, matchHashes))
        .to.emit(amaMatcher, 'MatchRevealed')
        .withArgs(amaId, matchHashes)

      expect(await amaMatcher.isRevealed(amaId)).to.be.true
    })

    it('should revert if caller is not owner', async function () {
      await expect(
        amaMatcher.connect(user).revealMatches(amaId, matchHashes),
      ).to.be.revertedWithCustomError(amaMatcher, 'OwnableUnauthorizedAccount')
    })

    it('should revert if AMA is already revealed', async function () {
      await amaMatcher.connect(owner).revealMatches(amaId, matchHashes)
      await expect(
        amaMatcher.connect(owner).revealMatches(amaId, matchHashes),
      ).to.be.revertedWith('AMA already revealed')
    })
  })
})
