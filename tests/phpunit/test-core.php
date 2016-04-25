<?php
/**
 * Class CoreTest
 *
 * @package
 */

/**
 * Core test case.
 */
class CoreTest extends WP_UnitTestCase {

    /**
     * A single example test.
     */
    function test_core_enabled() {
        // Replace this with some actual testing code.
        $this->assertTrue( class_exists('\Chayka\Core\Plugin'), 'Plugin class loaded' );
        $this->assertInstanceOf( '\Chayka\Core\Plugin', \Chayka\Core\Plugin::getInstance(), 'Plugin instance created' );
    }
}