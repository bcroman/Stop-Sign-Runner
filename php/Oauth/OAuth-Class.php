<?php
// Load Definitions
require_once __DIR__ . '/defs.php';

// Class: Curl Handler Class
class CurlHandker
{
    public $curl;

    // Constructor: Setup Curl
    public function __construct($url = '')
    {
        $this->curl = curl_init($url);
        curl_setopt($this->curl, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        curl_setopt($this->curl, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($this->curl, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
        curl_setopt($this->curl, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
        $this->setPost();
    }

    // Function: Set Curl Header
    public function setHeader($header)
    {
        curl_setopt($this->curl, CURLOPT_HTTPHEADER, $header);
    }

    // Function: Set Curl Post
    public function setPost($value = true)
    {
        curl_setopt($this->curl, CURLOPT_POST, $value);
    }

    // Function: Set Curl Query
    public function setQuery($query = [])
    {
        curl_setopt($this->curl, CURLOPT_POSTFIELDS, http_build_query($query));
    }

    // Function: Run Curl
    public function runCurl()
    {
        return curl_exec($this->curl);
    }
}

// Class: 
class OAuth
{
    // OAth Provider Properties
    public $providername, $authURL, $tokenURL, $apiURL, $revokeURL, $scope;
    protected $secret, $cid;
    public $userinfo;

    // Constructor: Initialize OAuth Provider
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

    // Function: Get Auth Token
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

    // Function: Confirm Auth Request
    public function getAuthConfirm($token)
    {
        // Call Curl Handler
        $curl = new CurlHandker($this->apiURL);
        $curl->setPost(false);

        // Set Headers
        $headers = [
            'Accept: application/json',
            'Authorization: Bearer ' . $token
        ];

        // Run Curl Request
        $curl->setHeader($headers);
        $response = $curl->runCurl();

        // Check for Curl Errors
        if (curl_errno($curl->curl)) {
            echo 'Curl Error: ' . curl_error($curl->curl);
        }

        $results = json_decode($response); // Decode JSON Response

        // Check for API Errors
        if (!$results || isset($results->message)) {
            echo '<pre>Discord API error: ' . htmlspecialchars($response) . '</pre>';
        }

        // Save User Info
        $this->userinfo = $results;
        return $results;
    }

    // Function: Initiate Login Process
    public function login()
    {
        // Create OAuth2 parameter names
        $params = array(
            'client_id' => $this->cid,
            'redirect_uri' => REDIRECT_URI,
            'response_type' => 'code',
            'scope' => $this->scope
        );

        // Check Session if Active
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
        // Check for stored state values
        if (array_key_exists('oauth_state', $_SESSION) && !empty($_SESSION['oauth_state'])) {
            $params['state'] = $_SESSION['oauth_state'];
        }
        // Load Provider Auth URL
        header('Location: ' . $this->authURL . '?' . http_build_query($params));
        die();
    }

    // Function: Generate Login Text for Each Provider
    public function generateLoginText()
    {
        $name = htmlspecialchars($this->providername, ENT_QUOTES, 'UTF-8');
        return '<p><a class="btn" href="?action=login&provider=' . $name . '">Login with ' . $name . '</a></p>';
    }

    // Function: Get User Username
    public function getName()
    {
        return $this->userinfo->username;
    }

    // Function: Get Avatar URL
    public function getAvatar()
    {
        return 'https://cdn.discordapp.com/avatars/' . $this->getID() . '/' . $this->userinfo->avatar . '.png';
    }

    // Function: Get User ID
    public function getID()
    {
        return $this->userinfo->id;
    }
}

// Class: GitHub OAuth Extension of OAuth Class
class OAuthGitHub extends OAuth
{
    // Override: Get User ID Function
    public function getName()
    {
        return $this->userinfo->login;
    }

    // Override: Get Avatar URL Function
    public function getAvatar()
    {
        return 'https://avatars.githubusercontent.com/u/' . $this->getID() . '?v=4';
    }
}

// Class: Provider Handler
class ProviderHandle
{
    // Provider Handler Properties
    public $providerList = [];
    public $action, $activeProvider, $code, $access_token, $status;
    public $providerInstance;

    // Constructor: Initialize Provider Handler
    public function __construct()
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
        $this->action = $this->getGetParam('action');
        // Check for active provider
        if ($this->getGetParam('provider'))
            $this->activeProvider = $this->getGetParam('provider');
        else
            // Get provider from session
            $this->activeProvider = $this->getSessionValue('provider');
        $this->code = $this->getGetParam('code');
        $this->access_token = $this->getSessionValue('access_token');
    }

    // Function: Perform Action Based on User Input Status
    public function performAction()
    {
        foreach ($this->providerList as $provider) {
            if ($provider->providername === $this->activeProvider) {
                $this->providerInstance = $provider;
                // Perform Action
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

    // Function: Initiate Login Process
    public function login()
    {
        $this->setSessionValue('provider', $this->providerInstance->providername);
        $this->status = 'logging in';
        $this->providerInstance->login();
    }

    // Function: Logout User
    public function logout()
    {
        $this->status = 'logged out';
        session_unset();
        header('Location: ' . $_SERVER['PHP_SELF']);
        die();
    }

    // Function: Generate Logout Text
    public function generateLogout()
    {
        return '<p><a class="btn" href="?action=logout">Logout</a></p>';
    }

    // Function: Process Authorization Code
    public function processCode()
    {
        $result = $this->providerInstance->getAuth($this->code);
        // Check for access token
        if ($result->access_token) {
            $this->status = 'logged in';
            $this->setSessionValue('access_token', $result->access_token);
            $this->processToken();
        }
    }

    // Function: Process Token and Persist User
    public function processToken()
    {
        $this->status = 'logged in';
        $this->providerInstance->getAuthConfirm($this->getSessionValue('access_token'));

        // Load DB Connection
        $dbFile = __DIR__ . '/../config/dbconnect.php';
        if (file_exists($dbFile)) {
            require_once $dbFile;
        }

        // Check for PDO instance
        if (isset($pdo) && $pdo instanceof PDO) {
            try {
                // Get normalized provider info
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

                // Insert or update user
                if (!$user) {
                    // Insert new user
                    $insert = $pdo->prepare(
                        "INSERT INTO WP_Users (provider, provider_user_id, username, avatar)
                         VALUES (:provider, :pid, :username, :avatar)"
                    );
                    // Execute insert
                    $insert->execute([
                        ':provider' => $provider,
                        ':pid' => $provider_user_id,
                        ':username' => $username,
                        ':avatar' => $avatar
                    ]);
                    $userId = $pdo->lastInsertId();
                } else {
                    // Update existing user
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
                // Log error for debugging
                error_log("Database error: " . $e->getMessage());
            }
        } else {
            // Log error for debugging
            error_log("OAuth processToken: PDO \$pdo not available (dbconnect.php missing or failed).");
        }
    }

    // Function: Add Provider to Handler
    public function addProvider($name, $cid, $secret)
    {
        $providerInfo = $this->getProviderData($name);
        if ($providerInfo !== null) {
            $className = $providerInfo['data']['class'];
            $this->providerList[] = new $className($providerInfo, $cid, $secret);
        }
    }

    // Function: Get Provider Data by Name
    public function getProviderData($name)
    {
        foreach (PROVIDERLIST as $provider) {
            if ($provider['providername'] === $name) {
                return $provider;
            }
        }
        return null;
    }

    // Function: Generate Login Text for All Providers
    public function generateLoginText()
    {
        $result = '';
        foreach ($this->providerList as $provider) {
            $result .= $provider->generateLoginText();
        }
        return $result;
    }

    // Function: Get Parameter from GET Request
    public function getGetParam($key, $default = null)
    {
        return array_key_exists($key, $_GET) ? $_GET[$key] : $default;
    }

    // Function: Get Parameter from Session
    public function getSessionValue($key, $default = null)
    {
        return array_key_exists($key, $_SESSION) ? $_SESSION[$key] : $default;
    }

    // Function: Set Parameter in Session
    public function setSessionValue($key, $value)
    {
        $_SESSION[$key] = $value;
    }
}
