<?php
// VNTT Configuration
define('SITE_NAME', 'VNTT Diamond Network');
define('SITE_URL', 'https://yourdomain.com/');
define('ADMIN_EMAIL', 'admin@yourdomain.com');
define('TELEGRAM_SUPPORT', 'https://t.me/vntt_support');

// Database Configuration
define('DB_PATH', __DIR__ . '/data/vntt.db');

// Smart Contract Addresses
define('CONTRACT_ADDRESS', 'YOUR_CONTRACT_ADDRESS');
define('VNTT_TOKEN_ADDRESS', 'YOUR_VNTT_TOKEN_ADDRESS');
define('USDT_TOKEN_ADDRESS', '0x55d398326f99059fF775485246999027B3197955');
define('VNT_TOKEN_ADDRESS', 'YOUR_VNT_TOKEN_ADDRESS');

// Network Configuration
define('NETWORK', 'BSC');
define('RPC_URL', 'https://bsc-dataseed.binance.org/');
define('CHAIN_ID', '56');

// Fees and Rewards
define('ACTIVATION_FEE', 0.30); // USDT
define('WITHDRAWAL_FEE', 0.10); // VNT or USDT
define('DAILY_REWARD', 100); // VNTT
define('ACTIVATION_BONUS', 100); // VNTT
define('REFERRAL_REWARDS', [100, 80, 60, 40, 20, 10, 10, 10, 10, 10]);

// Security
define('ADMIN_TOKEN', 'vnttadmin2024');
define('UPLOAD_PATH', __DIR__ . '/uploads/');
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024); // 5MB

// Enable/Disable Features
define('REGISTRATION_OPEN', true);
define('WITHDRAWAL_OPEN', true);
define('MAINTENANCE_MODE', false);
?>
