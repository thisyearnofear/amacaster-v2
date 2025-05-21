# Paired & Remix Minting Modes: Vision and Implementation Plan

## Concept Overview

Amacast enables two distinct modes for engaging with AMA Q&A pairs:

### 1. Legitimate Paired Mode
- **Purpose:** Users mint the canonical, original Q&A pairs as a signal of value, endorsement, or curation.
- **Scarcity:** Each unique Q&A pair can only be minted once as a "legit" NFT (with optional limited editions for popular pairs).
- **Editions:** Others can mint editions of a top pairing, similar to NFT editions (e.g., 1/100).
- **Signaling:** Minting a legit pair is a strong social signal and can serve as a building block for prediction markets, collections, or leaderboards.
- **UI/UX:**
  - Pairs are shown in their original, correct order and are locked (cannot be changed).
  - Mint button is enabled only if the pair is available.
  - Edition count and ownership are displayed.
  - Already-minted pairs are visually indicated.

### 2. Remix (Matching) Mode
- **Purpose:** Users can mix and match questions and answers for fun, creativity, or comic effect.
- **Transparency:** Remix NFTs are clearly marked as "spoof" or "remix" and are visually distinct from legit pairs.
- **Scarcity:** No scarcity or a different scarcity model (e.g., unlimited or capped editions).
- **UI/UX:**
  - Users can drag/drop or otherwise mix Qs and As.
  - Mint button is always enabled.
  - Warning or badge indicates this is a remix, not a legit pair.

## Technical/Smart Contract Considerations

- **Legit NFTs:**
  - Each Q&A pair (by hash or ID) can only be minted once as a legit NFT.
  - Editions are tracked and limited per pair.
  - Metadata includes `legitimate: true`, `pairHash`, `editionNumber`.
- **Remix NFTs:**
  - Metadata includes `legitimate: false`, `remix: true`, `creator`.
- **Minting Logic:**
  - On mint, check if the pairHash is already minted as legit.
  - For editions, check if the edition cap is reached.

## Social & Collectible Layer
- **Leaderboard:** Top minted pairs, edition counts, and owners.
- **Profile:** User's legit and remix mints.
- **Sharing:** Easy sharing to Farcaster, Twitter, etc.

## Future: Farcaster Frame/Mini App
- Same logic, simplified UI for Farcaster.
- Users can view, endorse, or mint pairs directly from Farcaster.

## Next Steps: Ensuring High Accuracy in Legitimate Paired Mode

- **Challenge:** Some answers are multi-part or span multiple responses.
- **Goal:** Ensure that in paired mode, the canonical Q&A pairs accurately reflect the intended, complete answer(s) for each question.
- **Approach:**
  1. **Data Model:**
     - Allow a question to be paired with an array of answers (not just one).
     - Store all answer parts as a single logical pairing for minting and display.
  2. **UI/UX:**
     - In paired mode, display all answer parts together under their question.
     - Lock the grouping so users cannot split or rearrange multi-part answers.
  3. **Minting:**
     - The pairHash should be generated from the question and all associated answer parts.
     - Only the complete, canonical grouping can be minted as a legit NFT.
  4. **Verification:**
     - When displaying or verifying a legit pair, always show all answer parts.
     - Editions and ownership are tracked at the group level.

---

This plan ensures both high-integrity curation and creative remixing, with clear social and collectible signals for each mode.
