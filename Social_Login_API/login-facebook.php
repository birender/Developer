<?php
session_start();
require_once 'path.php';
require 'common/facebook/facebook.php';
require 'common/config/fbconfig.php';

$APP_ID   = '389153114491559';
$APP_SECRET   = '8aeb5ee875c1429ae9af961ea4871a19';

$facebook = new Facebook(array(
            'appId' => APP_ID,
            'secret' => APP_SECRET,
            'cookie' => true
        ));

$session = $facebook->getSession();

if (!empty($session)) {
    # Active session, let's try getting the user id (getUser()) and user info (api->('/me'))
    try {
        $uid = $facebook->getUser();		
        $user = $facebook->api('/me');	
		
    } catch (Exception $e) {
   }

   
    if (!empty($user))
	{
		$_SESSION['CUP_OF_TEA']	= $user;
		header("Location: index.php?pass=1");
        
    } else {
        
        die("There was an error.");
    }
} else {
    
    $login_url = $facebook->getLoginUrl();
	header("Location: " . $login_url);
} 
?>
