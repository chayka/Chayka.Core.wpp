<?php
/**
 * PHPUnit bootstrap file
 *
 * @package Chayka.Core.wpp
 */

$_core_dir = getenv( 'WP_CI_DIR' );
if ( ! $_core_dir ) {
	$_core_dir = '/tmp/wordpress/';
}
$_tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $_tests_dir ) {
	$_tests_dir = $_core_dir.'wp-content/tests-lib';
}
/**
 * Give access to tests_add_filter() function.
 */
require_once $_tests_dir . '/includes/functions.php';

/**
 * Manually load the plugin being tested.
 */
tests_add_filter( 'muplugins_loaded', function() use ($_core_dir){
//	require $_core_dir. 'wp-content/plugins/Chayka.Core.wpp.php';
	class_exists('\Chayka\Core\Plugin') || require_once dirname( dirname( dirname( __FILE__ ) ) ). '/Chayka.Core.wpp.php';
} );

/**
 * Start up the WP testing environment.
 */
require $_tests_dir . '/includes/bootstrap.chayka.php';
