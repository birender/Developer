<?php
session_start();
require_once 'path.php';
require_once 'common/facebook/facebook.php';
require_once 'common/facebook/fbconfig.php';
require_once 'common/include.php';

$user = $facebook->getUser();

	if ($user)
	{
		try {
		$facebook->api("/me/feed", "post", array(
		'message' => "Check Into Cash from test side.",
		'name' => "Check Into Cash",
		'caption' => "Check Into Cash"
		));} catch(Exception $e){}
	}

else 
{
	$loginUrl = $facebook->getLoginUrl(array( 'scope' => 'email,user_birthday,publish_stream'));
}
$loginUrl = $facebook->getLoginUrl(array( 'scope' => 'email,user_birthday,publish_stream'));	

$access_token_title='fb_'.APP_SECRET.'_access_token';

?>
<html>
<head>
<title>Test</title>
</head>
<body>

			<a href="<?php echo $loginUrl; ?>">	
			<img src="images/facebook_button.png">	
			</a>
</body>
</html>