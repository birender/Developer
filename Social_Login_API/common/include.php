<?php
if (array_key_exists("login", $_GET)) 
{
    $oauth_provider = $_GET['oauth_provider'];
    if ($oauth_provider == 'twitter') 
	{
        header("Location: login-twitter.php");
    } 
	else if ($oauth_provider == 'facebook') 
	{
		unset($_GET['returncode']);
        header("Location: login-facebook.php");
    }
}
?>
