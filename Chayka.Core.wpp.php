<?php
/**
 * Plugin Name: Chayka.Core
 * Plugin URI: git@github.com:chayka/Chayka.Core.wpp.git
 * Description: Wordpress plugin that allows you to create WP Plugins and Themes as MVC applications
 * Version: 0.0.1
 * Author: Boris Mossounov <borix@tut.by>
 * Author URI: https://github.com/chayka/
 * License: MIT
 */

require_once 'vendor/autoload.php';

require_once dirname(__FILE__).'/Plugin.php';

//add_action('init', array("Chayka\\Core\\Plugin", "init"));
