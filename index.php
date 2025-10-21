<!DOCTYPE html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/style.css">
    <title>Stop Sign Runner - Home</title>

    <?php
    require_once ('php/Oauth/OAuth-Class.php');
    $config = require_once ('php/config/secrets.php');
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
        <li><a href="about.html">About</a></li>
    </ul>

    <h1>Welcome to Stop Sign Runner</h1>

    <?php
    if ($handler->status === 'logged in') {
        echo '<h2>' . htmlspecialchars($handler->providerInstance->getName(), ENT_QUOTES, 'UTF-8') . '</h2>';
        echo '<img src="' . htmlspecialchars($handler->providerInstance->getAvatar(), ENT_QUOTES, 'UTF-8') . '" alt="User Avatar" width="100">';
        echo $handler->generateLogout();
    } else {
        echo $handler->generateLoginText();
    }
    ?>

</body>