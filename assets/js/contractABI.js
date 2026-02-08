// Smart Contract ABI
// Replace this with your actual contract ABI

const CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "_vnttToken", "type": "address"},
            {"internalType": "address", "name": "_usdtToken", "type": "address"},
            {"internalType": "address", "name": "_vntToken", "type": "address"},
            {"internalType": "address", "name": "_feeWallet", "type": "address"}
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
            {"indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256"},
            {"indexed": false, "internalType": "bool", "name": "paidWithVNT", "type": "bool"}
        ],
        "name": "Withdrawn",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256"}
        ],
        "name": "UserActivated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "DailyClaimed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
            {"indexed": true, "internalType": "address", "name": "upline", "type": "address"}
        ],
        "name": "UserRegistered",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "activate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "upline", "type": "address"}
        ],
        "name": "register",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "dailyClaim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "taskId", "type": "uint256"}
        ],
        "name": "completeSocialTask",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "amount", "type": "uint256"},
            {"internalType": "bool", "name": "payWithVNT", "type": "bool"}
        ],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "user", "type": "address"}
        ],
        "name": "getUserBasicInfo",
        "outputs": [
            {"internalType": "address", "name": "upline", "type": "address"},
            {"internalType": "bool", "name": "isActive", "type": "bool"},
            {"internalType": "uint256", "name": "joinTime", "type": "uint256"},
            {"internalType": "uint256", "name": "activationTime", "type": "uint256"},
            {"internalType": "uint256", "name": "totalEarned", "type": "uint256"},
            {"internalType": "uint256", "name": "totalWithdrawn", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "user", "type": "address"}
        ],
        "name": "getUserAdvancedInfo",
        "outputs": [
            {"internalType": "uint256", "name": "lockedTokens", "type": "uint256"},
            {"internalType": "uint256", "name": "lastClaimTime", "type": "uint256"},
            {"internalType": "uint256", "name": "directReferrals", "type": "uint256"},
            {"internalType": "bool", "name": "hasPaidActivation", "type": "bool"},
            {"internalType": "uint256", "name": "userTasksCompleted", "type": "uint256"},
            {"internalType": "uint256", "name": "claimedToday", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "activationFee",
        "outputs": [
            {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "dailyReward",
        "outputs": [
            {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "withdrawalFee",
        "outputs": [
            {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "projectDuration",
        "outputs": [
            {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "user", "type": "address"}
        ],
        "name": "getAvailableWithdrawal",
        "outputs": [
            {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Contract Addresses (Update these with your actual addresses)
const CONTRACT_ADDRESSES = {
    mainnet: "YOUR_CONTRACT_ADDRESS_HERE",
    testnet: "TESTNET_CONTRACT_ADDRESS_HERE"
};

// Export ABI for use in other files
window.CONTRACT_ABI = CONTRACT_ABI;
window.CONTRACT_ADDRESSES = CONTRACT_ADDRESSES;