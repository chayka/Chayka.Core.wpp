<?php
/**
 * Plugin Name: Chayka.Core
 * Plugin URI: git@github.com:chayka/Chayka.Core.wpp.git
 * Description: WordPress plugin that allows you to create WP Plugins and Themes as MVC applications
 * Version: 1.0.0
 * Author: Boris Mossounov <borix@tut.by>
 * Author URI: https://github.com/chayka/
 * License: MIT
 */
if(!class_exists('\Chayka\Core\Plugin')){
    require_once __DIR__ . '/vendor/autoload.php';
    require_once __DIR__ . '/Plugin.php';
}
//add_action('init', array("Chayka\\Core\\Plugin", "init"));
