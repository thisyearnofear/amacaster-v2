// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract UserProfile is Ownable, ReentrancyGuard {
    struct Profile {
        uint256 fid;                // Farcaster ID
        address walletAddress;      // User's wallet address
        uint256 matchesSubmitted;   // Total number of matches submitted
        uint256 totalScore;         // Cumulative score from matches
        uint256 achievementFlags;   // Bitfield for achievements
        uint256 lastUpdated;        // Last update timestamp
    }

    mapping(uint256 => Profile) public profilesByFid;       // FID -> Profile
    mapping(address => uint256) public fidByAddress;        // Wallet -> FID
    
    event ProfileCreated(uint256 indexed fid, address indexed walletAddress);
    event ProfileUpdated(uint256 indexed fid, uint256 matchesSubmitted, uint256 totalScore);
    event AchievementUnlocked(uint256 indexed fid, uint256 achievementId);

    constructor() {}

    function createProfile(uint256 _fid) external {
        require(fidByAddress[msg.sender] == 0, "Profile already exists");
        require(profilesByFid[_fid].fid == 0, "FID already registered");
        
        Profile memory newProfile = Profile({
            fid: _fid,
            walletAddress: msg.sender,
            matchesSubmitted: 0,
            totalScore: 0,
            achievementFlags: 0,
            lastUpdated: block.timestamp
        });
        
        profilesByFid[_fid] = newProfile;
        fidByAddress[msg.sender] = _fid;
        
        emit ProfileCreated(_fid, msg.sender);
    }

    function updateProfile(uint256 _matchesSubmitted, uint256 _score) external {
        uint256 fid = fidByAddress[msg.sender];
        require(fid != 0, "Profile not found");
        
        Profile storage profile = profilesByFid[fid];
        profile.matchesSubmitted = _matchesSubmitted;
        profile.totalScore = _score;
        profile.lastUpdated = block.timestamp;
        
        emit ProfileUpdated(fid, _matchesSubmitted, _score);
        
        // Check and award achievements
        checkAndAwardAchievements(fid);
    }

    function getProfile(uint256 _fid) external view returns (Profile memory) {
        require(profilesByFid[_fid].fid != 0, "Profile not found");
        return profilesByFid[_fid];
    }

    function getProfileByAddress(address _address) external view returns (Profile memory) {
        uint256 fid = fidByAddress[_address];
        require(fid != 0, "Profile not found");
        return profilesByFid[fid];
    }

    function checkAndAwardAchievements(uint256 _fid) internal {
        Profile storage profile = profilesByFid[_fid];
        
        // Achievement 1: First Match Submitted
        if (profile.matchesSubmitted >= 1 && (profile.achievementFlags & 1) == 0) {
            profile.achievementFlags |= 1;
            emit AchievementUnlocked(_fid, 1);
        }
        
        // Achievement 2: 10 Matches Submitted
        if (profile.matchesSubmitted >= 10 && (profile.achievementFlags & 2) == 0) {
            profile.achievementFlags |= 2;
            emit AchievementUnlocked(_fid, 2);
        }
        
        // Achievement 3: Score over 100
        if (profile.totalScore >= 100 && (profile.achievementFlags & 4) == 0) {
            profile.achievementFlags |= 4;
            emit AchievementUnlocked(_fid, 3);
        }
    }
} 