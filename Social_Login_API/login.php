<?php
require_once 'openid.php';
$openid = new LightOpenID("http://ganga.impingesolutions.com/projects/web/Martin_Pippin/CheckIntoCash/source/index.php");
 
if ($openid->mode) {
    if ($openid->mode == 'cancel') {
        echo "User has canceled authentication !";
    } elseif($openid->validate()) {
        $data = $openid->getAttributes();
		//print_r($data);
        $email = $data['contact/email'];
        $first = $data['namePerson/first'];
		$last = $data['namePerson/last'];
		//$gender = $data['person/gender'];
		//$lang = $data['pref/language'];
		//$timezone = $data['pref/timezone'];
		
		$country = $data['contact/country/home'];
		session_start();
		$_SESSION['email']=$email;
		$_SESSION['firstname']=$first;
		$_SESSION['lastname']=$last;
		
		$_SESSION['country']=$country;
		
		
		//$postal_code = $data['contact/postalCode/home'];
		//$birthDate = $data['birthDate'];
				
		//echo "Identity : $openid->identity <br>";
       // echo "Email : $email <br>";
       // echo "First name : $first<br>";
		//echo "last name : $last<br>";
		//echo "gender : $gender<br>";
		//echo "Country : $country<br>";
		//echo "postal_code : $postal_code<br>";
		//echo "lang : $lang<br>";
		//echo "timezone : $timezone<br>";
		//echo "birthDate : $birthDate<br>";
		header('location: http://ganga.impingesolutions.com/projects/web/Martin_Pippin/CheckIntoCash/source/index.php?ref=gmail&f='.$first.'&l='.$last.'&email='.$email.'&country='.$country.'');
    } else {
        echo "The user has not logged in";
    }
} else {
    echo "Go to index page to log in.";
}
?>