<?php

namespace Chayka\Core;

use Chayka\WP\MVC\Controller;
use Chayka\Helpers\InputHelper;
use Chayka\WP\Helpers\JsonHelper;

class UpdateController extends Controller{

    public function init(){
        // NlsHelper::load('main');
        // InputHelper::captureInput();
    }

    public function discoverPluginsAction(){
//        $data = [];
//        $configFn = $this->basePath.'chayka.json';
//        if(file_exists($configFn)){
//            $json = file_get_contents($configFn);
//            $config = json_decode($json);
//            $data = [
//                'name' => $config->appName,
//                'version' => $config->appVersion,
//                'description' => $config->appDescription,
//            ];
//        }
    }

} 