<?php

namespace Chayka\Core;

use Chayka\Helpers\HttpHeaderHelper;
use Chayka\WP\MVC\Controller;
use Chayka\WP\Helpers\JsonHelper;

/**
 * Class BuggyController is a controller that throws different errors to test
 * whether casperjs test suite catches errors
 * @package Chayka\Core
 */
class BuggyController extends Controller{

    public function init(){
        // NlsHelper::load('main');
        // InputHelper::captureInput();
    }

    /**
     * Shows php notice
     */
    public function phpNoticesAction(){
        trigger_error('Important Notice', E_USER_ERROR);
    }

    /**
     * Empty output
     */
    public function voidAction(){
    }

    /**
     * Error http server response code
     */
    public function serverErrorAction(){
        HttpHeaderHelper::setResponseCode(500);
        JsonHelper::respond();
    }

    /**
     * Throws Javascript error.
     */
    public function jsErrorAction(){
        echo '<div>Gonna crash javascript</div>';
        echo '<script>console.log(someObject.nonExistingProerty.subProperty);</script>';
    }

} 