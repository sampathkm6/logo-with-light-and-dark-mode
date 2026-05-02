<?php
// api/db.php

$host = '127.0.0.1';
$db   = 'image-app';      // 👈 EXACTLY as shown in phpMyAdmin
$user = 'root';           // change if your MySQL user is different
$pass = '';               // change if your MySQL password is not empty
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo "DB connection failed: " . htmlspecialchars($e->getMessage());
    exit;
}
