// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
});

// Global Variables
let currentTab = 'dashboard';
let adminToken = null;
let verificationData = [];
let userData = [];
let withdrawalData = [];

// Initialize Admin Panel
function initializeAdminPanel() {
    setupEventListeners();
    
    // Check if already logged in
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
        adminToken = savedToken;
        showAdminPanel();
        loadDashboard();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tab = this.getAttribute('data-tab');
            showTab(tab);
            
            // Update active state
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Settings tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            showSettingsTab(tabId);
            
            // Update active state
            document.querySelectorAll('.settings-tab').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });

    // Add task form
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addNewTaskSubmit();
        });
    }

    // Task categories
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterAdminTasks(category);
            
            // Update active state
            document.querySelectorAll('.category-btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Filter dropdowns
    const verificationFilter = document.getElementById('verificationFilter');
    if (verificationFilter) {
        verificationFilter.addEventListener('change', function() {
            filterVerifications(this.value);
        });
    }

    const withdrawalFilter = document.getElementById('withdrawalFilter');
    if (withdrawalFilter) {
        withdrawalFilter.addEventListener('change', function() {
            filterWithdrawals(this.value);
        });
    }

    const logFilter = document.getElementById('logFilter');
    if (logFilter) {
        logFilter.addEventListener('change', function() {
            filterLogs(this.value);
        });
    }
}

// Admin Login
async function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    const securityCode = document.getElementById('securityCode').value;
    
    if (!password) {
        showAdminToast('Please enter admin password', 'error');
        return;
    }
    
    try {
        showAdminLoading();
        
        // Send login request to API
        const response = await fetch('api.php?action=admin-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                password: password,
                security_code: securityCode
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            adminToken = data.token;
            localStorage.setItem('adminToken', adminToken);
            localStorage.setItem('adminLoggedIn', 'true');
            
            showAdminPanel();
            loadDashboard();
            showAdminToast('Login successful!', 'success');
        } else {
            showAdminToast(data.message || 'Login failed', 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showAdminToast('Login error: ' + error.message, 'error');
    } finally {
        hideAdminLoading();
    }
}

// Show Admin Panel
function showAdminPanel() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
}

// Admin Logout
function adminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        adminToken = null;
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminLoggedIn');
        
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        
        // Clear form
        document.getElementById('adminPassword').value = '';
        document.getElementById('securityCode').value = '';
        
        showAdminToast('Logged out successfully', 'success');
    }
}

// Show Tab
function showTab(tabId) {
    currentTab = tabId;
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId + 'Tab').classList.add('active');
    
    // Load tab data
    switch(tabId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'verifications':
            loadVerifications();
            break;
        case 'users':
            loadUsers();
            break;
        case 'withdrawals':
            loadWithdrawals();
            break;
        case 'tasks':
            loadAdminTasks();
            break;
        case 'logs':
            loadLogs();
            break;
    }
}

// Show Settings Tab
function showSettingsTab(tabId) {
    // Hide all settings tabs
    document.querySelectorAll('.settings-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId + 'Settings').classList.add('active');
}

// Load Dashboard
async function loadDashboard() {
    try {
        const response = await fetch('api.php?action=stats&token=' + encodeURIComponent(adminToken));
        const data = await response.json();
        
        if (data.success) {
            // Update stats
            document.getElementById('totalUsers').textContent = data.stats.total_users;
            document.getElementById('activeUsers').textContent = data.stats.active_users;
            document.getElementById('pendingVerifications').textContent = data.stats.pending_verifications;
            document.getElementById('totalRevenue').textContent = data.stats.total_revenue + ' USDT';
            
            // Update badges
            document.getElementById('pendingBadge').textContent = data.stats.pending_verifications;
            
            // Load chart
            loadUserChart(data.chart_data);
            
            // Load recent activity
            loadRecentActivity(data.recent_activity);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load User Chart
function loadUserChart(chartData) {
    const ctx = document.getElementById('userChart').getContext('2d');
    
    // Default data if no chart data provided
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const data = [65, 59, 80, 81, 56, 55, 40];
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData?.labels || labels,
            datasets: [{
                label: 'New Users',
                data: chartData?.data || data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            }
        }
    });
}

// Load Recent Activity
function loadRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    
    // Default activities if none provided
    const defaultActivities = [
        { time: '10:30 AM', message: 'User registered: 0x1234...5678', type: 'info' },
        { time: '09:45 AM', message: 'Task verified: Facebook Follow', type: 'success' },
        { time: 'Yesterday', message: 'Withdrawal processed: 500 VNTT', type: 'success' },
        { time: '2 days ago', message: 'System backup completed', type: 'info' }
    ];
    
    activities = activities || defaultActivities;
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-time">${activity.time}</div>
            <div class="activity-message">${activity.message}</div>
        </div>
    `).join('');
}

// Load Verifications
async function loadVerifications() {
    try {
        const response = await fetch('api.php?action=pending-verifications&token=' + encodeURIComponent(adminToken));
        const data = await response.json();
        
        if (data.success) {
            verificationData = data.verifications;
            renderVerificationsTable();
        }
    } catch (error) {
        console.error('Error loading verifications:', error);
        showAdminToast('Error loading verifications', 'error');
    }
}

// Render Verifications Table
function renderVerificationsTable(filter = 'all') {
    const container = document.getElementById('verificationsTable');
    const filteredData = filter === 'all' 
        ? verificationData 
        : verificationData.filter(v => v.status === filter);
    
    container.innerHTML = filteredData.map(verification => `
        <tr>
            <td>${verification.id}</td>
            <td><span class="wallet-address">${formatAddress(verification.user_address)}</span></td>
            <td>${verification.task_name}</td>
            <td><span class="platform-badge platform-${verification.platform}">${verification.platform}</span></td>
            <td>
                ${verification.screenshot_path ? 
                    `<a href="${verification.screenshot_path}" target="_blank">Screenshot</a>` : 
                    verification.proof_url ? 
                    `<a href="${verification.proof_url}" target="_blank">Link</a>` : 
                    'No proof'
                }
            </td>
            <td>${formatDate(verification.submitted_at)}</td>
            <td><span class="status-badge status-${verification.status}">${verification.status}</span></td>
            <td>
                <div class="action-buttons">
                    ${verification.status === 'pending' ? `
                        <button class="btn-action btn-approve" onclick="approveVerification(${verification.id})">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action btn-reject" onclick="rejectVerification(${verification.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    <button class="btn-action btn-view" onclick="viewVerification(${verification.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Approve Verification
async function approveVerification(verificationId) {
    if (!confirm('Approve this verification?')) return;
    
    try {
        const response = await fetch('api.php?action=admin-verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: adminToken,
                verification_id: verificationId,
                status: 'verified'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAdminToast('Verification approved!', 'success');
            loadVerifications();
            loadDashboard(); // Refresh dashboard stats
        } else {
            showAdminToast(data.message || 'Approval failed', 'error');
        }
    } catch (error) {
        console.error('Error approving verification:', error);
        showAdminToast('Error approving verification', 'error');
    }
}

// Reject Verification
async function rejectVerification(verificationId) {
    if (!confirm('Reject this verification?')) return;
    
    try {
        const response = await fetch('api.php?action=admin-verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: adminToken,
                verification_id: verificationId,
                status: 'rejected'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAdminToast('Verification rejected!', 'success');
            loadVerifications();
        } else {
            showAdminToast(data.message || 'Rejection failed', 'error');
        }
    } catch (error) {
        console.error('Error rejecting verification:', error);
        showAdminToast('Error rejecting verification', 'error');
    }
}

// View Verification Details
function viewVerification(verificationId) {
    const verification = verificationData.find(v => v.id == verificationId);
    if (!verification) return;
    
    const modalBody = document.getElementById('verificationModalBody');
    modalBody.innerHTML = `
        <div class="verification-details">
            <div class="detail-item">
                <strong>User:</strong>
                <span>${verification.user_address}</span>
            </div>
            
            <div class="detail-item">
                <strong>Task:</strong>
                <span>${verification.task_name} (${verification.platform})</span>
            </div>
            
            <div class="detail-item">
                <strong>Reward:</strong>
                <span>${verification.reward} VNTT</span>
            </div>
            
            <div class="detail-item">
                <strong>Submitted:</strong>
                <span>${formatDate(verification.submitted_at)}</span>
            </div>
            
            <div class="detail-item">
                <strong>Status:</strong>
                <span class="status-badge status-${verification.status}">${verification.status}</span>
            </div>
            
            ${verification.screenshot_path ? `
                <div class="detail-item">
                    <strong>Screenshot:</strong>
                    <div class="screenshot-preview">
                        <img src="${verification.screenshot_path}" alt="Proof" style="max-width: 100%; border-radius: 8px;">
                    </div>
                </div>
            ` : ''}
            
            ${verification.proof_url ? `
                <div class="detail-item">
                    <strong>Proof URL:</strong>
                    <a href="${verification.proof_url}" target="_blank">${verification.proof_url}</a>
                </div>
            ` : ''}
            
            ${verification.user_name ? `
                <div class="detail-item">
                    <strong>Username:</strong>
                    <span>${verification.user_name}</span>
                </div>
            ` : ''}
            
            ${verification.additional_notes ? `
                <div class="detail-item">
                    <strong>Notes:</strong>
                    <p>${verification.additional_notes}</p>
                </div>
            ` : ''}
        </div>
        
        ${verification.status === 'pending' ? `
            <div class="verification-actions">
                <button class="btn-primary btn-approve" onclick="approveVerification(${verification.id})">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn-danger btn-reject" onclick="rejectVerification(${verification.id})">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        ` : ''}
    `;
    
    document.getElementById('verificationModal').classList.add('active');
}

// Load Users
async function loadUsers() {
    try {
        const response = await fetch('api.php?action=users&token=' + encodeURIComponent(adminToken));
        const data = await response.json();
        
        if (data.success) {
            userData = data.users;
            renderUsersTable();
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showAdminToast('Error loading users', 'error');
    }
}

// Render Users Table
function renderUsersTable() {
    const container = document.getElementById('usersTable');
    
    container.innerHTML = userData.map(user => `
        <tr>
            <td><span class="wallet-address">${formatAddress(user.wallet_address)}</span></td>
            <td><span class="wallet-address">${formatAddress(user.upline_address)}</span></td>
            <td>${formatDate(user.join_time)}</td>
            <td>
                <span class="status-badge ${user.is_active ? 'status-verified' : 'status-pending'}">
                    ${user.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${user.total_earned} VNTT</td>
            <td>${user.total_withdrawn} VNTT</td>
            <td>${user.direct_referrals}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="viewUser('${user.wallet_address}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${!user.is_active ? `
                        <button class="btn-action btn-approve" onclick="activateUser('${user.wallet_address}')">
                            <i class="fas fa-bolt"></i>
                        </button>
                    ` : ''}
                    <button class="btn-action btn-reject" onclick="deleteUser('${user.wallet_address}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// View User Details
function viewUser(walletAddress) {
    const user = userData.find(u => u.wallet_address === walletAddress);
    if (!user) return;
    
    const modalBody = document.getElementById('userModalBody');
    modalBody.innerHTML = `
        <div class="user-details">
            <div class="detail-item">
                <strong>Wallet Address:</strong>
                <span class="wallet-address">${user.wallet_address}</span>
            </div>
            
            <div class="detail-item">
                <strong>Upline:</strong>
                <span class="wallet-address">${user.upline_address || 'None'}</span>
            </div>
            
            <div class="detail-item">
                <strong>Join Date:</strong>
                <span>${formatDate(user.join_time)}</span>
            </div>
            
            <div class="detail-item">
                <strong>Status:</strong>
                <span class="status-badge ${user.is_active ? 'status-verified' : 'status-pending'}">
                    ${user.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>
            
            <div class="detail-item">
                <strong>Activation Time:</strong>
                <span>${user.activation_time ? formatDate(user.activation_time) : 'Not activated'}</span>
            </div>
            
            <div class="detail-item">
                <strong>Total Earned:</strong>
                <span>${user.total_earned} VNTT</span>
            </div>
            
            <div class="detail-item">
                <strong>Locked Tokens:</strong>
                <span>${user.locked_tokens} VNTT</span>
            </div>
            
            <div class="detail-item">
                <strong>Total Withdrawn:</strong>
                <span>${user.total_withdrawn} VNTT</span>
            </div>
            
            <div class="detail-item">
                <strong>Direct Referrals:</strong>
                <span>${user.direct_referrals}</span>
            </div>
            
            <div class="detail-item">
                <strong>Completed Tasks:</strong>
                <span>${user.completed_tasks || 0}</span>
            </div>
            
            <div class="detail-item">
                <strong>Daily Claims:</strong>
                <span>${user.daily_claims || 0}</span>
            </div>
            
            <div class="detail-item">
                <strong>Last Claim:</strong>
                <span>${user.last_claim_time ? formatDate(user.last_claim_time) : 'Never'}</span>
            </div>
        </div>
        
        <div class="user-actions">
            ${!user.is_active ? `
                <button class="btn-primary" onclick="activateUser('${user.wallet_address}')">
                    <i class="fas fa-bolt"></i> Activate User
                </button>
            ` : `
                <button class="btn-warning" onclick="deactivateUser('${user.wallet_address}')">
                    <i class="fas fa-ban"></i> Deactivate User
                </button>
            `}
            <button class="btn-info" onclick="addTokens('${user.wallet_address}')">
                <i class="fas fa-plus-circle"></i> Add Tokens
            </button>
            <button class="btn-danger" onclick="deleteUser('${user.wallet_address}')">
                <i class="fas fa-trash"></i> Delete User
            </button>
        </div>
    `;
    
    document.getElementById('userModal').classList.add('active');
}

// Activate User
async function activateUser(walletAddress) {
    if (!confirm('Activate this user?')) return;
    
    try {
        const response = await fetch('api.php?action=activate-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: adminToken,
                wallet_address: walletAddress
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAdminToast('User activated successfully!', 'success');
            loadUsers();
        } else {
            showAdminToast(data.message || 'Activation failed', 'error');
        }
    } catch (error) {
        console.error('Error activating user:', error);
        showAdminToast('Error activating user', 'error');
    }
}

// Load Withdrawals
async function loadWithdrawals() {
    try {
        const response = await fetch('api.php?action=withdrawals&token=' + encodeURIComponent(adminToken));
        const data = await response.json();
        
        if (data.success) {
            withdrawalData = data.withdrawals;
            renderWithdrawalsTable();
            
            // Update stats
            updateWithdrawalStats();
        }
    } catch (error) {
        console.error('Error loading withdrawals:', error);
        showAdminToast('Error loading withdrawals', 'error');
    }
}

// Render Withdrawals Table
function renderWithdrawalsTable(filter = 'all') {
    const container = document.getElementById('withdrawalsTable');
    const filteredData = filter === 'all' 
        ? withdrawalData 
        : withdrawalData.filter(w => w.status === filter);
    
    container.innerHTML = filteredData.map(withdrawal => `
        <tr>
            <td>${withdrawal.id}</td>
            <td><span class="wallet-address">${formatAddress(withdrawal.user_address)}</span></td>
            <td>${withdrawal.amount} VNTT</td>
            <td>${withdrawal.fee} ${withdrawal.fee_method === 'vnt' ? 'VNT' : 'USDT'}</td>
            <td>${withdrawal.fee_method === 'vnt' ? 'VNT' : 'USDT'}</td>
            <td>${formatDate(withdrawal.requested_at)}</td>
            <td><span class="status-badge status-${withdrawal.status}">${withdrawal.status}</span></td>
            <td>
                ${withdrawal.transaction_hash ? 
                    `<a href="https://bscscan.com/tx/${withdrawal.transaction_hash}" target="_blank">View TX</a>` : 
                    'Pending'
                }
            </td>
            <td>
                <div class="action-buttons">
                    ${withdrawal.status === 'pending' ? `
                        <button class="btn-action btn-approve" onclick="approveWithdrawal(${withdrawal.id})">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action btn-reject" onclick="rejectWithdrawal(${withdrawal.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Update Withdrawal Stats
function updateWithdrawalStats() {
    const today = new Date().toDateString();
    const todayWithdrawals = withdrawalData.filter(w => 
        new Date(w.requested_at * 1000).toDateString() === today && 
        w.status === 'completed'
    );
    
    const totalWithdrawn = withdrawalData
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + parseFloat(w.amount), 0);
    
    const pendingWithdrawals = withdrawalData
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + parseFloat(w.amount), 0);
    
    document.getElementById('todayWithdrawals').textContent = todayWithdrawals.reduce((sum, w) => sum + parseFloat(w.amount), 0) + ' VNTT';
    document.getElementById('totalWithdrawn').textContent = totalWithdrawn + ' VNTT';
    document.getElementById('pendingWithdrawals').textContent = pendingWithdrawals + ' VNTT';
    
    // Update badge
    document.getElementById('withdrawalBadge').textContent = withdrawalData.filter(w => w.status === 'pending').length;
}

// Load Admin Tasks
async function loadAdminTasks() {
    try {
        const response = await fetch('api.php?action=tasks&token=' + encodeURIComponent(adminToken));
        const data = await response.json();
        
        if (data.success) {
            renderTasksGrid(data.tasks);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        showAdminToast('Error loading tasks', 'error');
    }
}

// Render Tasks Grid
function renderTasksGrid(tasks) {
    const container = document.getElementById('tasksGrid');
    
    container.innerHTML = tasks.map(task => `
        <div class="task-admin-card diamond-card" data-platform="${task.platform}">
            <div class="task-header">
                <div class="task-platform platform-${task.platform}">
                    <i class="fab fa-${task.platform}"></i>
                </div>
                <div class="task-actions">
                    <button class="btn-edit" onclick="editTask(${task.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteTask(${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <h4>${task.task_name}</h4>
            <p class="task-type">${task.task_type.toUpperCase()}</p>
            <p class="task-description">${task.description || 'No description'}</p>
            
            <div class="task-footer">
                <div class="task-reward">
                    <strong>${task.reward} VNTT</strong>
                </div>
                <div class="task-status">
                    <span class="status-badge ${task.is_active ? 'status-verified' : 'status-pending'}">
                        ${task.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// Show Add Task Modal
function showAddTaskModal() {
    document.getElementById('addTaskModal').classList.add('active');
}

// Add New Task
async function addNewTaskSubmit() {
    const form = document.getElementById('addTaskForm');
    const formData = new FormData(form);
    
    try {
        const response = await fetch('api.php?action=add-task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: adminToken,
                task_name: formData.get('taskName'),
                platform: formData.get('platform'),
                task_type: formData.get('taskType'),
                reward: formData.get('reward'),
                description: formData.get('description'),
                is_active: formData.get('isActive') ? 1 : 0
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAdminToast('Task added successfully!', 'success');
            document.getElementById('addTaskModal').classList.remove('active');
            form.reset();
            loadAdminTasks();
        } else {
            showAdminToast(data.message || 'Failed to add task', 'error');
        }
    } catch (error) {
        console.error('Error adding task:', error);
        showAdminToast('Error adding task', 'error');
    }
}

// Load Logs
async function loadLogs() {
    try {
        const response = await fetch('api.php?action=logs&token=' + encodeURIComponent(adminToken));
        const data = await response.json();
        
        if (data.success) {
            renderLogs(data.logs);
        }
    } catch (error) {
        console.error('Error loading logs:', error);
        showAdminToast('Error loading logs', 'error');
    }
}

// Render Logs
function renderLogs(logs) {
    const container = document.getElementById('activityLogs');
    
    // Default logs if none provided
    const defaultLogs = [
        { timestamp: Date.now()/1000, level: 'info', message: 'Admin logged in', user: 'System' },
        { timestamp: Date.now()/1000 - 3600, level: 'success', message: 'User registration completed', user: '0x1234...5678' },
        { timestamp: Date.now()/1000 - 7200, level: 'warning', message: 'Failed login attempt', user: 'Unknown' },
        { timestamp: Date.now()/1000 - 10800, level: 'error', message: 'Database connection error', user: 'System' }
    ];
    
    logs = logs || defaultLogs;
    
    container.innerHTML = logs.map(log => `
        <div class="log-item ${log.level}">
            <div class="log-time">${formatDate(log.timestamp)}</div>
            <div class="log-message">${log.message}</div>
            ${log.user ? `<div class="log-user">By: ${log.user}</div>` : ''}
        </div>
    `).join('');
}

// Helper Functions
function formatAddress(address) {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

function filterVerifications(status) {
    renderVerificationsTable(status);
}

function filterWithdrawals(status) {
    renderWithdrawalsTable(status);
}

function filterLogs(level) {
    // Implement log filtering
}

function filterAdminTasks(category) {
    const tasks = document.querySelectorAll('.task-admin-card');
    tasks.forEach(task => {
        if (category === 'all' || task.getAttribute('data-platform') === category) {
            task.style.display = 'block';
        } else {
            task.style.display = 'none';
        }
    });
}

function togglePassword() {
    const passwordInput = document.getElementById('adminPassword');
    const eyeIcon = document.querySelector('.btn-eye i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        eyeIcon.className = 'fas fa-eye';
    }
}

function showAdminToast(message, type = 'success') {
    const toast = document.getElementById('adminToast');
    const toastMessage = document.getElementById('adminToastMessage');
    
    toastMessage.textContent = message;
    toast.style.background = type === 'success' ? 'rgba(39, 174, 96, 0.9)' : 'rgba(231, 76, 60, 0.9)';
    
    toast.style.display = 'flex';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function showAdminLoading() {
    // Implement loading indicator
    console.log('Loading...');
}

function hideAdminLoading() {
    // Hide loading indicator
    console.log('Loading complete');
}

function refreshDashboard() {
    loadDashboard();
    showAdminToast('Dashboard refreshed', 'success');
}

// Export for global use
window.showTab = showTab;
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.togglePassword = togglePassword;
window.showAddTaskModal = showAddTaskModal;