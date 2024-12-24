// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract AMAMatcher is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    enum MatchState { Draft, Finalized }

    struct MatchSubmission {
        bytes32 contentHash;      // IPFS hash or content hash of the actual matches
        bytes32 merkleRoot;       // Root of the merkle tree containing all matches
        uint256 timestamp;
        uint256 version;
        MatchState state;
        bool exists;
    }

    struct VersionMetadata {
        bytes32 contentHash;
        bytes32 merkleRoot;
        uint256 timestamp;
        uint256 version;
    }

    // Main storage for current submissions
    mapping(bytes32 => mapping(address => MatchSubmission)) public submissions;
    // History of all versions (stores only metadata)
    mapping(bytes32 => mapping(address => VersionMetadata[])) public submissionHistory;
    // Track if an AMA has been finalized by any user
    mapping(bytes32 => bool) public isAMAFinalized;
    // Store verified signatures to prevent replay
    mapping(bytes32 => bool) public usedSignatures;

    event MatchUpdated(
        bytes32 indexed amaId,
        address indexed submitter,
        bytes32 contentHash,
        bytes32 merkleRoot,
        uint256 version,
        MatchState state
    );

    event MatchFinalized(
        bytes32 indexed amaId,
        address indexed submitter,
        uint256 finalVersion
    );

    event MatchVerified(
        bytes32 indexed amaId,
        address indexed submitter,
        bytes32 matchHash
    );

    modifier submissionExists(bytes32 amaId) {
        require(submissions[amaId][msg.sender].exists, "No submission found");
        _;
    }

    modifier notFinalized(bytes32 amaId) {
        require(!isAMAFinalized[amaId], "AMA is finalized");
        require(
            submissions[amaId][msg.sender].state != MatchState.Finalized,
            "Match already finalized"
        );
        _;
    }

    function updateMatch(
        bytes32 amaId,
        bytes32 contentHash,
        bytes32 merkleRoot,
        bytes calldata signature
    ) external notFinalized(amaId) {
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(amaId, contentHash, merkleRoot));
        bytes32 signedHash = messageHash.toEthSignedMessageHash();
        address signer = signedHash.recover(signature);
        require(signer == msg.sender, "Invalid signature");
        require(!usedSignatures[signedHash], "Signature already used");
        usedSignatures[signedHash] = true;

        MatchSubmission storage userSubmission = submissions[amaId][msg.sender];
        uint256 newVersion = userSubmission.exists ? userSubmission.version + 1 : 0;

        // Store current version in history if it exists
        if (userSubmission.exists) {
            submissionHistory[amaId][msg.sender].push(VersionMetadata({
                contentHash: userSubmission.contentHash,
                merkleRoot: userSubmission.merkleRoot,
                timestamp: userSubmission.timestamp,
                version: userSubmission.version
            }));
        }

        // Update current submission
        userSubmission.contentHash = contentHash;
        userSubmission.merkleRoot = merkleRoot;
        userSubmission.timestamp = block.timestamp;
        userSubmission.version = newVersion;
        userSubmission.state = MatchState.Draft;
        userSubmission.exists = true;

        emit MatchUpdated(
            amaId,
            msg.sender,
            contentHash,
            merkleRoot,
            newVersion,
            MatchState.Draft
        );
    }

    function verifyMatch(
        bytes32 amaId,
        bytes32 matchHash,
        bytes32[] calldata merkleProof
    ) external submissionExists(amaId) returns (bool) {
        MatchSubmission storage submission = submissions[amaId][msg.sender];
        
        bool isValid = MerkleProof.verify(
            merkleProof,
            submission.merkleRoot,
            matchHash
        );

        if (isValid) {
            emit MatchVerified(amaId, msg.sender, matchHash);
        }

        return isValid;
    }

    function finalizeMatch(
        bytes32 amaId
    ) external submissionExists(amaId) notFinalized(amaId) {
        MatchSubmission storage submission = submissions[amaId][msg.sender];
        submission.state = MatchState.Finalized;
        isAMAFinalized[amaId] = true;

        emit MatchFinalized(amaId, msg.sender, submission.version);
    }

    function getCurrentSubmission(
        bytes32 amaId,
        address submitter
    ) external view returns (
        bytes32 contentHash,
        bytes32 merkleRoot,
        uint256 timestamp,
        uint256 version,
        MatchState state
    ) {
        require(submissions[amaId][submitter].exists, "No submission found");
        MatchSubmission storage submission = submissions[amaId][submitter];
        return (
            submission.contentHash,
            submission.merkleRoot,
            submission.timestamp,
            submission.version,
            submission.state
        );
    }

    function getSubmissionVersion(
        bytes32 amaId,
        address submitter,
        uint256 version
    ) external view returns (
        bytes32 contentHash,
        bytes32 merkleRoot,
        uint256 timestamp
    ) {
        require(
            version < submissionHistory[amaId][submitter].length,
            "Version not found"
        );
        VersionMetadata storage history = submissionHistory[amaId][submitter][version];
        return (
            history.contentHash,
            history.merkleRoot,
            history.timestamp
        );
    }

    function getSubmissionHistoryLength(
        bytes32 amaId,
        address submitter
    ) external view returns (uint256) {
        return submissionHistory[amaId][submitter].length;
    }

    function revealMatches(
        bytes32 amaId,
        bytes32 correctMatchesRoot
    ) external onlyOwner {
        require(isAMAFinalized[amaId], "AMA not finalized");
        // Store only the merkle root of correct matches
        // Individual matches can be verified using merkle proofs
    }
}

contract AMAIPCM is Ownable {
    string private cidMapping;
    
    constructor() {
        _transferOwnership(msg.sender);
    }
    
    event MappingUpdated(string value);
    
    function updateMapping(string memory value) public onlyOwner {
        cidMapping = value;
        emit MappingUpdated(value);
    }
    
    function getMapping() public view returns (string memory) {
        return cidMapping;
    }
} 