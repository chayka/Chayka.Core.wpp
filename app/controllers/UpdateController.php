<?php

namespace Chayka\Core;

use Chayka\Helpers\FsHelper;
use Chayka\Helpers\HttpHeaderHelper;
use Chayka\WP\Helpers\AclHelper;
use Chayka\WP\MVC\Controller;
use Chayka\Helpers\InputHelper;
use Chayka\WP\Helpers\JsonHelper;

class UpdateController extends Controller{

    public function init(){
        // NlsHelper::load('main');
         InputHelper::captureInput();
    }

    public function openGateAction(){
        AclHelper::apiPermissionRequired();
        JsonHelper::respond([
            'access-point' => UpdateClientHelper::getTemporaryAccessRoute(600),
            'expiration-date' => UpdateClientHelper::getTemporaryAccessExpirationDate(),
        ]);
    }

    public function discoverPluginsAction(){
        $accessPoint = InputHelper::getParam(UpdateClientHelper::getTemporaryAccessRoute());
        if(!$accessPoint || !UpdateClientHelper::isTemporaryAccessRouteOpen()){
            JsonHelper::respondError('auth not passed', 1, [
                'access-point' => $accessPoint,
                'gate-is-open' => UpdateClientHelper::isTemporaryAccessRouteOpen()
            ]);
        }
        $data = UpdateClientHelper::getInstalledPluginsData(); 
        JsonHelper::respond($data);

        return false;
    }
    
    public function getUpdatesAction(){
        $data = UpdateClientHelper::requestUpdates();
        JsonHelper::respond(['request' => $data, 'response' => '']);
    }
}