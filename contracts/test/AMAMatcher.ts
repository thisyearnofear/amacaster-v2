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
  let contentHash: string
  let merkleRoot: string

  beforeEach(async function () {
    ;[owner, user] = await ethers.getSigners()

    const AMAMatcher = await ethers.getContractFactory('AMAMatcher')
    amaMatcher = await AMAMatcher.deploy()
    await amaMatcher.waitForDeployment()

    // Create test data
    amaId = keccak256(toUtf8Bytes('test-ama'))
    contentHash = keccak256(toUtf8Bytes('content'))
    merkleRoot = keccak256(toUtf8Bytes('merkle-root'))
  })

  describe('updateMatch', function () {
    it('should allow users to submit matches', async function () {
      // Create signature
      const messageHash = keccak256(
        ethers.solidityPacked(
          ['bytes32', 'bytes32', 'bytes32'],
          [amaId, contentHash, merkleRoot],
        ),
      )
      const signature = await user.signMessage(ethers.getBytes(messageHash))

      await expect(
        amaMatcher
          .connect(user)
          .updateMatch(amaId, contentHash, merkleRoot, signature),
      )
        .to.emit(amaMatcher, 'MatchUpdated')
        .withArgs(amaId, user.address, contentHash, merkleRoot, 0, 0) // version 0, state Draft

      const submission = await amaMatcher.getCurrentSubmission(
        amaId,
        user.address,
      )
      expect(submission[0]).to.equal(contentHash) // contentHash
      expect(submission[1]).to.equal(merkleRoot) // merkleRoot
      expect(submission[3]).to.equal(0n) // version
      expect(submission[4]).to.equal(0) // state Draft
    })

    it('should revert if AMA is finalized', async function () {
      // First submission
      const messageHash = keccak256(
        ethers.solidityPacked(
          ['bytes32', 'bytes32', 'bytes32'],
          [amaId, contentHash, merkleRoot],
        ),
      )
      const signature = await user.signMessage(ethers.getBytes(messageHash))
      await amaMatcher
        .connect(user)
        .updateMatch(amaId, contentHash, merkleRoot, signature)

      // Finalize the match
      await amaMatcher.connect(user).finalizeMatch(amaId)

      // Try to update after finalization
      const newContentHash = keccak256(toUtf8Bytes('new-content'))
      const newMerkleRoot = keccak256(toUtf8Bytes('new-merkle-root'))
      const newMessageHash = keccak256(
        ethers.solidityPacked(
          ['bytes32', 'bytes32', 'bytes32'],
          [amaId, newContentHash, newMerkleRoot],
        ),
      )
      const newSignature = await user.signMessage(
        ethers.getBytes(newMessageHash),
      )

      await expect(
        amaMatcher
          .connect(user)
          .updateMatch(amaId, newContentHash, newMerkleRoot, newSignature),
      ).to.be.revertedWith('AMA is finalized')
    })
  })

  describe('revealMatches', function () {
    it('should allow owner to reveal matches', async function () {
      // First submit and finalize a match
      const messageHash = keccak256(
        ethers.solidityPacked(
          ['bytes32', 'bytes32', 'bytes32'],
          [amaId, contentHash, merkleRoot],
        ),
      )
      const signature = await user.signMessage(ethers.getBytes(messageHash))
      await amaMatcher
        .connect(user)
        .updateMatch(amaId, contentHash, merkleRoot, signature)
      await amaMatcher.connect(user).finalizeMatch(amaId)

      // Reveal matches
      const correctMatchesRoot = keccak256(toUtf8Bytes('correct-matches'))
      await amaMatcher.connect(owner).revealMatches(amaId, correctMatchesRoot)
    })

    it('should revert if caller is not owner', async function () {
      const correctMatchesRoot = keccak256(toUtf8Bytes('correct-matches'))
      await expect(
        amaMatcher.connect(user).revealMatches(amaId, correctMatchesRoot),
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should revert if AMA is not finalized', async function () {
      const correctMatchesRoot = keccak256(toUtf8Bytes('correct-matches'))
      await expect(
        amaMatcher.connect(owner).revealMatches(amaId, correctMatchesRoot),
      ).to.be.revertedWith('AMA not finalized')
    })
  })
})
