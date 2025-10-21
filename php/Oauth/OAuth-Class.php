<?php
require_once __DIR__ . '/defs.php';

class CurlHandker
{
    public $curl;

    public function __construct($url = '')
    {
        $this->curl = curl_init($url);
        curl_setopt($this->curl, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        curl_setopt($this->curl, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($this->curl, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
        curl_setopt($this->curl, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
        $this->setPost();
    }

    public function setHeader($header)
    {
        curl_setopt($this->curl, CURLOPT_HTTPHEADER, $header);
    }

    public function setPost($value = true)
    {
        curl_setopt($this->curl, CURLOPT_POST, $value);
    }

    public function setQuery($query = [])
    {
        curl_setopt($this->curl, CURLOPT_POSTFIELDS, http_build_query($query));
    }

    public function runCurl()
    {
        return curl_exec($this->curl);
    }
}

class OAuth
{
    public $providername, $authURL, $tokenURL, $apiURL, $revokeURL, $scope;
    protected $secret, $cid;
    public $userinfo;

    public function __construct($providerInfo, $cid, $secret)
    {
        // Constructor code here
        $this->providername = $providerInfo['providername'];
        $this->authURL = $providerInfo['data']['authURL'];
        $this->tokenURL = $providerInfo['data']['tokenURL'];
        $this->apiURL = $providerInfo['data']['apiURL'];
        $this->revokeURL = $providerInfo['data']['revokeURL'];
        $this->scope = $providerInfo['data']['scope'];
        $this->cid = $cid;
        $this->secret = $secret;
    }

    public function getAuth($code)
    {
        $curl = new CurlHandker($this->tokenURL);
        $headers = ['Accept: application/json'];
        $curl->setHeader($headers);
        $params = array(
            'grant_type' => 'authorization_code',
            'client_id' => $this->cid,
            'client_secret' => $this->secret,
            'redirect_uri' => REDIRECTTOKENURI,
            'code' => $code
        );
        $curl->setQuery($params);
        $results = json_decode($curl->runCurl());
        return $results;
    }

    public function getAuthConfirm($token)
    {
        $curl = new CurlHandker($this->apiURL); // Always use @me for Discord
        $curl->setPost(false);

        $headers = [
            'Accept: application/json',
            'Authorization: Bearer ' . $token
        ];

        $curl->setHeader($headers);
        $response = $curl->runCurl();

        if (curl_errno($curl->curl)) {
            echo 'Curl Error: ' . curl_error($curl->curl);
        }

        $results = json_decode($response);

        if (!$results || isset($results->message)) {
            echo '<pre>Discord API error: ' . htmlspecialchars($response) . '</pre>';
        }

        $this->userinfo = $results;
        return $results;
    }

    public function login()
    {
        // Follow OAuth2 parameter names. If a state value has been stored in
        // the session by the caller, include it for CSRF protection.
        $params = array(
            'client_id' => $this->cid,
            'redirect_uri' => REDIRECT_URI,
            'response_type' => 'code',
            'scope' => $this->scope
        );

        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
        if (array_key_exists('oauth_state', $_SESSION) && !empty($_SESSION['oauth_state'])) {
            $params['state'] = $_SESSION['oauth_state'];
        }
        header('Location: ' . $this->authURL . '?' . http_build_query($params));
        die();
    }

    public function generateLoginText()
    {
        $name = htmlspecialchars($this->providername, ENT_QUOTES, 'UTF-8');
        return '<p><a href="?action=login&provider=' . $name . '">Login with ' . $name . '</a></p>';
    }

    public function getName()
    {
        return $this->userinfo->username;
    }

    public function getAvatar()
    {
        return 'https://cdn.discordapp.com/avatars/' . $this->getID() . '/' . $this->userinfo->avatar . '.png';
    }

    public function getID()
    {
        return $this->userinfo->id;
    }
}

class OAuthGitHub extends OAuth
{
    public function getName()
    {
        return $this->userinfo->login;
    }

    public function getAvatar()
    {
        return 'https://avatars.githubusercontent.com/u/' . $this->getID() . '?v=4';
    }
}

class ProviderHandle
{
    public $providerList = [];
    public $action, $activeProvider, $code, $access_token, $status;
    public $providerInstance;

    public function __construct()
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
        $this->action = $this->getGetParam('action');
        if ($this->getGetParam('provider'))
            $this->activeProvider = $this->getGetParam('provider');
        else
            $this->activeProvider = $this->getSessionValue('provider');
        $this->code = $this->getGetParam('code');
        $this->access_token = $this->getSessionValue('access_token');
    }

    public function performAction()
    {
        foreach ($this->providerList as $provider) {
            if ($provider->providername === $this->activeProvider) {
                $this->providerInstance = $provider;
                if ($this->action == 'login') {
                    $this->login();
                } else if ($this->action == 'logout') {
                    $this->logout();
                } else if ($this->code) {
                    $this->processCode();
                } else if ($this->getSessionValue('access_token')) {
                    $this->processToken();
                }
            }
        }
    }

    public function login()
    {
        $this->setSessionValue('provider', $this->providerInstance->providername);
        $this->status = 'logging in';
        $this->providerInstance->login();
    }

    public function logout()
    {
        $this->status = 'logged out';
        session_unset();
        header('Location: ' . $_SERVER['PHP_SELF']);
        die();
    }

    public function generateLogout()
    {
        return '<p><a href="?action=logout">Logout / Clear</a></p>';
    }

    public function processCode()
    {
        $result = $this->providerInstance->getAuth($this->code);
        if ($result->access_token) {
            $this->status = 'logged in';
            $this->setSessionValue('access_token', $result->access_token);
            $this->processToken();
        }
    }

    public function processToken()
    {
        $this->status = 'logged in';
        $this->providerInstance->getAuthConfirm($this->getSessionValue('access_token'));

        // Persist user to DB (requires php/dbconnect.php to set $pdo)
        $dbFile = __DIR__ . '/../config/dbconnect.php';
        if (file_exists($dbFile)) {
            require_once $dbFile;
        }

        if (isset($pdo) && $pdo instanceof PDO) {
            try {
                // normalize provider id string (e.g. "discord", "github")
                $provider = strtolower($this->providerInstance->providername);
                $provider_user_id = (string) $this->providerInstance->getID();
                $username = (string) $this->providerInstance->getName();
                $avatar = (string) $this->providerInstance->getAvatar();

                // Check if user exists
                $stmt = $pdo->prepare("SELECT id FROM WP_Users WHERE provider = :provider AND provider_user_id = :pid");
                $stmt->execute([
                    ':provider' => $provider,
                    ':pid' => $provider_user_id
                ]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    // Insert new user
                    $insert = $pdo->prepare(
                        "INSERT INTO WP_Users (provider, provider_user_id, username, avatar)
                         VALUES (:provider, :pid, :username, :avatar)"
                    );
                    $insert->execute([
                        ':provider' => $provider,
                        ':pid' => $provider_user_id,
                        ':username' => $username,
                        ':avatar' => $avatar
                    ]);
                    $userId = $pdo->lastInsertId();
                } else {
                    // Update existing user (optional)
                    $userId = $user['id'];
                    $update = $pdo->prepare(
                        "UPDATE WP_Users SET username = :username, avatar = :avatar WHERE id = :id"
                    );
                    $update->execute([
                        ':username' => $username,
                        ':avatar' => $avatar,
                        ':id' => $userId
                    ]);
                }

                // Save session values
                if (session_status() !== PHP_SESSION_ACTIVE) {
                    session_start();
                }
                $_SESSION['user_id'] = $userId;
                $_SESSION['username'] = $username;
                $_SESSION['avatar'] = $avatar;

            } catch (Throwable $e) {
                error_log("Database error: " . $e->getMessage());
            }
        } else {
            error_log("OAuth processToken: PDO \$pdo not available (dbconnect.php missing or failed).");
        }
    }

    public function addProvider($name, $cid, $secret)
    {
        $providerInfo = $this->getProviderData($name);
        if ($providerInfo !== null) {
            $className = $providerInfo['data']['class'];
            $this->providerList[] = new $className($providerInfo, $cid, $secret);
        }
    }

    public function getProviderData($name)
    {
        foreach (PROVIDERLIST as $provider) {
            if ($provider['providername'] === $name) {
                return $provider;
            }
        }
        return null;
    }

    public function generateLoginText()
    {
        $result = '';
        foreach ($this->providerList as $provider) {
            $result .= $provider->generateLoginText();
        }
        return $result;
    }

    public function getGetParam($key, $default = null)
    {
        return array_key_exists($key, $_GET) ? $_GET[$key] : $default;
    }

    public function getSessionValue($key, $default = null)
    {
        return array_key_exists($key, $_SESSION) ? $_SESSION[$key] : $default;
    }

    public function setSessionValue($key, $value)
    {
        $_SESSION[$key] = $value;
    }
}
