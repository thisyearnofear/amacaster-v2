// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract AMAContract is Ownable, ReentrancyGuard {
    using Math for uint256;

    // Core structures
    enum ContractState {
        Pending,    // Initial state after submission
        Active,     // Currently running
        Completed,  // Finished successfully
        Cancelled  // Cancelled by admin
    }

    struct ContractSubmission {
        uint256 fid;               // Creator's Farcaster ID
        string title;              // AMA title
        string description;        // AMA description
        uint256 startTime;         // Start timestamp
        uint256 endTime;          // End timestamp
        uint256 rewardPool;       // Total rewards available
        ContractState state;      // Current contract state
        uint256 participantCount; // Number of participants
        uint256 questionCount;    // Number of questions
        uint256 matchCount;       // Number of matches submitted
        uint256 minQualityScore; // Minimum quality score required
        uint256 createdAt;       // Creation timestamp
    }

    struct ParticipationMetrics {
        uint96 score;          // Quality-weighted score
        uint96 matchCount;     // Number of matches
        uint32 timestamp;      // Last participation
        uint16 qualityRatio;  // 0-10000 (2 decimal precision)
        uint8 flags;          // Status flags
    }

    struct UserReputation {
        uint256 baseScore;          // Raw participation score
        uint256 qualityMultiplier;  // Based on historical accuracy
        uint256 effectiveScore;     // baseScore * qualityMultiplier / 100
        uint256 cooldownPeriod;     // Dynamic rate limiting
        uint256 lastUpdate;         // Last update timestamp
    }

    // Constants
    uint256 private constant QUALITY_PRECISION = 10000;
    uint256 private constant MIN_QUALITY_THRESHOLD = 7000; // 70%
    uint256 private constant BASE_COOLDOWN = 1 hours;
    uint256 private constant MAX_QUESTIONS_PER_USER = 3;
    uint256 private constant EARLY_PARTICIPATION_WINDOW = 1 days;

    // Storage
    mapping(bytes32 => ContractSubmission) public contracts;
    mapping(uint256 => bytes32[]) public userContracts;  // fid => contract IDs
    mapping(address => UserReputation) public userReputations;  // address => reputation
    mapping(bytes32 => mapping(address => ParticipationMetrics)) public contractParticipation;  // contractId => address => metrics
    mapping(address => uint256) public userFids;  // address => fid

    // Events
    event ContractSubmitted(bytes32 indexed contractId, uint256 indexed fid, string title);
    event ContractStateUpdated(bytes32 indexed contractId, ContractState state);
    event ParticipationRecorded(bytes32 indexed contractId, uint256 indexed fid, uint256 score);
    event ReputationUpdated(uint256 indexed fid, uint256 newScore, uint256 qualityMultiplier);
    event FidRegistered(address indexed user, uint256 indexed fid);

    constructor() {}

    // Modifiers
    modifier onlyValidState(bytes32 contractId, ContractState requiredState) {
        require(contracts[contractId].state == requiredState, "Invalid contract state");
        _;
    }

    modifier rateLimit() {
        UserReputation storage rep = userReputations[msg.sender];
        require(block.timestamp >= rep.cooldownPeriod, "Rate limited");
        rep.cooldownPeriod = block.timestamp + calculateCooldown(rep.effectiveScore);
        _;
    }

    // Core functions
    function submitContract(
        string calldata title,
        string calldata description,
        uint256 startTime,
        uint256 endTime,
        uint256 minQualityScore
    ) external payable returns (bytes32) {
        require(startTime > block.timestamp, "Invalid start time");
        require(endTime > startTime, "Invalid end time");
        require(msg.value > 0, "Reward pool required");
        require(userFids[msg.sender] != 0, "FID not registered");

        bytes32 contractId = keccak256(
            abi.encodePacked(
                msg.sender,
                title,
                block.timestamp
            )
        );

        ContractSubmission memory newContract = ContractSubmission({
            fid: userFids[msg.sender],
            title: title,
            description: description,
            startTime: startTime,
            endTime: endTime,
            rewardPool: msg.value,
            state: ContractState.Pending,
            participantCount: 0,
            questionCount: 0,
            matchCount: 0,
            minQualityScore: minQualityScore,
            createdAt: block.timestamp
        });

        contracts[contractId] = newContract;
        userContracts[userFids[msg.sender]].push(contractId);
        
        emit ContractSubmitted(contractId, userFids[msg.sender], title);

        return contractId;
    }

    function registerFid(uint256 fid) external {
        require(userFids[msg.sender] == 0, "FID already registered");
        require(fid > 0, "Invalid FID");
        userFids[msg.sender] = fid;
        emit FidRegistered(msg.sender, fid);
    }

    function participate(
        bytes32 contractId,
        bytes32[] calldata matches,
        uint256[] calldata rankings
    ) external rateLimit {
        ContractSubmission storage contract_ = contracts[contractId];
        UserReputation storage rep = userReputations[msg.sender];
        
        require(userFids[msg.sender] != 0, "FID not registered");
        require(
            rep.effectiveScore >= contract_.minQualityScore,
            "Insufficient quality score"
        );

        uint256 score = processParticipation(
            contractId,
            msg.sender,
            matches,
            rankings
        );

        updateReputation(msg.sender, score);

        emit ParticipationRecorded(contractId, userFids[msg.sender], score);
    }

    // Internal functions
    function processParticipation(
        bytes32 contractId,
        address participant,
        bytes32[] calldata matches,
        uint256[] calldata rankings
    ) internal returns (uint256) {
        ParticipationMetrics storage metrics = contractParticipation[contractId][participant];
        
        uint256 score = calculateParticipationScore(
            matches.length,
            rankings,
            block.timestamp,
            contracts[contractId].startTime
        );

        metrics.score = uint96(score);
        metrics.matchCount += uint96(matches.length);
        metrics.timestamp = uint32(block.timestamp);
        metrics.qualityRatio = uint16(
            (score * QUALITY_PRECISION) / Math.max(1, metrics.matchCount)
        );

        return score;
    }

    function updateReputation(address participant, uint256 newScore) internal {
        UserReputation storage rep = userReputations[participant];
        
        rep.baseScore = rep.baseScore + newScore;
        uint256 newMultiplier = calculateQualityMultiplier(participant);
        rep.qualityMultiplier = newMultiplier;
        rep.effectiveScore = (rep.baseScore * rep.qualityMultiplier) / QUALITY_PRECISION;
        rep.lastUpdate = block.timestamp;

        emit ReputationUpdated(userFids[participant], rep.baseScore, rep.qualityMultiplier);
    }

    // Helper functions
    function calculateParticipationScore(
        uint256 matchCount,
        uint256[] calldata rankings,
        uint256 timestamp,
        uint256 startTime
    ) internal pure returns (uint256) {
        uint256 score = matchCount * 100;
        
        if (timestamp <= startTime + EARLY_PARTICIPATION_WINDOW) {
            score = score * 120 / 100; // 20% bonus
        }
        
        for (uint256 i = 0; i < rankings.length; i++) {
            if (rankings[i] < 3) { // Top 3 ranking
                score = score * 110 / 100; // 10% bonus per top ranking
            }
        }
        
        return score;
    }

    function calculateQualityMultiplier(address participant) internal view returns (uint256) {
        ParticipationMetrics memory metrics = contractParticipation[bytes32(0)][participant];
        
        if (metrics.matchCount == 0) return QUALITY_PRECISION;
        
        return Math.max(
            MIN_QUALITY_THRESHOLD,
            metrics.qualityRatio
        );
    }

    function calculateCooldown(uint256 effectiveScore) internal pure returns (uint256) {
        if (effectiveScore >= 10000) return BASE_COOLDOWN / 4;
        if (effectiveScore >= 5000) return BASE_COOLDOWN / 2;
        return BASE_COOLDOWN;
    }

    // View functions
    function getContractDetails(bytes32 contractId) 
        external 
        view 
        returns (ContractSubmission memory) 
    {
        return contracts[contractId];
    }

    function getUserContracts(uint256 fid) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return userContracts[fid];
    }

    function getUserReputation(address user) 
        external 
        view 
        returns (UserReputation memory) 
    {
        return userReputations[user];
    }
} 