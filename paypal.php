<html>
<head>
<title>Paypal Form </title>
</head>
<body>
Paypal Documentation URL
<br/> 
https://developer.paypal.com/docs/classic/paypal-payments-standard/integration-guide/Appx_websitestandard_htmlvariables/
<br/>
https://developer.paypal.com/docs/classic/paypal-payments-standard/integration-guide/formbasics/
<br/>

<form action="https://www.sandbox.paypal.com/cgi-bin/webscr" method="post" id="donation_form">
<input type="hidden" name="cmd" value="_xclick">
<input type="Text" name="item_name" value="General Donation">
<input type="Text" name="amount" value="36">
<input type="hidden" name="notify_url" value="http://ganga.impingesolutions.com/projects/web/Joel_Kraus/regional/returnNotify_Url">
<input type="hidden" name="return" value="http://ganga.impingesolutions.com/projects/web/Joel_Kraus/regional/returnUrl">
<input type="hidden" name="business" value="baljinder.impinge@gmail.com">
<input type="hidden" name="currency_code" value="USD">
<input type="hidden" name="no_shipping" value="1">
<input type="hidden" name="item_number" value="1">
<input type="hidden" name="cancel_return" value="http://localhost/CI/paypal.php">
<input type="hidden" id="custom" name="custom" value="">
<input type="hidden" name="rm" value="2">
<input type="text" name="shipping" id="shipping" value="5"/> 
<input type="text" name="discount_rate" id="discount_rate" value="8"/>
<input type="text" name="invoice" id="invoice" value="INV-1287368"/>
<input type="text" name="display" value="1" id="display"/>
<input type="hidden" name="first_name" value="John">
<input type="hidden" name="middle_name" value="Sam">
<input type="hidden" name="last_name" value="Doe">
<input type="hidden" name="address1" value="9 Elm Street">
<input type="hidden" name="address2" value="Apt 5">
<input type="hidden" name="city" value="Berwyn">
<input type="hidden" name="state" value="PA">
<input type="hidden" name="zip" value="19312">
<input type="hidden" name="country_code" value="US"/>
<input type="hidden" name="night_phone_a" value="610">
<input type="hidden" name="night_phone_b" value="555">
<input type="hidden" name="night_phone_c" value="1234">
<input type="text" id="image_url" name="image_url" value="http://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Steelmark_logo.svg/150px-Steelmark_logo.svg.png"/>
<input type="text" name="weight" id="weight" value="500" />
<input type="text" name="weight_unit" id="weight_unit" value="kgs" />

<input type="submit" name="Payment" value="Payment" id="Payment" />
</form>
</body>
</html>