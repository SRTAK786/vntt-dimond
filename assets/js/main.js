// Main Application JavaScript - VNTT Diamond Network
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
    dailyClaims: 0,
    lastClaimTime: null
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
    const pageElement = document.getElementById(`page-${pageId}`);
    if (pageElement) {
        pageElement.classList.add('active');
    }
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
            await loadTasks(); // Reload tasks with user data
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

// Connect Trust Wallet (similar to MetaMask)
async function connectTrustWallet() {
    return await connectMetaMask(); // Trust Wallet uses same interface
}

// Connect WalletConnect (simplified)
async function connectWalletConnect() {
    showNotification('WalletConnect integration coming soon!', 'info');
    return null;
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

// Load User Data from API
async function loadUserData() {
    if (!userData.walletAddress) return;
    
    try {
        // Real API call to get user data
        const response = await fetch(`api.php?action=get-user&address=${userData.walletAddress}`);
        const data = await response.json();
        
        if (data.success && data.user) {
            userData = {
                walletAddress: userData.walletAddress,
                isRegistered: true,
                isActive: data.user.is_active == 1,
                totalEarned: parseFloat(data.user.total_earned) || 0,
                lockedTokens: parseFloat(data.user.locked_tokens) || 0,
                directReferrals: data.user.direct_referrals || 0,
                completedTasks: data.user.verified_tasks || 0,
                activationTime: data.user.activation_time ? data.user.activation_time * 1000 : null,
                dailyClaims: data.user.daily_claims || 0,
                lastClaimTime: data.user.last_claim_time ? data.user.last_claim_time * 1000 : null
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
                dailyClaims: 0,
                lastClaimTime: null
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
            dailyClaims: 0,
            lastClaimTime: null
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
    
    // Update dashboard stats
    document.getElementById('directRefs').textContent = userData.directReferrals;
    document.getElementById('refEarnings').textContent = userData.totalEarned;
    
    // Update available withdrawal
    if (userData.isActive && userData.activationTime) {
        const daysPassed = Math.floor((Date.now() - userData.activationTime) / (1000 * 60 * 60 * 24));
        if (daysPassed >= 90) {
            document.getElementById('availableAmount').value = userData.lockedTokens;
            document.getElementById('withdrawBtn').disabled = false;
        }
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
    
    if (!isValidAddress(uplineAddress)) {
        showNotification('Invalid upline address format', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch('api.php?action=register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                wallet_address: userData.walletAddress,
                upline_address: uplineAddress
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            userData.isRegistered = true;
            updateUI();
            
            showNotification('Registration successful! Please activate your account.', 'success');
            showPage('activate');
            
        } else {
            showNotification(data.message || 'Registration failed', 'error');
        }
        
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
        
        // Here you would integrate with smart contract for payment
        // For demo, we'll simulate activation via admin API
        const response = await fetch('api.php?action=activate-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: 'Vntt@2024#Secure!Admin', // Admin token
                wallet_address: userData.walletAddress
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
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
            
        } else {
            showNotification(data.message || 'Activation failed. Please pay 0.30 USDT fee.', 'error');
        }
        
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
    
    // Check if 24 hours have passed since last claim
    if (userData.lastClaimTime) {
        const timeSinceLastClaim = Date.now() - userData.lastClaimTime;
        if (timeSinceLastClaim < 24 * 60 * 60 * 1000) {
            const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - timeSinceLastClaim) / (60 * 60 * 1000));
            showNotification(`Please wait ${hoursLeft} more hours before next claim`, 'error');
            return;
        }
    }
    
    try {
        showLoading();
        
        // Simulate daily claim - in real system, call smart contract
        userData.totalEarned += 100;
        userData.lockedTokens += 100;
        userData.dailyClaims += 1;
        userData.lastClaimTime = Date.now();
        
        updateUI();
        
        document.getElementById('dailyClaimBtn').innerHTML = '<i class="fas fa-check"></i> Claimed Today';
        document.getElementById('dailyClaimBtn').disabled = true;
        
        // Update today's claims
        document.getElementById('todayClaims').textContent = '1/1';
        document.getElementById('totalDailyClaims').textContent = `${userData.dailyClaims} times`;
        
        showNotification('Daily claim successful! 100 VNTT added.', 'success');
        
        // Reset button after 24 hours
        setTimeout(() => {
            document.getElementById('dailyClaimBtn').innerHTML = '<i class="fas fa-gift"></i> Claim 100 VNTT';
            document.getElementById('dailyClaimBtn').disabled = false;
            document.getElementById('todayClaims').textContent = '0/1';
        }, 24 * 60 * 60 * 1000);
        
    } catch (error) {
        showNotification('Daily claim failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Load Tasks from API
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
        { id: 0, platform: 'facebook', task_type: 'follow', task_name: 'Follow Facebook Page', 
          description: 'Follow our official Facebook page', reward: 100 },
        { id: 1, platform: 'facebook', task_type: 'like', task_name: 'Like Facebook Post', 
          description: 'Like our latest Facebook post', reward: 50 },
        { id: 2, platform: 'facebook', task_type: 'share', task_name: 'Share Facebook Post', 
          description: 'Share our Facebook post on your timeline', reward: 50 },
        { id: 3, platform: 'facebook', task_type: 'comment', task_name: 'Comment on Facebook Post', 
          description: 'Comment on our Facebook post', reward: 50 },
        
        // Twitter (4 tasks)
        { id: 4, platform: 'twitter', task_type: 'follow', task_name: 'Follow Twitter Account', 
          description: 'Follow our Twitter account', reward: 100 },
        { id: 5, platform: 'twitter', task_type: 'like', task_name: 'Like Tweet', 
          description: 'Like our latest tweet', reward: 50 },
        { id: 6, platform: 'twitter', task_type: 'retweet', task_name: 'Retweet', 
          description: 'Retweet our tweet', reward: 50 },
        { id: 7, platform: 'twitter', task_type: 'comment', task_name: 'Comment on Tweet', 
          description: 'Comment on our tweet', reward: 50 },
        
        // Instagram (4 tasks)
        { id: 8, platform: 'instagram', task_type: 'follow', task_name: 'Follow Instagram Account', 
          description: 'Follow our Instagram account', reward: 100 },
        { id: 9, platform: 'instagram', task_type: 'like', task_name: 'Like Instagram Post', 
          description: 'Like our Instagram post', reward: 50 },
        { id: 10, platform: 'instagram', task_type: 'share', task_name: 'Share Instagram Post', 
          description: 'Share our Instagram post to your story', reward: 50 },
        { id: 11, platform: 'instagram', task_type: 'comment', task_name: 'Comment on Instagram Post', 
          description: 'Comment on our Instagram post', reward: 50 },
        
        // YouTube (4 tasks)
        { id: 12, platform: 'youtube', task_type: 'subscribe', task_name: 'Subscribe YouTube Channel', 
          description: 'Subscribe to our YouTube channel', reward: 100 },
        { id: 13, platform: 'youtube', task_type: 'like', task_name: 'Like YouTube Video', 
          description: 'Like our YouTube video', reward: 50 },
        { id: 14, platform: 'youtube', task_type: 'share', task_name: 'Share YouTube Video', 
          description: 'Share our YouTube video', reward: 50 },
        { id: 15, platform: 'youtube', task_type: 'comment', task_name: 'Comment on YouTube Video', 
          description: 'Comment on our YouTube video', reward: 50 },
        
        // Telegram (4 tasks)
        { id: 16, platform: 'telegram', task_type: 'join', task_name: 'Join Telegram Channel', 
          description: 'Join our Telegram channel', reward: 100 },
        { id: 17, platform: 'telegram', task_type: 'join', task_name: 'Join Telegram Group', 
          description: 'Join our Telegram group', reward: 100 },
        { id: 18, platform: 'telegram', task_type: 'share', task_name: 'Share Telegram Post', 
          description: 'Share our Telegram post', reward: 50 },
        { id: 19, platform: 'telegram', task_type: 'comment', task_name: 'Comment in Telegram Group', 
          description: 'Comment in our Telegram group', reward: 50 }
    ];
}

// Render Tasks
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
        const isCompleted = completedTasks.includes(parseInt(task.id));
        const taskElement = createTaskElement(task, isCompleted);
        container.appendChild(taskElement);
    });
}

// Create Task Element
function createTaskElement(task, isCompleted) {
    const div = document.createElement('div');
    div.className = 'task-item diamond-card';
    div.setAttribute('data-platform', task.platform);
    div.setAttribute('data-task-id', task.id);
    
    div.innerHTML = `
        <div class="task-header">
            <div class="task-platform platform-${task.platform}">
                <i class="fab fa-${task.platform}"></i>
            </div>
            <span class="task-type">${task.task_type.toUpperCase()}</span>
        </div>
        
        <h4 class="task-title">${task.task_name}</h4>
        <p class="task-description">${task.description || 'Complete this task to earn rewards'}</p>
        
        <div class="task-reward">
            <span class="reward-amount">+${task.reward}</span>
            <span class="reward-label">VNTT</span>
        </div>
        
        <div class="task-actions">
            <button class="btn-action ${isCompleted ? 'completed' : ''}" 
                    onclick="verifyTask(${task.id})" ${isCompleted ? 'disabled' : ''}>
                <i class="fas fa-${isCompleted ? 'check' : 'check-circle'}"></i>
                ${isCompleted ? 'Completed' : 'Verify Task'}
            </button>
            
            <span class="status-badge ${isCompleted ? 'status-active' : 'status-pending'}">
                ${isCompleted ? 'Verified' : 'Pending'}
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
async function verifyTask(taskId) {
    if (!userData.walletAddress) {
        showNotification('Please connect your wallet first', 'error');
        return;
    }
    
    if (!userData.isActive) {
        showNotification('Please activate your account first', 'error');
        return;
    }
    
    // Get task details
    const tasksResponse = await fetch('api.php?action=tasks');
    const tasksData = await tasksResponse.json();
    const task = tasksData.tasks.find(t => t.id == taskId);
    
    if (!task) {
        showNotification('Task not found', 'error');
        return;
    }
    
    // Open verification modal
    const modal = document.getElementById('taskModal');
    const modalBody = document.getElementById('taskModalBody');
    
    modalBody.innerHTML = `
        <div class="verification-form">
            <div class="task-info">
                <div class="task-platform platform-${task.platform}">
                    <i class="fab fa-${task.platform}"></i>
                </div>
                <div>
                    <h5>${task.task_name}</h5>
                    <p class="text-muted">${task.task_type.toUpperCase()} • Reward: ${task.reward} VNTT</p>
                </div>
            </div>
            
            <div class="form-group mt-3">
                <label>Select Verification Method</label>
                <div class="verification-methods">
                    <button class="method-btn active" data-method="screenshot" onclick="loadVerificationForm(${taskId}, 'screenshot')">
                        <i class="fas fa-camera"></i>
                        <span>Upload Screenshot</span>
                    </button>
                    <button class="method-btn" data-method="link" onclick="loadVerificationForm(${taskId}, 'link')">
                        <i class="fas fa-link"></i>
                        <span>Submit Link</span>
                    </button>
                </div>
            </div>
            
            <div id="verificationFormContent">
                <!-- Dynamic content will be loaded here -->
            </div>
            
            <div class="verification-guidelines mt-3">
                <h6><i class="fas fa-info-circle"></i> Guidelines:</h6>
                <ul>
                    <li>Ensure your username is visible in the screenshot</li>
                    <li>Screenshot should be clear and recent</li>
                    <li>Links should be publicly accessible</li>
                    <li>Verification takes 24-48 hours</li>
                </ul>
            </div>
        </div>
    `;
    
    // Load default form (screenshot)
    loadVerificationForm(taskId, 'screenshot');
    
    modal.classList.add('active');
}

// Load Verification Form
function loadVerificationForm(taskId, method) {
    const container = document.getElementById('verificationFormContent');
    const buttons = document.querySelectorAll('.method-btn');
    
    // Update active button
    buttons.forEach(btn => {
        if (btn.getAttribute('data-method') === method) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    if (method === 'screenshot') {
        container.innerHTML = `
            <form id="screenshotForm">
                <div class="form-group mt-3">
                    <label>Upload Screenshot</label>
                    <div class="upload-area" id="screenshotUploadArea" onclick="document.getElementById('screenshotFile').click()">
                        <i class="fas fa-cloud-upload-alt fa-2x"></i>
                        <p>Click to upload screenshot</p>
                        <small>Max 5MB • JPG, PNG, GIF</small>
                        <input type="file" id="screenshotFile" name="screenshot" 
                               accept="image/*" style="display: none;" onchange="updateFileName(this)">
                    </div>
                    <div id="fileName" class="file-name mt-2"></div>
                </div>
                
                <div class="form-group">
                    <label>Additional Notes (Optional)</label>
                    <textarea class="form-control" id="verificationNotes" 
                              placeholder="Any additional information..." rows="3"></textarea>
                </div>
                
                <button type="button" class="btn-primary w-100 mt-3" onclick="submitScreenshot(${taskId})">
                    <i class="fas fa-paper-plane"></i> Submit for Verification
                </button>
            </form>
        `;
        
    } else {
        container.innerHTML = `
            <form id="linkForm">
                <div class="form-group mt-3">
                    <label>Proof URL</label>
                    <input type="url" class="form-control" id="proofUrl" 
                           placeholder="https://example.com/your-proof" required>
                    <small class="text-muted">Provide direct link to your completed task</small>
                </div>
                
                <div class="form-group">
                    <label>Your Username on Platform</label>
                    <input type="text" class="form-control" id="platformUsername" 
                           placeholder="Your username on the social platform" required>
                </div>
                
                <div class="form-group">
                    <label>Additional Notes (Optional)</label>
                    <textarea class="form-control" id="linkNotes" 
                              placeholder="Any additional information..." rows="3"></textarea>
                </div>
                
                <button type="button" class="btn-primary w-100 mt-3" onclick="submitLink(${taskId})">
                    <i class="fas fa-link"></i> Submit Link
                </button>
            </form>
        `;
    }
}

// Update file name display
function updateFileName(input) {
    const fileName = input.files[0] ? input.files[0].name : 'No file selected';
    document.getElementById('fileName').textContent = `Selected: ${fileName}`;
}

// Submit Screenshot Verification
async function submitScreenshot(taskId) {
    const fileInput = document.getElementById('screenshotFile');
    const notes = document.getElementById('verificationNotes').value;
    
    if (!fileInput.files[0]) {
        showNotification('Please select a screenshot', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('screenshot', fileInput.files[0]);
    formData.append('user_address', userData.walletAddress);
    formData.append('task_id', taskId);
    formData.append('type', 'screenshot');
    if (notes) formData.append('additional_notes', notes);
    
    await submitVerification(formData);
}

// Submit Link Verification
async function submitLink(taskId) {
    const proofUrl = document.getElementById('proofUrl').value;
    const username = document.getElementById('platformUsername').value;
    const notes = document.getElementById('linkNotes').value;
    
    if (!proofUrl || !username) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    if (!isValidUrl(proofUrl)) {
        showNotification('Please enter a valid URL', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('user_address', userData.walletAddress);
    formData.append('task_id', taskId);
    formData.append('type', 'link');
    formData.append('proof_url', proofUrl);
    formData.append('user_name', username);
    if (notes) formData.append('additional_notes', notes);
    
    await submitVerification(formData);
}

// Submit Verification to API
async function submitVerification(formData) {
    try {
        showLoading();
        
        const response = await fetch('api.php?action=submit-proof', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Task submitted for verification! Admin will review within 24-48 hours.', 'success');
            document.getElementById('taskModal').classList.remove('active');
            
            // Reload tasks to update status
            await loadTasks();
            
            // Reload user data
            await loadUserData();
            
        } else {
            showNotification(data.message || 'Submission failed', 'error');
        }
        
    } catch (error) {
        console.error('Error submitting verification:', error);
        showNotification('Error submitting verification: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Load Referral Levels
function loadReferralLevels() {
    const levels = [
        { level: 1, reward: '100 VNTT', earned: '0 VNTT', status: 'pending' },
        { level: 2, reward: '80 VNTT', earned: '0 VNTT', status: 'pending' },
        { level: 3, reward: '60 VNTT', earned: '0 VNTT', status: 'pending' },
        { level: 4, reward: '40 VNTT', earned: '0 VNTT', status: 'pending' },
        { level: 5, reward: '20 VNTT', earned: '0 VNTT', status: 'pending' },
        { level: 6, reward: '10 VNTT', earned: '0 VNTT', status: 'pending' },
        { level: 7, reward: '10 VNTT', earned: '0 VNTT', status: 'pending' },
        { level: 8, reward: '10 VNTT', earned: '0 VNTT', status: 'pending' },
        { level: 9, reward: '10 VNTT', earned: '0 VNTT', status: 'pending' },
        { level: 10, reward: '10 VNTT', earned: '0 VNTT', status: 'pending' }
    ];
    
    const container = document.getElementById('referralLevels');
    if (!container) return;
    
    container.innerHTML = '';
    
    levels.forEach(level => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Level ${level.level}</td>
            <td>${level.reward}</td>
            <td>${level.earned}</td>
            <td>
                <span class="status-badge status-${level.status}">
                    ${level.status === 'pending' ? 'Available' : 'Earning'}
                </span>
            </td>
        `;
        container.appendChild(row);
    });
}

// Update Referral Link
function updateReferralLink() {
    if (userData.walletAddress) {
        const link = `${window.location.origin}${window.location.pathname}?ref=${userData.walletAddress}`;
        document.getElementById('referralLink').value = link;
    }
}

// Copy Referral Link
function copyReferralLink() {
    const linkInput = document.getElementById('referralLink');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
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
        
        // In real system, call smart contract here
        // For demo, simulate withdrawal
        userData.lockedTokens -= amount;
        updateUI();
        
        showNotification(`Withdrawal request submitted! ${amount} VNTT will be sent to your wallet within 24 hours.`);
        
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
    const progressBar = document.getElementById('tasksProgress');
    if (progressBar) {
        progressBar.style.width = `${(completed / 20) * 100}%`;
    }
}

// Update Progress Bars
function updateProgressBars() {
    // Activation progress
    const activationProgress = userData.isActive ? 100 : 0;
    const activationBar = document.getElementById('activationProgress');
    if (activationBar) {
        activationBar.style.width = `${activationProgress}%`;
    }
    
    // Lock period progress
    if (userData.activationTime) {
        const daysPassed = Math.floor((Date.now() - userData.activationTime) / (1000 * 60 * 60 * 24));
        const lockProgress = Math.min(100, (daysPassed / 90) * 100);
        const daysLeft = Math.max(0, 90 - daysPassed);
        
        const lockBar = document.getElementById('lockProgress');
        const lockBar2 = document.getElementById('lockProgressBar');
        const lockPeriodInfo = document.getElementById('lockPeriodInfo');
        const daysLeftElement = document.getElementById('daysLeft');
        const lockProgressPercent = document.getElementById('lockProgressPercent');
        
        if (lockBar) lockBar.style.width = `${lockProgress}%`;
        if (lockBar2) lockBar2.style.width = `${lockProgress}%`;
        if (lockPeriodInfo) lockPeriodInfo.textContent = `${daysLeft} days remaining`;
        if (daysLeftElement) daysLeftElement.textContent = `${daysLeft} Days`;
        if (lockProgressPercent) lockProgressPercent.textContent = `${Math.round(lockProgress)}%`;
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
    const nextClaimTime = userData.lastClaimTime ? userData.lastClaimTime + (24 * 60 * 60 * 1000) : Date.now();
    const now = Date.now();
    const diff = nextClaimTime - now;
    
    const timerElement = document.getElementById('claimCountdown');
    const progressBar = document.getElementById('claimProgress');
    const progressPercent = document.getElementById('progressPercent');
    const claimBtn = document.getElementById('dailyClaimBtn');
    
    if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (timerElement) {
            timerElement.innerHTML = `
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
        }
        
        // Update progress bar
        const totalSeconds = 24 * 60 * 60;
        const remainingSeconds = hours * 3600 + minutes * 60 + seconds;
        const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
        
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressPercent) progressPercent.textContent = `${Math.round(progress)}%`;
        
        // Disable claim button
        if (claimBtn) claimBtn.disabled = true;
        
    } else {
        // Enable claim button
        if (claimBtn) {
            claimBtn.disabled = false;
            claimBtn.innerHTML = '<i class="fas fa-gift"></i> Claim 100 VNTT';
        }
        if (timerElement) timerElement.innerHTML = '<div class="time-unit"><span class="number">00</span><span class="label">Ready</span></div>';
        if (progressBar) progressBar.style.width = '100%';
        if (progressPercent) progressPercent.textContent = '100%';
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
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    
    if (type === 'error') {
        toast.style.background = 'rgba(220, 53, 69, 0.9)';
    } else if (type === 'warning') {
        toast.style.background = 'rgba(255, 193, 7, 0.9)';
    } else if (type === 'info') {
        toast.style.background = 'rgba(23, 162, 184, 0.9)';
    } else {
        toast.style.background = 'rgba(40, 167, 69, 0.9)';
    }
    
    toast.style.display = 'flex';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Show Loading
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'flex';
    }
}

// Hide Loading
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// Refresh Balances
function refreshBalances() {
    if (userData.walletAddress) {
        loadUserData();
        showNotification('Balances refreshed!');
    } else {
        showNotification('Please connect wallet first', 'error');
    }
}

// Helper Functions
function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function formatAddress(address) {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Initialize when page loads
window.addEventListener('load', () => {
    // Check URL for page parameter
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    const ref = urlParams.get('ref');
    
    if (page) {
        showPage(page);
    }
    
    if (ref && isValidAddress(ref)) {
        document.getElementById('uplineAddress').value = ref;
    }
});

// Make functions available globally
window.copyReferralLink = copyReferralLink;
window.refreshBalances = refreshBalances;
window.verifyTask = verifyTask;
window.loadVerificationForm = loadVerificationForm;
window.updateFileName = updateFileName;
window.submitScreenshot = submitScreenshot;
window.submitLink = submitLink;
window.showPage = showPage;
