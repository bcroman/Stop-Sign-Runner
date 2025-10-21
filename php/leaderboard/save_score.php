<?php
session_start();
header('Content-Type: application/json');

$dbFile = __DIR__ . '/../config/dbconnect.php';
if (file_exists($dbFile)) {
    require_once $dbFile;
}

// Check login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;
}

// Parse incoming JSON
$data = json_decode(file_get_contents('php://input'), true);
$score = intval($data['score'] ?? 0);

if ($score > 0 && isset($pdo) && $pdo instanceof PDO) {
    try {
        // Check if a score already exists for this user
        $stmt = $pdo->prepare("SELECT score FROM WP_Scores WHERE user_id = :uid ORDER BY score DESC LIMIT 1");
        $stmt->execute([':uid' => $_SESSION['user_id']]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

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
        error_log("DB update error: " . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid score or DB not connected']);
}