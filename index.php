<!DOCTYPE html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/style.css">
    <title>Stop Sign Runner - Home</title>

    <?php
    require_once ('php/Oauth/OAuth-Class.php');
    $handler = new ProviderHandle();
    $handler->addProvider('Discord', '1429770701958680608', '???');
    $handler->performAction();
    ?>
</head>

<body>
    <ul>
        <li><a href="index.html">Home</a></li>
        <li><a href="game.html">Play Game</a></li>
        <li><a href="about.html">About</a></li>
    </ul>

    <h1>Welcome to Stop Sign Runner</h1>

    <?php
    echo $handler->generateLoginText();
    ?>
</body>