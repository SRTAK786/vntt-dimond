<?php
// VNTT Configuration
define('SITE_NAME', 'VNTT Diamond Network');
define('SITE_URL', 'https://vnetworkservices.com/');
define('ADMIN_EMAIL', 'admin@yourdomain.com');
define('TELEGRAM_SUPPORT', 'https://t.me/vntt_support');

// Database Configuration
define('DB_PATH', __DIR__ . '/data/vntt.db');

// Smart Contract Addresses
define('CONTRACT_ADDRESS', '0x660251F2CFcE9c0f9aED1e4f7aa75EF9f0618c8c');
define('VNTT_TOKEN_ADDRESS', '0x6033849Dc89eC1DB364EFcd8A6cf9Bc095cD3e41');
define('USDT_TOKEN_ADDRESS', '0x55d398326f99059fF775485246999027B3197955');
define('VNT_TOKEN_ADDRESS', '0xD379Fd70C5C334bb31208122A6781ADB032D176f');

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
