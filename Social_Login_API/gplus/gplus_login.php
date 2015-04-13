<?php
 if(!defined('SITE_PATH')) 
 { 
	 require_once '../path.php';
  }
 

require_once 'src/apiClient.php';
require_once 'src/contrib/apiPlusService.php';



if (isset($_REQUEST['logout'])) 
{
  unset($_SESSION['access_token']);
}

if(isset($_GET['error']))
{
	header("Location: ".SITE_URL."?fail_return");
}

if(isset($_SERVER['SCRIPT_NAME'])=='/projects/web/Martin_Pippin/CheckIntoCash/Source/gplus/gplus_login.php')
{
	 
	$client = new apiClient();
	$client->setApplicationName("Impinge");
	$client->setScopes(array('https://www.googleapis.com/auth/plus.me','https://www.googleapis.com/auth/userinfo.email','https://www.googleapis.com/auth/userinfo.profile'));
	$plus = new apiPlusService($client);
 

	if (isset($_GET['code'])) 
	{  
		try {
		$client->authenticate($_GET['code']);
		} catch (Exception $e) 
		{  	
			header("Location: ".SITE_URL."?fail_return"); 
			 
		}

		
		$_SESSION['access_token'] = $client->getAccessToken();
		
		$access_token		=	json_decode($_SESSION['access_token']);

		$url = "https://www.googleapis.com/oauth2/v1/userinfo?access_token=".$access_token->access_token;
		
		$data	=	json_decode(file_get_contents($url));
	}
 
if (isset($_SESSION['access_token'])) 
{
  $client->setAccessToken($_SESSION['access_token']);
}

if ($client->getAccessToken())
{
 try {
  $me = $plus->people->get('me');

  $optParams = array('maxResults' => 100);
 
  $activities = $plus->activities->listActivities('me', 'public',$optParams);
 
  $_SESSION['access_token'] = $client->getAccessToken();
  }catch (Exception $e) 
		{  	
			header("Location:".SITE_URL."?fail_return"); 
			 
		}
  
} 
else 
{
  $authUrl = $client->createAuthUrl();
}

 if(isset($me))
 { 
	 $_SESSION['gplusdata']		=	$me;
	 
	if(isset($me['placesLived']))
	{
		$place						=	base64_encode($me['placesLived'][0]['value']);
	}
	else
	{
		$place						=	"";
	}
	$_SESSION['gplusdetail']	=	$data;
	 
	$data						=	base64_encode(serialize($data));
	
	$me							=	base64_encode(serialize($me));
	
	header("location: ".SITE_URL."?returncode=".$data."&returnplace=".$place);
 }
}//end of if
if(isset($authUrl))
{
	define('GPLUS_LOGIN',$authUrl);
}
else 
{
   //print "<a class='logout' href='index.php?logout'>Logout</a>";
}
?>