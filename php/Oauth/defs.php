<?php
// OAuth Definitions
define('REDIRECT_URI', 'https://compserver.uhi.ac.uk/~in21006366/Stop-Sign-Runner/');
define('REDIRECTTOKENURI', 'https://compserver.uhi.ac.uk/~in21006366/Stop-Sign-Runner/');

// Provider List
const PROVIDERLIST = array(
    [
        // Discord OAuth Settings
        'providername' => 'Discord',
        'data' => [
            'authURL' => 'https://discord.com/api/oauth2/authorize',
            'tokenURL' => 'https://discord.com/api/oauth2/token',
            'apiURL' => 'https://discord.com/api/users/@me',
            'revokeURL' => 'https://discord.com/api/oauth2/token/revoke',
            'scope' => 'identify',
            'class' => 'OAuth'
        ]
    ],
    [
        // GitHub OAuth Settings
        'providername' => 'GitHub',
        'data' => [
            'authURL' => 'https://github.com/login/oauth/authorize',
            'tokenURL' => 'https://github.com/login/oauth/access_token',
            'apiURL' => 'https://api.github.com/user',
            'revokeURL' => 'https://github.com/applications/########/grant',
            'scope' => 'user',
            'class' => 'OAuthGitHub'
        ]
    ]
);