<?php
session_start();

// Load DB connection
require_once __DIR__ . '/php/config/dbconnect.php';

try {
    // Get top 10 high scores (each user's best score)
    $stmt = $pdo->query("
        SELECT u.username, u.avatar, MAX(s.score) AS highscore
        FROM WP_Scores s
        JOIN WP_Users u ON u.id = s.user_id
        GROUP BY s.user_id
        ORDER BY highscore DESC
        LIMIT 10
    ");
    $leaders = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die('Database error: ' . $e->getMessage());
}
?>

<!DOCTYPE html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/style.css">
    <title>Stop Sign Runner - Leaderboard</title>
</head>

<body>

    <ul>
        <li><a href="index.php">Home</a></li>
        <li><a href="game.php">Play Game</a></li>
        <li><a href="leaderboard.php">Leaderboard</a></li>
        <li><a href="about.php">About</a></li>
    </ul>

    <h1>Leaderboard</h1>

    <p>Top 10 Highest Scores From Stop Sign Runner Game</p>

    <table id="leaderboard">
        <thead>
            <tr>
                <th>Position</th>
                <th>Username</th>
                <th>High Score</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $rank = 1;
            if (!empty($leaders)):
                foreach ($leaders as $row): ?>
                    <tr>
                        <td><?= $rank++ ?></td>
                        <td>
                            <?php if (!empty($row['avatar'])): ?>
                                <img src="<?= htmlspecialchars($row['avatar']) ?>" alt="Avatar" class="avatar">
                            <?php else: ?>
                                <img src="images/default-avatar.png" alt="Avatar" class="avatar">
                            <?php endif; ?>
                            <?= htmlspecialchars($row['username']) ?>
                        </td>
                        <td><?= htmlspecialchars($row['highscore']) ?></td>
                    </tr>
                <?php endforeach;
            else: ?>
                <tr>
                    <td colspan="3">No scores recorded yet.</td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>

</body>