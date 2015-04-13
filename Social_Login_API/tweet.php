<?php
session_start();
 
$consumerKey = 'Mhx5aAPACkoGex1iRVyYzQ';
$consumerSecret = '7Czotv0JK89Ek8NRZA5nrOnwCWPWyV4HS1oFo3rB8';
require("common/twitter/twitteroauth.php");

  $twitteroauth = new TwitterOAuth($consumerKey, $consumerSecret);
  
   $OAuthToken=$_SESSION['access_token']['oauth_token'];
  
  $OAuthSecret=$_SESSION['access_token']['oauth_token_secret'];
  
  $tweet = new TwitterOAuth($consumerKey, $consumerSecret, $OAuthToken, $OAuthSecret);

// Your Message
// Send tweet 
$tweet->post('statuses/update', array('status' => "$message"));
?>