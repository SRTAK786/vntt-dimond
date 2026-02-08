// Main Application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Global Variables
let currentUser = null;
let userData = {
    walletAddress: null,
    isRegistered: false,
    isActive: false,
    totalEarned: 0,
    lockedTokens: 0,
    directReferrals: 0,
    completedTasks: 0,
    activationTime: null,
    dailyClaims: 0
};

// Initialize Application
function initializeApp() {
    setupEventListeners();
    checkWalletConnection();
    loadTasks();
    loadReferralLevels();
    startTimers();
    updateUI();
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
            
            // Update active state
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Quick Actions
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            showPage(page);
        });
    });

    // Connect Wallet Button
    document.getElementById('connectWalletBtn').addEventListener('click', showWalletModal);

    // Wallet Modal
    document.querySelectorAll('.wallet-option').forEach(option => {
        option.addEventListener('click', function() {
            const wallet = this.getAttribute('data-wallet');
            connectWallet(wallet);
        });
    });

    // Close Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });

    // Register Button
    document.getElementById('registerBtn').addEventListener('click', registerUser);

    // Activate Button
    document.getElementById('activateBtn').addEventListener('click', activateAccount);

    // Daily Claim Button
    document.getElementById('dailyClaimBtn').addEventListener('click', dailyClaim);

    // Withdraw Button
    document.getElementById('withdrawBtn').addEventListener('click', withdrawTokens);

    // Task Filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterTasks(filter);
            
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Fee Method Selection
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', function() {
            const method = this.getAttribute('data-method');
            selectFeeMethod(method);
        });
    });
}

// Show Page
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(`page-${pageId}`).classList.add('active');
}

// Show Wallet Modal
function showWalletModal() {
    document.getElementById('walletModal').classList.add('active');
}

// Connect Wallet
async function connectWallet(walletType) {
    try {
        showLoading();
        
        let accounts;
        switch(walletType) {
            case 'metamask':
                accounts = await connectMetaMask();
                break;
            case 'trustwallet':
                accounts = await connectTrustWallet();
                break;
            case 'walletconnect':
                accounts = await connectWalletConnect();
                break;
            default:
                throw new Error('Unknown wallet type');
        }
        
        if (accounts && accounts.length > 0) {
            userData.walletAddress = accounts[0];
            updateWalletDisplay();
            await loadUserData();
            showNotification('Wallet connected successfully!');
            document.getElementById('walletModal').classList.remove('active');
        }
        
    } catch (error) {
        showNotification('Error connecting wallet: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Connect MetaMask
async function connectMetaMask() {
    if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask!');
    }
    
    try {
        // Request account access
        const accounts = await ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        // Check network
        await switchToBSC();
        
        return accounts;
    } catch (error) {
        throw error;
    }
}

// Switch to BSC Network
async function switchToBSC() {
    const chainId = '0x38'; // BSC Mainnet
    
    if (ethereum.networkVersion !== '56') {
        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainId }]
            });
        } catch (error) {
            // If chain not added, add it
            if (error.code === 4902) {
                await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: chainId,
                        chainName: 'Binance Smart Chain',
                        nativeCurrency: {
                            name: 'BNB',
                            symbol: 'BNB',
                            decimals: 18
                        },
                        rpcUrls: ['https://bsc-dataseed.binance.org/'],
                        blockExplorerUrls: ['https://bscscan.com/']
                    }]
                });
            }
        }
    }
}

// Update Wallet Display
function updateWalletDisplay() {
    if (userData.walletAddress) {
        const shortAddress = `${userData.walletAddress.substring(0, 6)}...${userData.walletAddress.substring(38)}`;
        
        document.getElementById('walletAddress').textContent = shortAddress;
        document.getElementById('userName').textContent = shortAddress;
        document.getElementById('connectWalletBtn').innerHTML = '<i class="fas fa-check"></i> Connected';
        document.getElementById('connectWalletBtn').classList.add('connected');
        
        // Enable buttons that require wallet
        document.getElementById('activateBtn').disabled = false;
        document.getElementById('activateBtn').innerHTML = '<i class="fas fa-unlock"></i> Activate Account';
        
        // Update referral link
        updateReferralLink();
    }
}

async function loadUserData() {
    if (!userData.walletAddress) return;
    
    try {
        // Real API call to get user data
        const response = await fetch(`api.php?action=get-user&address=${userData.walletAddress}`);
        const data = await response.json();
        
        if (data.success) {
            userData = {
                walletAddress: userData.walletAddress,
                isRegistered: data.user.wallet_address ? true : false,
                isActive: data.user.is_active == 1,
                totalEarned: parseFloat(data.user.total_earned) || 0,
                lockedTokens: parseFloat(data.user.locked_tokens) || 0,
                directReferrals: data.user.direct_referrals || 0,
                completedTasks: data.user.verified_tasks || 0,
                activationTime: data.user.activation_time ? data.user.activation_time * 1000 : null,
                dailyClaims: data.user.daily_claims || 0
            };
        } else {
            // New user - initialize with zeros
            userData = {
                ...userData,
                isRegistered: false,
                isActive: false,
                totalEarned: 0,
                lockedTokens: 0,
                directReferrals: 0,
                completedTasks: 0,
                activationTime: null,
                dailyClaims: 0
            };
        }
        
        updateUI();
        updateTaskStatuses();
        updateProgressBars();
        
    } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to minimal data
        userData = {
            ...userData,
            isRegistered: false,
            isActive: false,
            totalEarned: 0,
            lockedTokens: 0,
            directReferrals: 0,
            completedTasks: 0,
            activationTime: null,
            dailyClaims: 0
        };
        updateUI();
    }
}

// Update UI
function updateUI() {
    // Update stats
    document.getElementById('totalEarnings').textContent = `${userData.totalEarned} VNTT`;
    document.getElementById('totalReferrals').textContent = userData.directReferrals;
    document.getElementById('completedTasks').textContent = `${userData.completedTasks}/20`;
    
    document.getElementById('totalEarned').textContent = `${userData.totalEarned} VNTT`;
    document.getElementById('lockedTokens').textContent = `${userData.lockedTokens} VNTT`;
    
    // Update user status
    const statusElement = document.getElementById('userStatus');
    if (userData.isActive) {
        statusElement.textContent = 'Active';
        statusElement.className = 'status-badge status-active';
    } else if (userData.isRegistered) {
        statusElement.textContent = 'Pending Activation';
        statusElement.className = 'status-badge status-pending';
    } else {
        statusElement.textContent = 'Inactive';
        statusElement.className = 'status-badge status-inactive';
    }
}

// Register User
async function registerUser() {
    if (!userData.walletAddress) {
        showNotification('Please connect your wallet first', 'error');
        return;
    }
    
    const uplineAddress = document.getElementById('uplineAddress').value;
    
    if (!uplineAddress) {
        showNotification('Please enter upline address', 'error');
        return;
    }
    
    try {
        showLoading();
        
        // Here you would call your smart contract
        // await contract.methods.register(uplineAddress).send({ from: userData.walletAddress });
        
        // For demo, simulate success
        userData.isRegistered = true;
        updateUI();
        
        showNotification('Registration successful! Please activate your account.', 'success');
        showPage('activate');
        
    } catch (error) {
        showNotification('Registration failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Activate Account
async function activateAccount() {
    if (!userData.walletAddress) {
        showNotification('Please connect your wallet first', 'error');
        return;
    }
    
    if (!userData.isRegistered) {
        showNotification('Please register first', 'error');
        return;
    }
    
    try {
        showLoading();
        
        // Here you would call your smart contract
        // await contract.methods.activate().send({ from: userData.walletAddress });
        
        // For demo, simulate success
        userData.isActive = true;
        userData.activationTime = Date.now();
        userData.totalEarned += 100;
        userData.lockedTokens += 100;
        
        updateUI();
        updateProgressBars();
        
        document.getElementById('activateBtn').innerHTML = '<i class="fas fa-check"></i> Activated';
        document.getElementById('activateBtn').disabled = true;
        
        showNotification('Account activated successfully! 100 VNTT bonus added.', 'success');
        showPage('daily');
        
    } catch (error) {
        showNotification('Activation failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Daily Claim
async function dailyClaim() {
    if (!userData.isActive) {
        showNotification('Please activate your account first', 'error');
        return;
    }
    
    try {
        showLoading();
        
        // Here you would call your smart contract
        // await contract.methods.dailyClaim().send({ from: userData.walletAddress });
        
        // For demo, simulate success
        userData.totalEarned += 100;
        userData.lockedTokens += 100;
        userData.dailyClaims += 1;
        
        updateUI();
        
        document.getElementById('dailyClaimBtn').innerHTML = '<i class="fas fa-check"></i> Claimed Today';
        document.getElementById('dailyClaimBtn').disabled = true;
        
        showNotification('Daily claim successful! 100 VNTT added.', 'success');
        
        // Update today's claims
        document.getElementById('todayClaims').textContent = '1/1';
        
    } catch (error) {
        showNotification('Daily claim failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Load Tasks
// Line ~170: loadTasks function को replace करें
async function loadTasks() {
    try {
        // Real API call to get tasks
        const response = await fetch('api.php?action=tasks');
        const data = await response.json();
        
        if (data.success) {
            renderTasks(data.tasks);
        } else {
            // Fallback to default 20 tasks
            renderTasks(getDefaultTasks());
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        renderTasks(getDefaultTasks());
    }
}

// Default 20 tasks
function getDefaultTasks() {
    return [
        // Facebook (4 tasks)
        { id: 0, platform: 'facebook', type: 'follow', title: 'Follow Facebook Page', 
          description: 'Follow our official Facebook page', reward: 100 },
        { id: 1, platform: 'facebook', type: 'like', title: 'Like Facebook Post', 
          description: 'Like our latest Facebook post', reward: 50 },
        { id: 2, platform: 'facebook', type: 'share', title: 'Share Facebook Post', 
          description: 'Share our Facebook post on your timeline', reward: 50 },
        { id: 3, platform: 'facebook', type: 'comment', title: 'Comment on Facebook Post', 
          description: 'Comment on our Facebook post', reward: 50 },
        
        // Twitter (4 tasks)
        { id: 4, platform: 'twitter', type: 'follow', title: 'Follow Twitter Account', 
          description: 'Follow our Twitter account', reward: 100 },
        { id: 5, platform: 'twitter', type: 'like', title: 'Like Tweet', 
          description: 'Like our latest tweet', reward: 50 },
        { id: 6, platform: 'twitter', type: 'retweet', title: 'Retweet', 
          description: 'Retweet our tweet', reward: 50 },
        { id: 7, platform: 'twitter', type: 'comment', title: 'Comment on Tweet', 
          description: 'Comment on our tweet', reward: 50 },
        
        // Instagram (4 tasks)
        { id: 8, platform: 'instagram', type: 'follow', title: 'Follow Instagram Account', 
          description: 'Follow our Instagram account', reward: 100 },
        { id: 9, platform: 'instagram', type: 'like', title: 'Like Instagram Post', 
          description: 'Like our Instagram post', reward: 50 },
        { id: 10, platform: 'instagram', type: 'share', title: 'Share Instagram Post', 
          description: 'Share our Instagram post to your story', reward: 50 },
        { id: 11, platform: 'instagram', type: 'comment', title: 'Comment on Instagram Post', 
          description: 'Comment on our Instagram post', reward: 50 },
        
        // YouTube (4 tasks)
        { id: 12, platform: 'youtube', type: 'subscribe', title: 'Subscribe YouTube Channel', 
          description: 'Subscribe to our YouTube channel', reward: 100 },
        { id: 13, platform: 'youtube', type: 'like', title: 'Like YouTube Video', 
          description: 'Like our YouTube video', reward: 50 },
        { id: 14, platform: 'youtube', type: 'share', title: 'Share YouTube Video', 
          description: 'Share our YouTube video', reward: 50 },
        { id: 15, platform: 'youtube', type: 'comment', title: 'Comment on YouTube Video', 
          description: 'Comment on our YouTube video', reward: 50 },
        
        // Telegram (4 tasks)
        { id: 16, platform: 'telegram', type: 'join', title: 'Join Telegram Channel', 
          description: 'Join our Telegram channel', reward: 100 },
        { id: 17, platform: 'telegram', type: 'join', title: 'Join Telegram Group', 
          description: 'Join our Telegram group', reward: 100 },
        { id: 18, platform: 'telegram', type: 'share', title: 'Share Telegram Post', 
          description: 'Share our Telegram post', reward: 50 },
        { id: 19, platform: 'telegram', type: 'comment', title: 'Comment in Telegram Group', 
          description: 'Comment in our Telegram group', reward: 50 }
    ];
}

// Render tasks function
async function renderTasks(tasks) {
    const container = document.getElementById('tasksContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Get user's completed tasks from API
    let completedTasks = [];
    if (userData.walletAddress) {
        try {
            const response = await fetch(`api.php?action=user-verifications&address=${userData.walletAddress}`);
            const data = await response.json();
            if (data.success) {
                completedTasks = data.verifications
                    .filter(v => v.status === 'verified')
                    .map(v => v.task_id);
            }
        } catch (error) {
            console.error('Error fetching completed tasks:', error);
        }
    }
    
    tasks.forEach(task => {
        const isCompleted = completedTasks.includes(task.id);
        const taskElement = createTaskElement(task, isCompleted);
        container.appendChild(taskElement);
    });
}

// Create Task Element
function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task-item diamond-card';
    div.setAttribute('data-platform', task.platform);
    
    div.innerHTML = `
        <div class="task-header">
            <div class="task-platform platform-${task.platform}">
                <i class="fab fa-${task.platform}"></i>
            </div>
            <span class="task-type">${task.type.toUpperCase()}</span>
        </div>
        
        <h4 class="task-title">${task.title}</h4>
        <p class="task-description">${task.description}</p>
        
        <div class="task-reward">
            <span class="reward-amount">+${task.reward} VNTT</span>
        </div>
        
        <div class="task-actions">
            <button class="btn-action ${task.completed ? 'completed' : ''}" 
                    onclick="verifyTask(${task.id})" ${task.completed ? 'disabled' : ''}>
                <i class="fas fa-${task.completed ? 'check' : 'check-circle'}"></i>
                ${task.completed ? 'Completed' : 'Verify Task'}
            </button>
            
            <span class="status-badge ${task.completed ? 'status-active' : 'status-pending'}">
                ${task.completed ? 'Verified' : 'Pending'}
            </span>
        </div>
    `;
    
    return div;
}

// Filter Tasks
function filterTasks(platform) {
    const tasks = document.querySelectorAll('.task-item');
    
    tasks.forEach(task => {
        if (platform === 'all' || task.getAttribute('data-platform') === platform) {
            task.style.display = 'block';
        } else {
            task.style.display = 'none';
        }
    });
}

// Verify Task
function verifyTask(taskId) {
    // Open verification modal
    const modal = document.getElementById('taskModal');
    const modalBody = document.getElementById('taskModalBody');
    
    modalBody.innerHTML = `
        <div class="verification-form">
            <h5>Submit Proof for Task</h5>
            
            <div class="form-group">
                <label>Upload Screenshot</label>
                <div class="upload-area" onclick="document.getElementById('fileInput').click()">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Click to upload screenshot</p>
                    <input type="file" id="fileInput" accept="image/*" hidden>
                </div>
            </div>
            
            <div class="form-group">
                <label>Or Paste Link</label>
                <input type="url" class="form-control" placeholder="https://example.com/your-proof">
            </div>
            
            <div class="form-group">
                <label>Additional Notes (Optional)</label>
                <textarea class="form-control" rows="3" placeholder="Any additional information..."></textarea>
            </div>
            
            <button class="btn-primary" onclick="submitTaskVerification(${taskId})">
                <i class="fas fa-paper-plane"></i> Submit for Verification
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

// Submit Task Verification
function submitTaskVerification(taskId) {
    showNotification('Task submitted for verification! Admin will review within 24-48 hours.', 'success');
    document.getElementById('taskModal').classList.remove('active');
}

// Load Referral Levels
function loadReferralLevels() {
    const levels = [
        { level: 1, reward: '100 VNTT', earned: '50 VNTT', status: 'active' },
        { level: 2, reward: '80 VNTT', earned: '30 VNTT', status: 'active' },
        { level: 3, reward: '60 VNTT', earned: '20 VNTT', status: 'active' },
        { level: 4, reward: '40 VNTT', earned: '10 VNTT', status: 'active' },
        { level: 5, reward: '20 VNTT', earned: '0 VNTT', status: 'pending' },
        { level: 6, reward: '10 VNTT', earned: '0 VNTT', status: 'pending' },
        { level: 7, reward: '10 VNTT', earned: '0 VNTT', status: 'pending' },
        { level: 8, reward: '10 VNTT', earned: '0 VNTT', status: 'pending' },
        { level: 9, reward: '10 VNTT', earned: '0 VNTT', status: 'pending' },
        { level: 10, reward: '10 VNTT', earned: '0 VNTT', status: 'pending' }
    ];
    
    const container = document.getElementById('referralLevels');
    container.innerHTML = '';
    
    let totalEarned = 0;
    
    levels.forEach(level => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Level ${level.level}</td>
            <td>${level.reward}</td>
            <td>${level.earned}</td>
            <td>
                <span class="status-badge status-${level.status}">
                    ${level.status === 'active' ? 'Earning' : 'Available'}
                </span>
            </td>
        `;
        container.appendChild(row);
        
        totalEarned += parseInt(level.earned);
    });
    
    document.getElementById('refEarnings').textContent = totalEarned;
}

// Update Referral Link
function updateReferralLink() {
    if (userData.walletAddress) {
        const link = `https://yourdomain.com/?ref=${userData.walletAddress}`;
        document.getElementById('referralLink').value = link;
    }
}

// Copy Referral Link
function copyReferralLink() {
    const linkInput = document.getElementById('referralLink');
    linkInput.select();
    document.execCommand('copy');
    showNotification('Referral link copied to clipboard!');
}

// Withdraw Tokens
async function withdrawTokens() {
    if (!userData.isActive) {
        showNotification('Please activate your account first', 'error');
        return;
    }
    
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    if (!amount || amount < 100 || amount > 5000) {
        showNotification('Amount must be between 100 and 5000 VNTT', 'error');
        return;
    }
    
    if (amount > userData.lockedTokens) {
        showNotification('Insufficient locked tokens', 'error');
        return;
    }
    
    // Check lock period
    if (userData.activationTime) {
        const daysPassed = Math.floor((Date.now() - userData.activationTime) / (1000 * 60 * 60 * 24));
        if (daysPassed < 90) {
            showNotification(`Withdrawal available in ${90 - daysPassed} days`, 'error');
            return;
        }
    }
    
    try {
        showLoading();
        
        const feeMethod = document.querySelector('input[name="feeMethod"]:checked').value;
        
        // Here you would call your smart contract
        // await contract.methods.withdraw(
        //     web3.utils.toWei(amount.toString(), 'ether'),
        //     feeMethod === 'vnt'
        // ).send({ from: userData.walletAddress });
        
        // For demo, simulate success
        userData.lockedTokens -= amount;
        updateUI();
        
        showNotification(`Withdrawal successful! ${amount} VNTT sent to your wallet.`);
        
        // Reset form
        document.getElementById('withdrawAmount').value = '100';
        
    } catch (error) {
        showNotification('Withdrawal failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Select Fee Method
function selectFeeMethod(method) {
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('active');
    });
    
    document.querySelector(`[data-method="${method}"]`).classList.add('active');
}

// Update Task Statuses
function updateTaskStatuses() {
    const completed = userData.completedTasks;
    document.getElementById('tasksProgress').style.width = `${(completed / 20) * 100}%`;
}

// Update Progress Bars
function updateProgressBars() {
    // Activation progress
    const activationProgress = userData.isActive ? 100 : 0;
    document.getElementById('activationProgress').style.width = `${activationProgress}%`;
    
    // Lock period progress
    if (userData.activationTime) {
        const daysPassed = Math.floor((Date.now() - userData.activationTime) / (1000 * 60 * 60 * 24));
        const lockProgress = Math.min(100, (daysPassed / 90) * 100);
        const daysLeft = Math.max(0, 90 - daysPassed);
        
        document.getElementById('lockProgress').style.width = `${lockProgress}%`;
        document.getElementById('lockProgressBar').style.width = `${lockProgress}%`;
        document.getElementById('lockPeriodInfo').textContent = `${daysLeft} days remaining`;
        document.getElementById('daysLeft').textContent = `${daysLeft} Days`;
        document.getElementById('lockProgressPercent').textContent = `${Math.round(lockProgress)}%`;
    }
}

// Start Timers
function startTimers() {
    // Update claim timer
    setInterval(updateClaimTimer, 1000);
    updateClaimTimer();
    
    // Update dashboard every 30 seconds
    setInterval(updateDashboard, 30000);
}

// Update Claim Timer
function updateClaimTimer() {
    // Mock next claim time (24 hours from last claim)
    const nextClaimTime = Date.now() + (6 * 60 * 60 * 1000); // 6 hours for demo
    
    const now = Date.now();
    const diff = nextClaimTime - now;
    
    if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        document.getElementById('claimCountdown').innerHTML = `
            <div class="time-unit">
                <span class="number">${hours.toString().padStart(2, '0')}</span>
                <span class="label">Hours</span>
            </div>
            <div class="time-unit">
                <span class="number">${minutes.toString().padStart(2, '0')}</span>
                <span class="label">Minutes</span>
            </div>
            <div class="time-unit">
                <span class="number">${seconds.toString().padStart(2, '0')}</span>
                <span class="label">Seconds</span>
            </div>
        `;
        
        // Update progress bar
        const totalSeconds = 24 * 60 * 60;
        const remainingSeconds = hours * 3600 + minutes * 60 + seconds;
        const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
        
        document.getElementById('claimProgress').style.width = `${progress}%`;
        document.getElementById('progressPercent').textContent = `${Math.round(progress)}%`;
        
        // Enable/disable claim button
        if (hours === 0 && minutes === 0 && seconds === 0) {
            document.getElementById('dailyClaimBtn').disabled = false;
        } else {
            document.getElementById('dailyClaimBtn').disabled = true;
        }
    } else {
        document.getElementById('dailyClaimBtn').disabled = false;
    }
}

// Update Dashboard
function updateDashboard() {
    // Refresh user data
    if (userData.walletAddress) {
        loadUserData();
    }
}

// Check Wallet Connection
function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined' && window.ethereum.selectedAddress) {
        userData.walletAddress = window.ethereum.selectedAddress;
        updateWalletDisplay();
        loadUserData();
    }
}

// Show Notification
function showNotification(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    
    if (type === 'error') {
        toast.style.background = 'rgba(220, 53, 69, 0.9)';
    } else {
        toast.style.background = 'rgba(40, 167, 69, 0.9)';
    }
    
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Show Loading
function showLoading() {
    // You can implement a loading spinner here
    console.log('Loading...');
}

// Hide Loading
function hideLoading() {
    console.log('Loading complete');
}

// Refresh Balances
function refreshBalances() {
    showNotification('Balances refreshed!');
}

// Initialize when page loads
window.addEventListener('load', () => {
    // Check URL for page parameter
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    
    if (page) {
        showPage(page);
    }

});
