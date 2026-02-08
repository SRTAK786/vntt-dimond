<?php
// VNTT Diamond Network - API Backend
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Database configuration
$db_file = __DIR__ . '/data/vntt.db';

// Create directories if they don't exist
if (!file_exists(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0777, true);
}
if (!file_exists(__DIR__ . '/uploads')) {
    mkdir(__DIR__ . '/uploads', 0777, true);
}

// Initialize SQLite database
function initDB() {
    global $db_file;
    
    try {
        $db = new SQLite3($db_file);
        
        // Create users table
        $db->exec('CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT UNIQUE NOT NULL,
            upline_address TEXT,
            is_active INTEGER DEFAULT 0,
            activation_time INTEGER,
            total_earned REAL DEFAULT 0,
            locked_tokens REAL DEFAULT 0,
            total_withdrawn REAL DEFAULT 0,
            direct_referrals INTEGER DEFAULT 0,
            join_time INTEGER DEFAULT (strftime("%s","now")),
            last_claim_time INTEGER DEFAULT 0,
            has_paid_activation INTEGER DEFAULT 0,
            daily_claims INTEGER DEFAULT 0,
            completed_tasks INTEGER DEFAULT 0
        )');
        
        // Create tasks table
        $db->exec('CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            platform TEXT NOT NULL,
            task_type TEXT NOT NULL,
            task_name TEXT NOT NULL,
            reward REAL NOT NULL,
            is_active INTEGER DEFAULT 1
        )');
        
        // Create verifications table
        $db->exec('CREATE TABLE IF NOT EXISTS verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_address TEXT NOT NULL,
            task_id INTEGER NOT NULL,
            verification_type TEXT NOT NULL,
            proof_url TEXT,
            screenshot_path TEXT,
            user_name TEXT,
            additional_notes TEXT,
            status TEXT DEFAULT "pending",
            submitted_at INTEGER DEFAULT (strftime("%s","now")),
            verified_at INTEGER,
            verified_by TEXT,
            reward_distributed INTEGER DEFAULT 0
        )');
        
        // Create withdrawals table
        $db->exec('CREATE TABLE IF NOT EXISTS withdrawals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_address TEXT NOT NULL,
            amount REAL NOT NULL,
            fee REAL NOT NULL,
            fee_method TEXT NOT NULL,
            status TEXT DEFAULT "pending",
            transaction_hash TEXT,
            requested_at INTEGER DEFAULT (strftime("%s","now")),
            processed_at INTEGER
        )');
        
        // Create referrals table
        $db->exec('CREATE TABLE IF NOT EXISTS referrals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            referrer TEXT NOT NULL,
            referee TEXT NOT NULL,
            level INTEGER DEFAULT 1,
            reward_earned REAL DEFAULT 0,
            created_at INTEGER DEFAULT (strftime("%s","now"))
        )');
        
        // Insert default tasks if empty
        $result = $db->query('SELECT COUNT(*) as count FROM tasks');
        $row = $result->fetchArray(SQLITE3_ASSOC);
        
        if ($row['count'] == 0) {
            $default_tasks = [
                [0, 'facebook', 'follow', 'Follow Facebook Page', 100],
                [1, 'facebook', 'like', 'Like Facebook Post', 50],
                [2, 'facebook', 'share', 'Share Facebook Post', 50],
                [3, 'facebook', 'comment', 'Comment on Facebook Post', 50],
                [4, 'twitter', 'follow', 'Follow Twitter Account', 100],
                [5, 'twitter', 'like', 'Like Tweet', 50],
                [6, 'twitter', 'retweet', 'Retweet', 50],
                [7, 'twitter', 'comment', 'Comment on Tweet', 50],
                [8, 'instagram', 'follow', 'Follow Instagram Account', 100],
                [9, 'instagram', 'like', 'Like Instagram Post', 50],
                [10, 'instagram', 'share', 'Share Instagram Post', 50],
                [11, 'instagram', 'comment', 'Comment on Instagram Post', 50],
                [12, 'youtube', 'subscribe', 'Subscribe YouTube Channel', 100],
                [13, 'youtube', 'like', 'Like YouTube Video', 50],
                [14, 'youtube', 'share', 'Share YouTube Video', 50],
                [15, 'youtube', 'comment', 'Comment on YouTube Video', 50],
                [16, 'telegram', 'join', 'Join Telegram Channel', 100],
                [17, 'telegram', 'join', 'Join Telegram Group', 100],
                [18, 'telegram', 'share', 'Share Telegram Post', 50],
                [19, 'telegram', 'comment', 'Comment in Telegram Group', 50]
            ];
            
            $stmt = $db->prepare('INSERT INTO tasks (task_id, platform, task_type, task_name, reward) VALUES (?, ?, ?, ?, ?)');
            
            foreach ($default_tasks as $task) {
                $stmt->bindValue(1, $task[0], SQLITE3_INTEGER);
                $stmt->bindValue(2, $task[1], SQLITE3_TEXT);
                $stmt->bindValue(3, $task[2], SQLITE3_TEXT);
                $stmt->bindValue(4, $task[3], SQLITE3_TEXT);
                $stmt->bindValue(5, $task[4], SQLITE3_FLOAT);
                $stmt->execute();
            }
        }
        
        $db->close();
        return true;
    } catch (Exception $e) {
        error_log("Database initialization error: " . $e->getMessage());
        return false;
    }
}

// Initialize database
initDB();

// Get request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Handle CORS preflight
if ($method == 'OPTIONS') {
    exit(0);
}

// Handle API requests
if ($method == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    switch ($action) {
        case 'register':
            handleRegister($input);
            break;
        case 'submit-proof':
            handleSubmitProof($input);
            break;
        case 'admin-verify':
            handleAdminVerify($input);
            break;
        case 'get-user':
            handleGetUser($input);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} elseif ($method == 'GET') {
    switch ($action) {
        case 'tasks':
            getTasks();
            break;
        case 'user-verifications':
            $address = $_GET['address'] ?? '';
            getUserVerifications($address);
            break;
        case 'pending-verifications':
            getPendingVerifications();
            break;
        case 'stats':
            getStats();
            break;
        case 'withdrawals':
            $address = $_GET['address'] ?? '';
            getWithdrawals($address);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

// Handle user registration
function handleRegister($data) {
    global $db_file;
    
    if (empty($data['wallet_address']) || empty($data['upline_address'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        return;
    }
    
    try {
        $db = new SQLite3($db_file);
        
        // Check if already registered
        $stmt = $db->prepare('SELECT * FROM users WHERE wallet_address = :address');
        $stmt->bindValue(':address', $data['wallet_address'], SQLITE3_TEXT);
        $result = $stmt->execute();
        
        if ($result->fetchArray()) {
            echo json_encode(['success' => false, 'message' => 'Already registered']);
            return;
        }
        
        // Check if upline exists
        $stmt = $db->prepare('SELECT * FROM users WHERE wallet_address = :upline');
        $stmt->bindValue(':upline', $data['upline_address'], SQLITE3_TEXT);
        $result = $stmt->execute();
        
        if (!$result->fetchArray()) {
            echo json_encode(['success' => false, 'message' => 'Invalid upline address']);
            return;
        }
        
        // Insert user
        $stmt = $db->prepare('INSERT INTO users (wallet_address, upline_address, join_time) VALUES (:address, :upline, strftime("%s","now"))');
        $stmt->bindValue(':address', $data['wallet_address'], SQLITE3_TEXT);
        $stmt->bindValue(':upline', $data['upline_address'], SQLITE3_TEXT);
        
        if ($stmt->execute()) {
            // Update upline's referral count
            $stmt = $db->prepare('UPDATE users SET direct_referrals = direct_referrals + 1 WHERE wallet_address = :upline');
            $stmt->bindValue(':upline', $data['upline_address'], SQLITE3_TEXT);
            $stmt->execute();
            
            echo json_encode(['success' => true, 'message' => 'Registration successful']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Registration failed']);
        }
        
        $db->close();
    } catch (Exception $e) {
        error_log("Registration error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Server error']);
    }
}

// Handle proof submission
function handleSubmitProof($data) {
    global $db_file;
    
    if (empty($data['user_address']) || empty($data['task_id'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        return;
    }
    
    try {
        $db = new SQLite3($db_file);
        
        // Check if already submitted
        $stmt = $db->prepare('SELECT * FROM verifications WHERE user_address = :address AND task_id = :task_id');
        $stmt->bindValue(':address', $data['user_address'], SQLITE3_TEXT);
        $stmt->bindValue(':task_id', $data['task_id'], SQLITE3_INTEGER);
        $result = $stmt->execute();
        
        if ($result->fetchArray()) {
            echo json_encode(['success' => false, 'message' => 'Already submitted']);
            return;
        }
        
        // Handle file upload
        $screenshot_path = null;
        if (!empty($_FILES['screenshot'])) {
            $file = $_FILES['screenshot'];
            $filename = uniqid() . '_' . basename($file['name']);
            $upload_path = __DIR__ . '/uploads/' . $filename;
            
            if (move_uploaded_file($file['tmp_name'], $upload_path)) {
                $screenshot_path = 'uploads/' . $filename;
            }
        }
        
        // Insert verification
        $stmt = $db->prepare('INSERT INTO verifications 
            (user_address, task_id, verification_type, proof_url, screenshot_path, user_name, additional_notes) 
            VALUES (:address, :task_id, :type, :proof_url, :screenshot, :username, :notes)');
        
        $stmt->bindValue(':address', $data['user_address'], SQLITE3_TEXT);
        $stmt->bindValue(':task_id', $data['task_id'], SQLITE3_INTEGER);
        $stmt->bindValue(':type', $data['type'] ?? 'screenshot', SQLITE3_TEXT);
        $stmt->bindValue(':proof_url', $data['proof_url'] ?? null, SQLITE3_TEXT);
        $stmt->bindValue(':screenshot', $screenshot_path, SQLITE3_TEXT);
        $stmt->bindValue(':username', $data['user_name'] ?? null, SQLITE3_TEXT);
        $stmt->bindValue(':notes', $data['additional_notes'] ?? null, SQLITE3_TEXT);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Proof submitted successfully',
                'verification_id' => $db->lastInsertRowID()
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Submission failed']);
        }
        
        $db->close();
    } catch (Exception $e) {
        error_log("Proof submission error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Server error']);
    }
}

// Get tasks
function getTasks() {
    global $db_file;
    
    try {
        $db = new SQLite3($db_file);
        $result = $db->query('SELECT * FROM tasks WHERE is_active = 1 ORDER BY task_id');
        
        $tasks = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $tasks[] = $row;
        }
        
        echo json_encode(['success' => true, 'tasks' => $tasks]);
        $db->close();
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch tasks']);
    }
}

// Get user verifications
function getUserVerifications($address) {
    global $db_file;
    
    try {
        $db = new SQLite3($db_file);
        $stmt = $db->prepare('
            SELECT v.*, t.task_name, t.platform, t.reward 
            FROM verifications v 
            LEFT JOIN tasks t ON v.task_id = t.task_id 
            WHERE v.user_address = :address 
            ORDER BY v.submitted_at DESC
        ');
        $stmt->bindValue(':address', $address, SQLITE3_TEXT);
        $result = $stmt->execute();
        
        $verifications = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $verifications[] = $row;
        }
        
        echo json_encode(['success' => true, 'verifications' => $verifications]);
        $db->close();
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch verifications']);
    }
}

// Get pending verifications (admin only)
function getPendingVerifications() {
    global $db_file;
    
    // Simple admin check
    $token = $_GET['token'] ?? '';
    if ($token !== 'vntt2627') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        return;
    }
    
    try {
        $db = new SQLite3($db_file);
        $result = $db->query('
            SELECT v.*, t.task_name, t.platform, t.reward 
            FROM verifications v 
            LEFT JOIN tasks t ON v.task_id = t.task_id 
            WHERE v.status = "pending" 
            ORDER BY v.submitted_at ASC
        ');
        
        $verifications = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $verifications[] = $row;
        }
        
        echo json_encode(['success' => true, 'verifications' => $verifications]);
        $db->close();
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch verifications']);
    }
}

// Admin verify task
function handleAdminVerify($data) {
    global $db_file;
    
    // Admin check
    $token = $data['token'] ?? '';
    if ($token !== 'vntt2627') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        return;
    }
    
    if (empty($data['verification_id']) || empty($data['status'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        return;
    }
    
    try {
        $db = new SQLite3($db_file);
        
        // Update verification status
        $stmt = $db->prepare('
            UPDATE verifications 
            SET status = :status, 
                verified_at = strftime("%s","now"), 
                verified_by = "admin" 
            WHERE id = :id
        ');
        $stmt->bindValue(':status', $data['status'], SQLITE3_TEXT);
        $stmt->bindValue(':id', $data['verification_id'], SQLITE3_INTEGER);
        
        if ($stmt->execute()) {
            // If verified, update user's tokens
            if ($data['status'] == 'verified') {
                // Get verification details
                $stmt = $db->prepare('
                    SELECT v.user_address, t.reward 
                    FROM verifications v 
                    LEFT JOIN tasks t ON v.task_id = t.task_id 
                    WHERE v.id = :id
                ');
                $stmt->bindValue(':id', $data['verification_id'], SQLITE3_INTEGER);
                $result = $stmt->execute();
                $verification = $result->fetchArray(SQLITE3_ASSOC);
                
                if ($verification) {
                    // Update user's tokens
                    $stmt = $db->prepare('
                        UPDATE users 
                        SET total_earned = total_earned + :reward,
                            locked_tokens = locked_tokens + :reward,
                            completed_tasks = completed_tasks + 1
                        WHERE wallet_address = :address
                    ');
                    $stmt->bindValue(':reward', $verification['reward'], SQLITE3_FLOAT);
                    $stmt->bindValue(':address', $verification['user_address'], SQLITE3_TEXT);
                    $stmt->execute();
                    
                    // Mark as distributed
                    $db->exec("UPDATE verifications SET reward_distributed = 1 WHERE id = {$data['verification_id']}");
                }
            }
            
            echo json_encode(['success' => true, 'message' => 'Verification updated']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Update failed']);
        }
        
        $db->close();
    } catch (Exception $e) {
        error_log("Admin verify error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Server error']);
    }
}

// Get user data
function handleGetUser($data) {
    global $db_file;
    
    if (empty($data['wallet_address'])) {
        echo json_encode(['success' => false, 'message' => 'Wallet address required']);
        return;
    }
    
    try {
        $db = new SQLite3($db_file);
        
        $stmt = $db->prepare('SELECT * FROM users WHERE wallet_address = :address');
        $stmt->bindValue(':address', $data['wallet_address'], SQLITE3_TEXT);
        $result = $stmt->execute();
        $user = $result->fetchArray(SQLITE3_ASSOC);
        
        if ($user) {
            // Get referral count
            $stmt = $db->prepare('SELECT COUNT(*) as count FROM referrals WHERE referrer = :address');
            $stmt->bindValue(':address', $data['wallet_address'], SQLITE3_TEXT);
            $result = $stmt->execute();
            $refCount = $result->fetchArray(SQLITE3_ASSOC);
            
            // Get completed tasks
            $stmt = $db->prepare('SELECT COUNT(*) as count FROM verifications WHERE user_address = :address AND status = "verified"');
            $stmt->bindValue(':address', $data['wallet_address'], SQLITE3_TEXT);
            $result = $stmt->execute();
            $taskCount = $result->fetchArray(SQLITE3_ASSOC);
            
            $user['referral_count'] = $refCount['count'];
            $user['verified_tasks'] = $taskCount['count'];
            
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            echo json_encode(['success' => false, 'message' => 'User not found']);
        }
        
        $db->close();
    } catch (Exception $e) {
        error_log("Get user error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Server error']);
    }
}

// Get stats
function getStats() {
    global $db_file;
    
    try {
        $db = new SQLite3($db_file);
        
        $total_users = $db->querySingle('SELECT COUNT(*) FROM users');
        $active_users = $db->querySingle('SELECT COUNT(*) FROM users WHERE is_active = 1');
        $total_earned = $db->querySingle('SELECT SUM(total_earned) FROM users');
        $total_withdrawn = $db->querySingle('SELECT SUM(total_withdrawn) FROM users');
        $pending_verifications = $db->querySingle('SELECT COUNT(*) FROM verifications WHERE status = "pending"');
        
        echo json_encode([
            'success' => true,
            'stats' => [
                'total_users' => $total_users,
                'active_users' => $active_users,
                'total_earned' => $total_earned ?: 0,
                'total_withdrawn' => $total_withdrawn ?: 0,
                'pending_verifications' => $pending_verifications
            ]
        ]);
        
        $db->close();
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch stats']);
    }
}

// Get withdrawals
function getWithdrawals($address) {
    global $db_file;
    
    try {
        $db = new SQLite3($db_file);
        $stmt = $db->prepare('SELECT * FROM withdrawals WHERE user_address = :address ORDER BY requested_at DESC');
        $stmt->bindValue(':address', $address, SQLITE3_TEXT);
        $result = $stmt->execute();
        
        $withdrawals = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $withdrawals[] = $row;
        }
        
        echo json_encode(['success' => true, 'withdrawals' => $withdrawals]);
        $db->close();
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch withdrawals']);
    }
}
?>
