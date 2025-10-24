<?php
// Load Dependencies
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../config/dbconnect.php';

// Check login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;
}

// Parse incoming JSON Data From Gamme
$data = json_decode(file_get_contents('php://input'), true);
$score = intval($data['score'] ?? 0);

// Check if score is valid and DB connected
if ($score > 0 && isset($pdo) && $pdo instanceof PDO) {
    try {
        // Check if a score already exists for this user
        $stmt = $pdo->prepare("SELECT score FROM WP_Scores WHERE user_id = :uid ORDER BY score DESC LIMIT 1");
        $stmt->execute([':uid' => $_SESSION['user_id']]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        // Insert or update score
        if (!$existing) {
            // No record yet → insert new score
            $insert = $pdo->prepare("INSERT INTO WP_Scores (user_id, score) VALUES (:uid, :score)");
            $insert->execute([':uid' => $_SESSION['user_id'], ':score' => $score]);
        } elseif ($score > $existing['score']) {
            // Only update if this score is higher
            $update = $pdo->prepare("UPDATE WP_Scores SET score = :score, created_at = NOW() WHERE user_id = :uid");
            $update->execute([':uid' => $_SESSION['user_id'], ':score' => $score]);
        }

        echo json_encode(['status' => 'success']);
    } catch (PDOException $e) {
        // Log error for debugging
        error_log("DB update error: " . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
    }
} else {
    // Invalid score or DB not connected
    echo json_encode(['status' => 'error', 'message' => 'Invalid score or DB not connected']);
}