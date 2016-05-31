<?php

namespace Chayka\Core;

use Chayka\Helpers\Util;
use Chayka\WP\Helpers\AclHelper;
use Chayka\WP\MVC\Controller;
use Chayka\Helpers\InputHelper;
use Chayka\WP\Helpers\JsonHelper;

class EmailController extends Controller{

    public function init(){
        // NlsHelper::load('main');
        // InputHelper::captureInput();
    }

    public function testAction(){
        AclHelper::apiPermissionRequired();
        InputHelper::checkParam('to')->required()->email();
        InputHelper::checkParam('message')->required();
        InputHelper::captureInput();
        InputHelper::validateInput(true);

        $to = InputHelper::getParam('to');
        $message = InputHelper::getParam('message');
        try{
            EmailHelper::send('Test Message from '.Util::serverName(), $message, $to);
            JsonHelper::respond(null, 0, 'message sent');
        }catch (\Exception $e){
            JsonHelper::respondException($e);
        }
    }

} 