<?php
/*
Plugin Name: Category Icon
Description: Assign Icon for Category
Version: 1.0
*/

define ('PLUGIN_PATH',ABSPATH . 'wp-content/plugins/Category_Icon/');

define ('PLUGIN_URL',plugins_url().'/Category_Icon/');

include_once('class/class.php');

if(is_admin())
{
	$Category = new Category_Class();
}