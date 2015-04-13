<?php 
ob_start();
session_start();
require_once 'path.php';
require_once 'common/facebook/facebook.php';
require_once 'common/facebook/fbconfig.php';
require_once 'common/include.php';
require_once 'common/config.php';

//print_r($_REQUEST); exit;
$user = $facebook->getUser();
if((isset($user) && !empty($user)) || (isset($_REQUEST['wall_post']) && ($_REQUEST['wall_post']==1)))//facebook
{ 
	
	if ($user)
	{
		try {
		$facebook->api("/me/feed", "post", array(
		'message' => "Check Into Cash",
		'name' => "Check Into Cash",
		'caption' => "Check Into Cash"
		));} catch(Exception $e){}
	}
	else {
		$loginUrl1 = $facebook->getLoginUrl(array( 'scope' => 'email,user_birthday,publish_stream'));	
		$access_token_title='fb_'.APP_SECRET.'_access_token';
		
		$dob=$_REQUEST['q5_birthDate']['day'].'/'.$_REQUEST['q5_birthDate']['month'].'/'.$_REQUEST['q5_birthDate']['year'];
		$_SESSION['User']['firstname'] = $_REQUEST['q1_firstName'];
		$_SESSION['User']['email'] = $_REQUEST['q4_emailAddress'];
		$_SESSION['User']['dob'] = $dob;
		$_SESSION['User']['gender'] = $_REQUEST['q6_gender6'];
		$_SESSION['User']['add1'] = $_REQUEST['q8_address']['addr_line1'];
		$_SESSION['User']['add2'] = $_REQUEST['q8_address']['addr_line2'];
		$_SESSION['User']['city'] = $_REQUEST['q8_address']['city'];
		$_SESSION['User']['state'] = $_REQUEST['q8_address']['state'];
		$_SESSION['User']['postal'] = $_REQUEST['q8_address']['postal'];
		$_SESSION['User']['country'] = $_REQUEST['q8_address']['country'];
		header( 'Location:'.$loginUrl1) ;
		exit;		
	}
}
if((isset($_SESSION['User']['twitter']) && !empty($_SESSION['User']['twitter'])) || (isset($_REQUEST['wall_post']) && ($_REQUEST['wall_post']==2)))//twitter
{ 
	if(isset($_REQUEST['twitter_enable']) && ($_REQUEST['twitter_enable']==2)) {
		$dob=$_REQUEST['q5_birthDate']['day'].'/'.$_REQUEST['q5_birthDate']['month'].'/'.$_REQUEST['q5_birthDate']['year'];
		$_SESSION['User']['firstname'] = $_REQUEST['q1_firstName'];
		$_SESSION['User']['email'] = $_REQUEST['q4_emailAddress'];
		$_SESSION['User']['dob'] = $dob;
		$_SESSION['User']['gender'] = $_REQUEST['q6_gender6'];
		$_SESSION['User']['add1'] = $_REQUEST['q8_address']['addr_line1'];
		$_SESSION['User']['add2'] = $_REQUEST['q8_address']['addr_line2'];
		$_SESSION['User']['city'] = $_REQUEST['q8_address']['city'];
		$_SESSION['User']['state'] = $_REQUEST['q8_address']['state'];
		$_SESSION['User']['postal'] = $_REQUEST['q8_address']['postal'];
		$_SESSION['User']['country'] = $_REQUEST['q8_address']['country'];
		$_SESSION['User']['twitter'] = 2;
		$_SESSION['User']['twt'] = 2;
		//echo $_SERVER['PHP_SELF'].'?login&oauth_provider=twitter'; exit;
		header( 'Location:'.$_SERVER['PHP_SELF'].'?login&oauth_provider=twitter') ;
		exit;
	}
	if(isset($_SESSION['User']['twt']) && $_SESSION['User']['twt']==2) {
		unset($_SESSION['User']['twt']);
		exit();
	}
	require 'common/config/twconfig.php';
	require("common/twitter/twitteroauth.php");
	$twitteroauth = new TwitterOAuth(YOUR_CONSUMER_KEY, YOUR_CONSUMER_SECRET);  
	
	$OAuthToken=$_SESSION['access_token']['oauth_token'];  
	$OAuthSecret=$_SESSION['access_token']['oauth_token_secret'];  
	
	$tweet = new TwitterOAuth(YOUR_CONSUMER_KEY, YOUR_CONSUMER_SECRET, $OAuthToken, $OAuthSecret);
	// Your Message
	$message = "Check into Cash";
	// Send tweet 
	$tweet->post('statuses/update', array('status' => "$message"));
}

if((isset($_SESSION['User']['google']) && !empty($_SESSION['User']['google'])) || (isset($_REQUEST['wall_post']) && ($_REQUEST['wall_post']==3)))//google plus
{
	//google plus does not allow permission to write his wall
	if(isset($_REQUEST['gmail_enable']) && ($_REQUEST['gmail_enable']==3)) {
		$dob=$_REQUEST['q5_birthDate']['day'].'/'.$_REQUEST['q5_birthDate']['month'].'/'.$_REQUEST['q5_birthDate']['year'];
		$_SESSION['User']['firstname'] = $_REQUEST['q1_firstName'];
		$_SESSION['User']['email'] = $_REQUEST['q4_emailAddress'];
		$_SESSION['User']['dob'] = $dob;
		$_SESSION['User']['gender'] = $_REQUEST['q6_gender6'];
		$_SESSION['User']['add1'] = $_REQUEST['q8_address']['addr_line1'];
		$_SESSION['User']['add2'] = $_REQUEST['q8_address']['addr_line2'];
		$_SESSION['User']['city'] = $_REQUEST['q8_address']['city'];
		$_SESSION['User']['state'] = $_REQUEST['q8_address']['state'];
		$_SESSION['User']['postal'] = $_REQUEST['q8_address']['postal'];
		$_SESSION['User']['country'] = $_REQUEST['q8_address']['country'];
		$_SESSION['User']['google'] = 2;
		
		foreach($_SESSION as $key=>$value) {
			if($key != 'User')
				unset($_SESSION[$key]);
		}
		
		require 'gplus/gplus_login.php';
		header( 'Location:'.$authUrl) ;
		exit;
	}
}



if(isset($_SESSION['User']) && !empty($_SESSION['User'])) {
		$_REQUEST['q1_firstName'] = $_SESSION['User']['firstname'];
		$_REQUEST['q4_emailAddress'] = $_SESSION['User']['email'];
		$dob = $_SESSION['User']['dob'];
		$_REQUEST['q6_gender6'] = $_SESSION['User']['gender'];
		$_REQUEST['q8_address']['addr_line1'] = $_SESSION['User']['add1'];
		$_REQUEST['q8_address']['addr_line2'] = $_SESSION['User']['add2'];
		$_REQUEST['q8_address']['city'] = $_SESSION['User']['city'];
		$_REQUEST['q8_address']['state'] = $_SESSION['User']['state'];
		$_REQUEST['q8_address']['postal'] = $_SESSION['User']['postal'];
		$_REQUEST['q8_address']['country'] = $_SESSION['User']['country'];
}
else {
	$dob=$_REQUEST['q5_birthDate']['day'].'/'.$_REQUEST['q5_birthDate']['month'].'/'.$_REQUEST['q5_birthDate']['year'];
}

$qry	=	"Insert into user set uname='".mysql_real_escape_string($_REQUEST['q1_firstName'])."',email='".mysql_real_escape_string($_REQUEST['q4_emailAddress'])."',gender='".mysql_real_escape_string($_REQUEST['q6_gender6'])."',Add1='".mysql_real_escape_string($_REQUEST['q8_address']['addr_line1'])."',Add2='".mysql_real_escape_string($_REQUEST['q8_address']['addr_line2'])."',city='".mysql_real_escape_string($_REQUEST['q8_address']['city'])."',state='".mysql_real_escape_string($_REQUEST['q8_address']['state'])."',zip='".mysql_real_escape_string($_REQUEST['q8_address']['postal'])."',country='".mysql_real_escape_string($_REQUEST['q8_address']['country'])."',DOB='".$dob."',created_at=NOW()";

mysql_query($qry);

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Check Into Cash | Money Matters october Newsletter | Register to win $2400 towards your annual grocery cost</title>
<link href="css/october_sweeps.css" rel="stylesheet" type="text/css" />
<script src="http://max.jotfor.ms/min/g=jotform?3.1.330" type="text/javascript"></script>

<script type="text/javascript">
   JotForm.init();
</script>
<link href="http://max.jotfor.ms/min/g=formCss?3.1.330" rel="stylesheet" type="text/css" />
<link type="text/css" rel="stylesheet" href="http://jotformpro.com/css/styles/nova.css?3.1.330" />
</head>

<body>
<?php if(isset($_GET['fail_return'])) {  unset($_GET['fail']);?>
<div class="error" style="text-align:center;margin-top:5px;color:red;font-weight:bold;">Please Create Profile on Google Plus
</div>
<?php }?>
<div class="oct_container">
	<p style="font-family:Lucida Grande,Lucida Sans Unicode,Lucida Sans,Verdana,Tahoma,sans-serif;color:green;font-weight:bold;text-align:center;padding-top:10px;"> Your Account Details has been Submitted!&nbsp; <a style="text-decoration:none;" href="http://nile.impingesolutions.com/projects/web/Martin_Pippin/CheckIntoCash/Source/index.php"> Click Here</a>&nbsp;to go Back</p>
  <div class="oct_header_full" style="position:relative;margin-top:15px;">
    <div class="oct_header_inner">
      <div class="oct_header_logo"><a href="http://www.checkintocash.com" target="_blank"><img src="images/october_mm_registration_v1_05.png" alt="Check Into Cash" width="339" height="68" border="0" /></a></div>
    </div>
    <div class="oct_main_inner">
      <div class="oct_main_text"></div>
      <div class="oct_woman"></div>
    </div>
  </div>
  <div class="clear"></div>
  <div class="oct_lower_full">
    <div class="oct_lower_inner">
      
    </div>
  </div>
  <div class="clear"></div>
  <div class="oct_form">
	
  
    <link type="text/css" rel="stylesheet" href="http://jotformpro.com/css/styles/buttons/form-submit-button-simple_grey.css?3.1.330"/>
	
  </div>
  <p></p>
  <p style="text-align:center; font-size:12px; color:#999; margin-bottom:10px;">Official Rules: To print or download a copy of the Check Into Cash october Sweepstakes Official Rules, visit <a href="http://checkintocash.biz/october-sweepstakes/official-rules.html" target="_blank" style="color:#444;">http://checkintocash.biz/october-sweepstakes/official-rules.html</a>.<br>
      ©2012 Check Into Cash. All Rights Reserved.</p>
</div>
</body>
</html>