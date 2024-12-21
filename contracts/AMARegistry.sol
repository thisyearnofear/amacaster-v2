// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AMARegistry is Ownable {
    struct AMAEntry {
        uint256 questionId;
        uint256 rank;
        uint256 timestamp;
    }

    mapping(address => mapping(uint256 => AMAEntry)) public userRankings;
    mapping(address => uint256) public userRankingCount;

    event RankingUpdated(
        address indexed user,
        uint256 indexed questionId,
        uint256 rank,
        uint256 timestamp
    );

    constructor() Ownable(msg.sender) {}

    function updateRanking(uint256 questionId, uint256 rank) external {
        uint256 count = userRankingCount[msg.sender];
        userRankings[msg.sender][count] = AMAEntry({
            questionId: questionId,
            rank: rank,
            timestamp: block.timestamp
        });
        userRankingCount[msg.sender]++;

        emit RankingUpdated(msg.sender, questionId, rank, block.timestamp);
    }

    function getRankings(address user) external view returns (AMAEntry[] memory) {
        uint256 count = userRankingCount[user];
        AMAEntry[] memory rankings = new AMAEntry[](count);
        
        for (uint256 i = 0; i < count; i++) {
            rankings[i] = userRankings[user][i];
        }
        
        return rankings;
    }
} 