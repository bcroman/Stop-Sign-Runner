<?php
session_start();

// Check if Token has a value, if not, not allow access to page.
if (empty($_SESSION['access_token'])) {
    header('Location: ./index.php');
    exit();
}
?>