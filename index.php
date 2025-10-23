<!DOCTYPE html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/style.css">
    <title>Stop Sign Runner - Home</title>

    <?php
    require_once('php/Oauth/OAuth-Class.php');
    $config = require_once('php/config/secrets.php');
    $handler = new ProviderHandle();
    $handler->addProvider('Discord', $config['Discord']['cid'], $config['Discord']['secret']);
    $handler->addProvider('GitHub', $config['GitHub']['cid'], $config['GitHub']['secret']);
    $handler->performAction();
    ?>
</head>

<body>
    <ul>
        <li><a href="index.php">Home</a></li>
        <li><a href="game.php">Play Game</a></li>
        <li><a href="leaderboard.php">Leaderboard</a></li>
        <li><a href="about.php">About</a></li>
    </ul>

    <h1>Welcome to Stop Sign Runner</h1>

    <div id="AccountDetails">
        <?php
        if ($handler->status === 'logged in') { // Account Details
            echo '<h2>Player Account</h2>';
            echo '<h3>' . htmlspecialchars($handler->providerInstance->getName(), ENT_QUOTES, 'UTF-8') . '</h3>';
            echo '<img src="' . htmlspecialchars($handler->providerInstance->getAvatar(), ENT_QUOTES, 'UTF-8') . '" alt="User Avatar" width="100">';
        } else { // Load Login Options
            echo '<p>Please login to start the Game and save your scores!</p>';
            echo $handler->generateLoginText();
        }
        ?>
    </div>

    <p><a href="game.php" class="btn">Play Now</a></p>

    <section class="instructions">
        <h3>How to Play</h3>
        <p>Dodge cars, score points, and stay alive as long as you can!</p>
    </section>

    <?php
    if ($handler->status === 'logged in') { // Account Details
        echo $handler->generateLogout();
    }
    ?>
</body>