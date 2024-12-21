// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract AMAMatcher is Ownable {
    using ECDSA for bytes32;

    // Events
    event MatchSubmitted(bytes32 indexed amaId, address indexed submitter, bytes32[] matchHashes, uint256[] rankings);
    event MatchRevealed(bytes32 indexed amaId, bytes32[] correctMatches);
    
    // Structs
    struct Match {
        bytes32[] matchHashes;
        uint256[] rankings;
        uint256 timestamp;
    }

    // State variables
    mapping(bytes32 => mapping(address => Match)) public matches;
    mapping(bytes32 => bytes32[]) public revealedMatches;
    mapping(bytes32 => bool) public isRevealed;

    constructor() Ownable(msg.sender) {}

    function submitMatch(
        bytes32 amaId,
        bytes32[] calldata matchHashes,
        uint256[] calldata rankings
    ) external {
        require(!isRevealed[amaId], "AMA already revealed");
        require(matchHashes.length == rankings.length, "Length mismatch");
        
        matches[amaId][msg.sender] = Match({
            matchHashes: matchHashes,
            rankings: rankings,
            timestamp: block.timestamp
        });

        emit MatchSubmitted(amaId, msg.sender, matchHashes, rankings);
    }

    function revealMatches(
        bytes32 amaId,
        bytes32[] calldata correctMatches
    ) external onlyOwner {
        require(!isRevealed[amaId], "AMA already revealed");
        
        revealedMatches[amaId] = correctMatches;
        isRevealed[amaId] = true;

        emit MatchRevealed(amaId, correctMatches);
    }

    function getMatch(bytes32 amaId, address submitter) external view returns (
        bytes32[] memory matchHashes,
        uint256[] memory rankings,
        uint256 timestamp
    ) {
        Match memory match = matches[amaId][submitter];
        return (match.matchHashes, match.rankings, match.timestamp);
    }
} 