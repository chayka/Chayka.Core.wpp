<?php
/**
 * Created by PhpStorm.
 * User: borismossounov
 * Date: 31.10.14
 * Time: 13:07
 */

namespace Chayka\Core;

use Chayka\MVC\Controller;

class AdminCoreController extends Controller{

    public function init(){

    }

    public function indexAction(){
        wp_enqueue_script('chayka-options-form');
    }

} 