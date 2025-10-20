<?php
    require_once ('defs.php');

    class Oauth{
        public $providername, $authURL, $tokenURL, $apiURL, $revokeURL, $scope;
        protected $secert, $cid;

        public function _construct($providerInfo, $cid, $secret){ {
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
    }

    class ProviderHandle {
        public providerList = [];

        public function _construct() {
            // Constructor code here
        }

        public function addProvider($name, $cid, $secret){
            $providerInfo = $this->getProviderData($name);
            if ($providerInfo !== null) {
                array_push($this->providerList, new $providerInfo['data']['class']($providerInfo, $cid, $secret));
            }
        }

        public function getProviderData($name){
            foreach (PROVIDERLIST as $provider) {
                if ($provider['providername'] === $name) {
                    return $provider;
                }
            }
            return null;
        }
    }
?>