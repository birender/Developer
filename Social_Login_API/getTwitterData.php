<?php
require_once 'path.php';
require("common/twitter/twitteroauth.php");
require 'common/config/twconfig.php';

session_start();

if(isset($_GET['denied']))
{
	header("Location: ".SITE_URL."?fail");
}


if (!empty($_GET['oauth_verifier']) && !empty($_SESSION['oauth_token']) && !empty($_SESSION['oauth_token_secret'])) {
    // We've got everything we need
    $twitteroauth = new TwitterOAuth(YOUR_CONSUMER_KEY, YOUR_CONSUMER_SECRET, $_SESSION['oauth_token'], $_SESSION['oauth_token_secret']);
// Let's request the access token
    $access_token = $twitteroauth->getAccessToken($_GET['oauth_verifier']);
// Save it in a session var
    $_SESSION['access_token'] = $access_token;
// Let's get the user's info
    $user_info = $twitteroauth->get('account/verify_credentials');
// Print user's info
    //echo '<pre>';
   $_SESSION['CUP_OF_TWEET']	=	$user_info;
   
   if(isset($_SESSION['User']) && !empty($_SESSION['User']))
		header('Location: save.php');
	else
		header('Location: index.php?pass=1');
  // print_r($user_info);
 
}
?>
