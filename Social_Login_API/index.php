<?php 
session_start();
require_once 'path.php';
require_once 'common/facebook/facebook.php';
require_once 'common/facebook/fbconfig.php';
require_once 'common/include.php';
$p=0;
$g = 0; 

	
if(isset($_GET['returncode'])&&(!isset($_GET['state'])))
{ 
	$g = 1;
	
	$data	=	unserialize(base64_decode($_GET['returncode']));
	
 
	$place	=	base64_decode($_GET['returnplace']);
	 
	$firstname	= $data->given_name;
	
	$lastname	= $data->family_name;
	 
	if(isset($data->birthday))
	{
		$d			= date('F/d/Y',strtotime($data->birthday));	
		$birth		= explode('/',$d);	
	} 
	else
	{
		$birth[0]		="";	
		$birth[1]		="";	
		$birth[2]		="";
	}
	 
	$wall_post	=3;
	
	$email		= $data->email;
	
	$gender		= @$data->gender;

	$hometown	= @$place;
	
	$location	= @$place;

	if(isset($location))
	{
		$city		= explode(',',$location);
		$state		= @$city[1];	
		$city		= @$city[0];
		
	}
	else
	{
		$city	=	"";
		$state	=	"";
	} 
	$cntry		=	"";
	$p=1;
	
} 

$user = $facebook->getUser();
if ($user)
{
	$logoutUrl = $facebook->getLogoutUrl();
	try 
	{
		$userdata = $facebook->api('/me');  
		$_SESSION['userdata'] 	= 	$userdata;
	} 
	catch (FacebookApiException $e)
	{
		error_log($e); 
		$user = null;
	}
}
else 
{
	$loginUrl = $facebook->getLoginUrl(array( 'scope' => 'email,user_birthday,publish_stream'));
}
$loginUrl = $facebook->getLoginUrl(array( 'scope' => 'email,user_birthday,publish_stream'));	
$loginUrl1 = $facebook->getLoginUrl(array( 'scope' => 'email,publish_stream'));	

$access_token_title='fb_'.APP_SECRET.'_access_token';

if(!empty($userdata) && $g == 0)
{
$p=1;
 
 
if(isset($userdata['work'][0]['location']['name']))
{
	$country	=  $userdata['work'][0]['location']['name'];
	$cntry		=  explode(',',$country);	
	$cntry		=	$cntry[1];		
}
else
{
	$cntry	=	"";
}
$firstname	= $userdata['first_name'];
$lastname	= $userdata['last_name'];
$d	= date('F/d/Y',strtotime($userdata['birthday']));
$birth		= explode('/',$d);	
 
$email		= $userdata['email'];
$gender		= $userdata['gender'];
$hometown	= @$userdata['hometown']['name'];
$location	= @$userdata['location']['name'];
if(isset($location))
{
	$city		= explode(',',$location);
	$state		= "";
	$city		=  $city[0];
}
else
{
	$city	=	"";
	$state	=	"";
}
	$wall_post	=	1;
	unset($userdata); 
}

if(isset($_SESSION['CUP_OF_TWEET']))
{
	$firstname	= $_SESSION['CUP_OF_TWEET']->name;
	$lastname	= "";
	$gender		= "";
	$hometown	= @$_SESSION['CUP_OF_TWEET']->location;
	$location	= @$_SESSION['CUP_OF_TWEET']->location;
	$city		= @$_SESSION['CUP_OF_TWEET']->location;
	$email		=	"";
	$state		=	"";
	$birth[0]	=	"";	
	$birth[1]	=	"";	
	$birth[2]	=	"";	
	$cntry		=	"";
	$state		=	"";
	$wall_post	=	2;
	$p=1;
	//echo '<pre>';print_r($_SESSION['CUP_OF_TWEET']);
	unset($_SESSION['CUP_OF_TWEET']);
}

if(!isset($_GET['pass']) && (!isset($_GET['returncode'])&& (!isset($_GET['state']))))
{
	unset($_SESSION);
	require 'gplus/gplus_login.php';
}
 
if($p==0)
{
	$firstname	= "";
	$lastname	= "";
	$gender		= "";
	$hometown	= "";
	$location	= "";
	$city		= "";
	$email		="";
	$birth[0]		="";	
	$birth[1]		="";	
	$birth[2]		="";	
	$cntry		=	"";
	$state	=	"";
	 
}
 

$country_list = array(
		"Afghanistan",
		"Albania",
		"Algeria",
		"Andorra",
		"Angola",
		"Antigua and Barbuda",
		"Argentina",
		"Armenia",
		"Australia",
		"Austria",
		"Azerbaijan",
		"Bahamas",
		"Bahrain",
		"Bangladesh",
		"Barbados",
		"Belarus",
		"Belgium",
		"Belize",
		"Benin",
		"Bhutan",
		"Bolivia",
		"Bosnia and Herzegovina",
		"Botswana",
		"Brazil",
		"Brunei",
		"Bulgaria",
		"Burkina Faso",
		"Burundi",
		"Cambodia",
		"Cameroon",
		"Canada",
		"Cape Verde",
		"Central African Republic",
		"Chad",
		"Chile",
		"China",
		"Colombi",
		"Comoros",
		"Congo (Brazzaville)",
		"Congo",
		"Costa Rica",
		"Cote d'Ivoire",
		"Croatia",
		"Cuba",
		"Cyprus",
		"Czech Republic",
		"Denmark",
		"Djibouti",
		"Dominica",
		"Dominican Republic",
		"East Timor (Timor Timur)",
		"Ecuador",
		"Egypt",
		"El Salvador",
		"Equatorial Guinea",
		"Eritrea",
		"Estonia",
		"Ethiopia",
		"Fiji",
		"Finland",
		"France",
		"Gabon",
		"Gambia, The",
		"Georgia",
		"Germany",
		"Ghana",
		"Greece",
		"Grenada",
		"Guatemala",
		"Guinea",
		"Guinea-Bissau",
		"Guyana",
		"Haiti",
		"Honduras",
		"Hungary",
		"Iceland",
		"India",
		"Indonesia",
		"Iran",
		"Iraq",
		"Ireland",
		"Israel",
		"Italy",
		"Jamaica",
		"Japan",
		"Jordan",
		"Kazakhstan",
		"Kenya",
		"Kiribati",
		"Korea, North",
		"Korea, South",
		"Kuwait",
		"Kyrgyzstan",
		"Laos",
		"Latvia",
		"Lebanon",
		"Lesotho",
		"Liberia",
		"Libya",
		"Liechtenstein",
		"Lithuania",
		"Luxembourg",
		"Macedonia",
		"Madagascar",
		"Malawi",
		"Malaysia",
		"Maldives",
		"Mali",
		"Malta",
		"Marshall Islands",
		"Mauritania",
		"Mauritius",
		"Mexico",
		"Micronesia",
		"Moldova",
		"Monaco",
		"Mongolia",
		"Morocco",
		"Mozambique",
		"Myanmar",
		"Namibia",
		"Nauru",
		"Nepa",
		"Netherlands",
		"New Zealand",
		"Nicaragua",
		"Niger",
		"Nigeria",
		"Norway",
		"Oman",
		"Pakistan",
		"Palau",
		"Panama",
		"Papua New Guinea",
		"Paraguay",
		"Peru",
		"Philippines",
		"Poland",
		"Portugal",
		"Qatar",
		"Romania",
		"Russia",
		"Rwanda",
		"Saint Kitts and Nevis",
		"Saint Lucia",
		"Saint Vincent",
		"Samoa",
		"San Marino",
		"Sao Tome and Principe",
		"Saudi Arabia",
		"Senegal",
		"Serbia and Montenegro",
		"Seychelles",
		"Sierra Leone",
		"Singapore",
		"Slovakia",
		"Slovenia",
		"Solomon Islands",
		"Somalia",
		"South Africa",
		"Spain",
		"Sri Lanka",
		"Sudan",
		"Suriname",
		"Swaziland",
		"Sweden",
		"Switzerland",
		"Syria",
		"Taiwan",
		"Tajikistan",
		"Tanzania",
		"Thailand",
		"Togo",
		"Tonga",
		"Trinidad and Tobago",
		"Tunisia",
		"Turkey",
		"Turkmenistan",
		"Tuvalu",
		"Uganda",
		"Ukraine",
		"United Arab Emirates",
		"United Kingdom",
		"United States",
		"Uruguay",
		"Uzbekistan",
		"Vanuatu",
		"Vatican City",
		"Venezuela",
		"Vietnam",
		"Yemen",
		"Zambia",
		"Zimbabwe"
	);
?>
		<?php
		/* from gmail login */
require_once 'openid.php';
$openid = new LightOpenID("http://ganga.impingesolutions.com/projects/web/Martin_Pippin/CheckIntoCash/source/index.php");
 
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



<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Check Into Cash | Money Matters october Newsletter | Register to win $2400 towards your annual grocery cost</title>
<link href="css/october_sweeps.css" rel="stylesheet" type="text/css" />
<script src="http://code.jquery.com/jquery-latest.js"></script>
<script type="text/javascript" src="jsValidation.js"></script>

  <script>
  $(document).ready(function(){

    $(".jotform-form").validate({
	  rules: {
		input_1: "required",
		input_4: {
		  required: true,
		  email: true
		},
		input_5_month:"required",
		input_5_day:"required",
		input_5_year:"required",
		input_8_addr_line1:"required",
		input_8_postal:"required",
		input_8_country:"required"
	  },
	  
    groups: {
        DateofBirth: "q5_birthDate[month] q5_birthDate[day] q5_birthDate[year]"
    },
   errorPlacement: function(error, element) {
       if (element.attr("name") == "q5_birthDate[month]" || element.attr("name") == "q5_birthDate[day]" || element.attr("name") == "q5_birthDate[year]") 
	   //$("#cid_5").append(error);
        error.insertAfter("#yearspan");
       else 
        error.insertAfter(element);
   },unhighlight: function(element, errorClass, validClass) {
   if ($(element).attr("name") == "q5_birthDate[month]" || $(element).attr("name") == "q5_birthDate[day]" || $(element).attr("name") == "q5_birthDate[year]") {
			$("#id_5").find(".valid").removeClass("form-error-message");
        
		}
			if (element.type === 'radio') {
				this.findByName(element.name).removeClass(errorClass).addClass(validClass);
			} else {
				$(element).removeClass(errorClass).addClass(validClass);
				$(element).parent().find("div").removeClass(errorClass);
				$(element).parent().parent().addClass("").removeClass("form-line-error");
				
			}
   }, submitHandler: function(form) {
   	var check1 = '<?php echo $p; ?>';
	//alert(check1); 
	if(check1 == 0) {
		showPoup();
		return false;
	}
	else {
		form.submit();
	}
   }
});
  });
  </script>
<style>
input.error { border: 1px solid red; }
	label.error {
		background: url('http://dev.jquery.com/view/trunk/plugins/validate/demo/images/unchecked.gif') no-repeat;
		padding-left: 16px;
		margin-left: .3em;
	}
	label.valid {
		background: url('http://dev.jquery.com/view/trunk/plugins/validate/demo/images/checked.gif') no-repeat;
		display: block;
		width: 16px;
		height: 16px;
	}
</style>
<link href="http://max.jotfor.ms/min/g=formCss?3.1.330" rel="stylesheet" type="text/css" />
<link type="text/css" rel="stylesheet" href="http://jotformpro.com/css/styles/nova.css?3.1.330" />
</head>

<body onkeydown="hidePopup(event)">
<?php if(isset($_GET['fail_return'])) {  unset($_GET['fail']);?>
<div class="error" style="text-align:center;margin-top:5px;color:red;font-weight:bold;">Please Create Profile on Google Plus
</div>
<?php }?>
<div class="oct_container">
  <div class="oct_header_full" style="position:relative">
    <div class="oct_header_inner">
      <div class="oct_header_logo"><a href="http://www.checkintocash.com" target="_blank"><img src="images/october_mm_registration_v1_05.png" alt="Check Into Cash" width="339" height="68" border="0" /></a></div>
    </div>
	
	<!--div style="float:right;padding-right: 10px;padding-top: 15px; position:absolute; top:0; right:0">
	<a href="<?php //echo $loginUrl; ?>">	
		<img src="images/fb_login.png" width=64 height=32>	
	</a>	
	<a href="?login&oauth_provider=twitter">
		<img src="images/tw_login.png" width=64 height=32>
	</a>
	<a href="<?php //echo $authUrl;?>">
		<img src="images/1349670874_google_plus.png"  height=32>
	</a>
	</div>-->
	
    <div class="oct_main_inner">
      <div class="oct_main_text"></div>
      <div class="oct_woman"></div>
    </div>
  </div>
  <div class="clear"></div>
  <div class="oct_lower_full">
    <div class="oct_lower_inner">
      <p>Fill out the form below and register to win!</p>
    </div>
  </div>
  <div class="clear"></div>
  <div class="oct_form">
	<div class="social_box">
		<?php  $authUrl = "https://accounts.google.com/o/oauth2/auth?response_type=code&redirect_uri=http%3A%2F%2Fnile.impingesolutions.com%2Fprojects%2Fweb%2FMartin_Pippin%2FCheckIntoCash%2FSource%2Fgplus%2Fgplus_login.php&client_id=600363219451.apps.googleusercontent.com&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fplus.me+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&access_type=offline&approval_prompt=force";?>
		 <div class="text">
			<!--<h2>Connect Using Social Network</h2>-->
			<h2>Speed Up your Sign-Up.Log in using your social network!</h2> 
		</div> 

		<div class="icons">
			<a href="<?php echo $openid->authUrl() ?>">
				<img src="images/google_button.png">
			</a>			
			
			<a href="?login&oauth_provider=twitter">
				<img src="images/twitter_button.png">
			</a>
			
			<a href="<?php echo $loginUrl; ?>">	
			<img src="images/facebook_button.png">	
			</a>
			
			
		</div>
	</div>
  
    <link type="text/css" rel="stylesheet" href="http://jotformpro.com/css/styles/buttons/form-submit-button-simple_grey.css?3.1.330"/>
	<form class="jotform-form" action="save.php" method="post" name="form_22694612713959" id="22694612713959" accept-charset="utf-8"> <!--http://submit.jotformpro.com/submit/22694612713959/-->
  	<input type="hidden" name="formID" value="22694612713959" />
     <div class="form-all">
        <ul class="form-section">
          <li class="form-line form-line-column" id="id_1">
            <label class="form-label-top" id="label_1" for="input_1"> First Name<span class="form-required">*</span> </label>
            <div id="cid_1" class="form-input-wide">
			<?php 
	if(isset($_GET['ref']))
{
if($_GET['ref']=='gmail')
{
 $email=$_GET['email'];
 $firstname=$_GET['f'];
 $lastname=$_GET['l'];
$country=$_GET['country'];
}
}
?>
			              <input type="text" class="form-textbox required" id="input_1" name="q1_firstName" size="21" value="<?php echo $firstname.' '.$lastname; ?>" />
            </div>
          </li>
          <!--<li class="form-line form-line-column" id="id_3">
            <label class="form-label-top" id="label_3" for="input_3"> Last Name<span class="form-required">*</span> </label>
            <div id="cid_3" class="form-input-wide">
              <input type="text" class="form-textbox validate[required, Alphabetic]" id="input_3" name="q3_lastName3" size="21" value="<?php echo $lastname; ?>" />
            </div>
          </li>-->
          <li class="form-line" id="id_4">
            <label class="form-label-top" id="label_4" for="input_4"> Email Address<span class="form-required">*</span> </label>
            <div id="cid_4" class="form-input-wide">
              <input type="text" class="form-textbox required email" id="input_4" name="q4_emailAddress" size="61" value="<?php echo $email;?>" />
            </div>
          </li>
          <li class="form-line" id="id_6">
            <label class="form-label-top" id="label_6" for="input_6"> Gender </label>
            <div id="cid_6" class="form-input-wide">
              <select class="form-dropdown" style="width:150px" id="input_6" name="q6_gender6">
                <option> </option>
                <option value="Male"<?php if($gender=='male'){ echo 'selected="selected"';}?>> Male </option>
                <option value="Female" <?php if($gender=='female'){ echo 'selected="selected"';}?>> Female </option>
              </select>
            </div>
          </li>
          <li class="form-line" id="id_5">
            <label class="form-label-top" id="label_5" for="input_5"> Birth Date <span class="form-required">*</span> </label>
            <div id="cid_5" class="form-input-wide"><span class="form-sub-label-container">
              <select class="form-dropdown required" name="q5_birthDate[month]" id="input_5_month">
                <option> </option>
                <option value="January" <?php if($birth[0]=='January') { echo 'selected="selected"';}?>> January </option>
                <option value="February" <?php if($birth[0]=='February') { echo 'selected="selected"';}?>> February </option>
                <option value="March" <?php if($birth[0]=='March') { echo 'selected="selected"';}?>> March </option>
                <option value="April" <?php if($birth[0]=='April') { echo 'selected="selected"';}?>> April </option>
                <option value="May" <?php if($birth[0]=='May') { echo 'selected="selected"';}?>> May </option>
                <option value="June" <?php if($birth[0]=='June') { echo 'selected="selected"';}?>> June </option>
                <option value="July" <?php if($birth[0]=='July') { echo 'selected="selected"';}?>> July </option>
                <option value="August" <?php if($birth[0]=='August') { echo 'selected="selected"';}?>> August </option>
                <option value="September" <?php if($birth[0]=='September') { echo 'selected="selected"';}?>> September </option>
                <option value="October" <?php if($birth[0]=='October') { echo 'selected="selected"';}?>> October </option>
                <option value="November" <?php if($birth[0]=='November') { echo 'selected="selected"';}?>> November </option>
                <option value="December" <?php if($birth[0]=='December') { echo 'selected="selected"';}?>> December </option>
              </select>
              <label class="form-sub-label" for="input_5_month" id="sublabel_month"> Month </label>
              </span><span class="form-sub-label-container">
              <select class="form-dropdown required" name="q5_birthDate[day]" id="input_5_day">
                <option> </option>
                <?php for($i=1;$i<31;$i++)
				{
				?>
					<option value="<?php echo $i; ?>"<?php if($birth[1]==$i){ echo 'selected="selected"';} ?>><?php echo $i; ?></option>
				<?php }?>
              </select>
              <label class="form-sub-label" for="input_5_day" id="sublabel_day"> Day </label>
              </span><span class="form-sub-label-container" id="yearspan">
              <select class="form-dropdown required" name="q5_birthDate[year]" id="input_5_year">
                <option> </option>
                <?php for($i=2016;$i>1920;$i--)
				{
				?>
					<option value="<?php echo $i; ?>"<?php if($birth[2]==$i){ echo 'selected="selected"';} ?>><?php echo $i; ?></option>
				<?php }?>
              </select>
              <label class="form-sub-label" for="input_5_year" id="sublabel_year"> Year </label>
              </span> </div>
          </li>
          </ul>
          <ul class="form-section">
          <li class="form-line" id="id_8">
            <label class="form-label-top" id="label_8" for="input_8"> Address<span class="form-required">*</span> </label>
            <div id="cid_8" class="form-input-wide">
              <table summary="" class="form-address-table" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td colspan="2"><span class="form-sub-label-container">
                    <input class="form-textbox required form-address-line" type="text" name="q8_address[addr_line1]" id="input_8_addr_line1" value="<?php echo $hometown;?>" />
                    <label class="form-sub-label" for="input_8_addr_line1" id="sublabel_addr_line1"> Street Address </label>
                    </span></td>
                </tr>
                <tr>
                  <td colspan="2"><span class="form-sub-label-container">
                    <input class="form-textbox form-address-line" type="text" name="q8_address[addr_line2]" id="input_8_addr_line2" size="46" />
                    <label class="form-sub-label" for="input_8_addr_line2" id="sublabel_addr_line2"> Street Address Line 2 </label>
                    </span></td>
                </tr>
                <tr>
                  <td width="50%"><span class="form-sub-label-container">
                    <input class="form-textbox validate[required] form-address-city" type="text" name="q8_address[city]" id="input_8_city" size="21"  value="<?php echo $city;?>"/>
                    <label class="form-sub-label" for="input_8_city" id="sublabel_city"> City </label>
                    </span></td>
                  <td><span class="form-sub-label-container">
                    <input class="form-textbox validate[required] form-address-state" type="text" name="q8_address[state]" id="input_8_state" size="22" value="<?php echo $state; ?>" />
                    <label class="form-sub-label" for="input_8_state" id="sublabel_state"> State / Province </label>
                    </span></td>
                </tr>
                <tr>
                  <td width="50%"><span class="form-sub-label-container">
                    <input class="form-textbox required form-address-postal" type="text" name="q8_address[postal]" id="input_8_postal" size="10" />
                    <label class="form-sub-label" for="input_8_postal" id="sublabel_postal"> Postal / Zip Code </label>
                    </span></td>
                  <td><span class="form-sub-label-container">
                    <select class="form-dropdown required form-address-country" name="q8_address[country]" id="input_8_country">
                      <option selected> Please Select  </option>
						<?php for($i=0;$i<count($country_list);$i++) 
						{ ?>
						<option value="<?php echo $country_list[$i];?>" <?php if (trim($country_list[$i])==trim($cntry)){ echo "selected='selected'";}?>><?php echo $country_list[$i];?></option>		
					<?php }?>
                      <option value="other"> Other </option>
                    </select>
                    <label class="form-sub-label" for="input_8_country" id="sublabel_country"> Country </label>
                    </span></td>
                </tr>
              </table>
            </div>
          </li>
          </ul>
          <div class="clear"></div>
		<!--<h2 style="margin:20px 0px 20px 35px !important;">Refer a friend (or five) and if one of your friends win the grand prize, we'll pay you $100!</h2>-->
		<div style="margin:20px 0px 20px 35px !important;">
			<!--<input type="checkbox" name="wallpost" id="wallpost">&nbsp;&nbsp;Post on Social Wall-->
			<input type="hidden" name="wall_post" id="wall_post" value="<?php echo(isset($wall_post))?$wall_post:''; ?>"/>
			<input type="hidden" name="twitter_enable" id="twitter_enable" value="0" />
			<input type="hidden" name="gmail_enable" id="gmail_enable" value="0" />
			
		</div>	
        <!--<ul class="referalList">
        	<li>First Name</li>
            <li>Last Name</li>
            <li>Email Address</li>
        </ul>-->
          <div class="clear"></div>
			<div style="text-align:center" class="form-buttons-wrapper">
				<button src="" id="input_2" type="submit" class="form-image"></button>
			</div>
		   
        <!--  <ul class="form-referal">
          <li class="form-line form-line-column" id="id_9">
            <label class="form-label-top" id="label_9" for="input_9"></label>
            <div id="cid_9" class="form-input-wide">
              <input type="text" class="form-textbox" id="input_9" name="q9_referral1" size="30" />
            </div>
          </li>
          <li class="form-line form-line-column" id="id_10">
            <label class="form-label-top" id="label_10" for="input_10"></label>
            <div id="cid_10" class="form-input-wide">
              <input type="text" class="form-textbox" id="input_10" name="q10_referral110" size="30" value="" />
            </div>
          </li>
          <li class="form-line form-line-column" id="id_11">
            <label class="form-label-top" id="label_11" for="input_11"></label>
            <div id="cid_11" class="form-input-wide">
              <input type="text" class="form-textbox" id="input_11" name="q11_referral111" size="30" />
            </div>
          </li>
          <li class="form-line form-line-column" id="id_12">
            <label class="form-label-top" id="label_12" for="input_12"></label>
            <div id="cid_12" class="form-input-wide">
              <input type="text" class="form-textbox" id="input_12" name="q12_referral2" size="30" />
            </div>
          </li>
          <li class="form-line form-line-column" id="id_13">
            <label class="form-label-top" id="label_13" for="input_13"></label>
            <div id="cid_13" class="form-input-wide">
              <input type="text" class="form-textbox" id="input_13" name="q13_referral213" size="30" />
            </div>
          </li>
          <li class="form-line form-line-column" id="id_14">
            <label class="form-label-top" id="label_14" for="input_14"></label>
            <div id="cid_14" class="form-input-wide">
              <input type="text" class="form-textbox" id="input_14" name="q14_referral214" size="30" />
            </div>
          </li>
          <li class="form-line" id="id_2">
            <div id="cid_2" class="form-input-wide">
              <div style="text-align:center" class="form-buttons-wrapper">
                <button id="input_2" type="submit" class="form-submit-button form-submit-button-simple_grey"> Submit </button>
                
              </div>
            </div>
          </li>
          <li style="display:none"> Should be Empty:
            <input type="text" name="website" value="" />
          </li>
        </ul>-->
      </div>
      <input type="hidden" id="simple_spc" name="simple_spc" value="22694612713959" />
      <script type="text/javascript">
      document.getElementById("si" + "mple" + "_spc").value = "22694612713959-22694612713959";
      </script>
    </form>
  </div>
  <div class="clear" style="height:10px;"></div>
  <p style="text-align:center; font-size:12px; color:#999; margin-bottom:10px;">Official Rules: To print or download a copy of the Check Into Cash october Sweepstakes Official Rules, visit <a href="http://checkintocash.biz/october-sweepstakes/official-rules.html" target="_blank" style="color:#444;">http://checkintocash.biz/october-sweepstakes/official-rules.html</a>.<br>
      ©2012 Check Into Cash. All Rights Reserved.</p>
</div>


<div id="mask" class="mask"></div>
<div id="popup" class="popup">
<div id="thickbox-div" style="">
			 <div class="text">
			<!--<h2>Connect Using Social Network</h2>-->
			<h2 class="mtitle">Register via your social network</h2> 
		</div> 
		<div class="micons">
		<?php /* ?>	<a href="javascript:void(0);" onclick="clickOnGoogle();">
				<img src="images/google_button.png">
			</a>			
			
			<a href="javascript:void(0);" onclick="clickOnTwitter();">
				<img src="images/twitter_button.png">
			</a>
			
			<a href="javascript:void(0);" onclick="clickOnFacebook();">	
			<img src="images/facebook_button.png">	
			</a>
			<p>
				No Social Media Account? <a href="javascript:void(0);" class="mlink" onClick="document.forms['22694612713959'].submit();">Click Here</a>
			</p> <?php */ ?>
			<p> you are sussessfull logged in  please <a href="javascript:void(0);" class="mlink" onClick="document.forms['22694612713959'].submit();">click here </a> to go further</p>
			
		</div>
</div>

</div>

<script type="text/javascript">
	function showPoup(){
		var mask=document.getElementById("mask");
		mask.style.display="block";
		mask.style.visibility="visible";
		mask.style.position="fixed";
		mask.style.height=getDocHeight()+"px";	
		mask.style.left="0";
		mask.style.top="0";
		var popup=document.getElementById("popup");
		popup.style.display="block";
		popup.style.visibility="visible";
		popup.style.left=((document.body.clientWidth/2)-200)+"px";
		popup.style.top=((window.innerHeight/2)-150)+"px";
	}
	
	function getDocHeight() {
		var D = document;
		return Math.max(
			Math.max(D.body.scrollHeight, D.documentElement.scrollHeight),
			Math.max(D.body.offsetHeight, D.documentElement.offsetHeight),
			Math.max(D.body.clientHeight, D.documentElement.clientHeight)
		);
	}
	
	function closePopup(){
		var mask=document.getElementById("mask");
		mask.style.display="none";
		mask.style.visibility="hidden";
		var popup=document.getElementById("popup");
		popup.style.display="none";
		popup.style.visibility="hidden";
	}
	
	//showPoup();
	function hidePopup(e){
	if(e.keyCode==27){
	closePopup();
	}
	}

</script>
<script type="text/javascript">
function clickOnFacebook(){
	document.getElementById('wall_post').value = '1';
	document.forms['22694612713959'].submit();
}
function clickOnTwitter(){
	document.getElementById('wall_post').value = '2';
	document.getElementById('twitter_enable').value = '2';
	document.forms['22694612713959'].submit();
}

function clickOnGoogle(){
	document.getElementById('wall_post').value = '3';
	document.getElementById('gmail_enable').value = '3';
	document.forms['22694612713959'].submit();
}
</script>
</body>
</html>
