<?php

namespace Chayka\Core;

use Chayka\Helpers\FsHelper;
use Chayka\WP\MVC\Controller;
use Chayka\Helpers\InputHelper;
use Chayka\WP\Helpers\JsonHelper;

class UpdateController extends Controller{

    public function init(){
        // NlsHelper::load('main');
        // InputHelper::captureInput();
    }

    public function discoverPluginsAction(){
        $data = [];

        $pluginsRootDir = defined('WP_PLUGIN_DIR')? WP_PLUGIN_DIR.'/' : WP_CONTENT_DIR.'/plugins/';

        $plugins = FsHelper::readDir($pluginsRootDir);

        foreach($plugins as $plugin){
            $configFn = $pluginsRootDir.$plugin . '/chayka.json';
            if(file_exists($configFn)){
                $json = file_get_contents($configFn);
                $config = json_decode($json);
                $data[$plugin] = [
                    'name' => $config->appName,
                    'version' => $config->appVersion,
                    'description' => $config->appDescription,
                ];
            }
        }

        JsonHelper::respond($data);

    }

} 