<?php
require_once 'openid.php';
$openid = new LightOpenID("http://ganga.impingesolutions.com/projects/web/Martin_Pippin/CheckIntoCash/source/test2.php");
 
$openid->identity = 'https://www.google.com/accounts/o8/id';
$openid->required = array(
  'namePerson/first',
  'namePerson/last',
  'contact/email',
  'pref/language',
  'contact/country/home',
);
$openid->returnUrl = 'http://ganga.impingesolutions.com/projects/web/Martin_Pippin/CheckIntoCash/source/login.php';
?>
 
<a href="<?php echo $openid->authUrl() ?>">Login with Google</a>