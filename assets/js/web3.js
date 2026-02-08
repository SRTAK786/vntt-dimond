// Web3 Configuration
const CONFIG = {
    contractAddress: "YOUR_CONTRACT_ADDRESS", // Replace with your contract address
    vnttTokenAddress: "YOUR_VNTT_TOKEN_ADDRESS",
    usdtTokenAddress: "0x55d398326f99059fF775485246999027B3197955", // BSC USDT
    vntTokenAddress: "YOUR_VNT_TOKEN_ADDRESS",
    chainId: "56", // BSC Mainnet
    rpcUrl: "https://bsc-dataseed.binance.org/",
    networkName: "Binance Smart Chain",
    nativeCurrency: {
        name: "BNB",
        symbol: "BNB",
        decimals: 18
    },
    blockExplorer: "https://bscscan.com/"
};

// ERC20 ABI (Standard Token Interface)
const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_spender", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {"name": "_owner", "type": "address"},
            {"name": "_spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_from", "type": "address"},
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transferFrom",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "name": "owner", "type": "address"},
            {"indexed": true, "name": "spender", "type": "address"},
            {"indexed": false, "name": "value", "type": "uint256"}
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "name": "from", "type": "address"},
            {"indexed": true, "name": "to", "type": "address"},
            {"indexed": false, "name": "value", "type": "uint256"}
        ],
        "name": "Transfer",
        "type": "event"
    }
];

// Initialize Web3
let web3;
let contract;
let userAddress;

// Initialize Web3 Provider
async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        // Modern dapp browsers
        web3 = new Web3(window.ethereum);
        try {
            // Request account access if needed
            await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error) {
            console.error("User denied account access");
        }
    } else if (typeof window.web3 !== 'undefined') {
        // Legacy dapp browsers
        web3 = new Web3(window.web3.currentProvider);
    } else {
        // Fallback - use public node
        web3 = new Web3(new Web3.providers.HttpProvider(CONFIG.rpcUrl));
    }
    
    return web3;
}

// Get Contract Instance
async function getContract() {
    if (!web3) {
        await initWeb3();
    }
    
    try {
        // Load contract ABI from file
        const response = await fetch('assets/js/contractABI.js');
        const contractABI = await response.json();
        
        contract = new web3.eth.Contract(
            contractABI,
            CONFIG.contractAddress
        );
        
        return contract;
    } catch (error) {
        console.error('Error loading contract:', error);
        return null;
    }
}

// Check Wallet Connection
async function checkConnection() {
    if (!web3) {
        await initWeb3();
    }
    
    try {
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
            userAddress = accounts[0];
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking connection:', error);
        return false;
    }
}

// Get Token Balance
async function getTokenBalance(tokenAddress, userAddress) {
    try {
        const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
        const balance = await tokenContract.methods.balanceOf(userAddress).call();
        const decimals = await tokenContract.methods.decimals().call();
        
        return balance / Math.pow(10, decimals);
    } catch (error) {
        console.error('Error getting token balance:', error);
        return 0;
    }
}

// Approve Tokens
async function approveTokens(tokenAddress, spender, amount) {
    try {
        const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
        const decimals = await tokenContract.methods.decimals().call();
        const amountInWei = amount * Math.pow(10, decimals);
        
        const tx = await tokenContract.methods
            .approve(spender, amountInWei)
            .send({ from: userAddress });
        
        return tx;
    } catch (error) {
        console.error('Error approving tokens:', error);
        throw error;
    }
}

// Check Network
async function checkNetwork() {
    if (!web3) {
        await initWeb3();
    }
    
    try {
        const chainId = await web3.eth.getChainId();
        return chainId.toString() === CONFIG.chainId;
    } catch (error) {
        console.error('Error checking network:', error);
        return false;
    }
}

// Switch to BSC Network
async function switchToBSC() {
    if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask or Trust Wallet');
    }
    
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${parseInt(CONFIG.chainId).toString(16)}` }]
        });
        return true;
    } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: `0x${parseInt(CONFIG.chainId).toString(16)}`,
                        chainName: CONFIG.networkName,
                        nativeCurrency: CONFIG.nativeCurrency,
                        rpcUrls: [CONFIG.rpcUrl],
                        blockExplorerUrls: [CONFIG.blockExplorer]
                    }]
                });
                return true;
            } catch (addError) {
                throw new Error('Failed to add network: ' + addError.message);
            }
        }
        throw new Error('Failed to switch network: ' + switchError.message);
    }
}

// Send Transaction
async function sendTransaction(to, value, data = '0x') {
    if (!web3) {
        await initWeb3();
    }
    
    if (!userAddress) {
        throw new Error('Please connect wallet first');
    }
    
    try {
        const tx = {
            from: userAddress,
            to: to,
            value: web3.utils.toWei(value.toString(), 'ether'),
            data: data
        };
        
        const gas = await web3.eth.estimateGas(tx);
        tx.gas = gas;
        
        const result = await web3.eth.sendTransaction(tx);
        return result;
    } catch (error) {
        console.error('Error sending transaction:', error);
        throw error;
    }
}

// Get Gas Price
async function getGasPrice() {
    if (!web3) {
        await initWeb3();
    }
    
    try {
        const gasPrice = await web3.eth.getGasPrice();
        return web3.utils.fromWei(gasPrice, 'gwei');
    } catch (error) {
        console.error('Error getting gas price:', error);
        return '0';
    }
}

// Format Address
function formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Export functions for use in main.js
window.Web3Utils = {
    initWeb3,
    getContract,
    checkConnection,
    getTokenBalance,
    approveTokens,
    checkNetwork,
    switchToBSC,
    sendTransaction,
    getGasPrice,
    formatAddress,
    CONFIG,
    ERC20_ABI
};