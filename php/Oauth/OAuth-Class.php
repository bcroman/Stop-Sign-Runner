<?php
require_once __DIR__ . '/defs.php';

class OAuth
{
    public $providername, $authURL, $tokenURL, $apiURL, $revokeURL, $scope;
    protected $secret, $cid;

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
                }
            }
        }
    }

    public function login()
    {
        echo "Login Stub!";
        $this->setSessionValue('provider', $this->providerInstance->providername);
        $this->providerInstance->login();
    }

    public function logout()
    {
        echo "Logout Stub!";
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
