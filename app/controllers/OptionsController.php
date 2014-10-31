<?php
/**
 * Created by PhpStorm.
 * User: borismossounov
 * Date: 22.10.14
 * Time: 19:52
 */

namespace Chayka\Core;

use Chayka\Helpers\InputHelper;
use Chayka\Helpers\JsonHelper;
use Chayka\Helpers\Util;
use Chayka\MVC\Controller;

class OptionsController extends Controller{

    public function getAction(){
        InputHelper::captureInput();
        $namespace = InputHelper::getParam('namespace');
        $options = InputHelper::getParam('options', array());
        $siteOptions = Util::getItem($options, 'site', array());
        unset($options['site']);
        if($namespace){
            $namespace.='.';
        }

        foreach($options as $option => $defValue){
            $value = get_option($namespace.$option);
            $options[$option] = $value?$value:$defValue;
        }
        foreach($siteOptions as $option => $defValue){
            $value = get_site_option($namespace.$option);
            $siteOptions[$option] = $value?$value:$defValue;
        }
        $options['site'] = $siteOptions;
        JsonHelper::respond($options);
    }

    public function setAction(){
        InputHelper::captureInput();
        $namespace = InputHelper::getParam('namespace');
        $options = InputHelper::getParam('options', array());
        $siteOptions = Util::getItem($options, 'site', array());
        unset($options['site']);
        if($namespace){
            $namespace.='.';
        }

        foreach($options as $option => $value){
            update_option($namespace.$option, $value);
            $options[$option] = get_option($namespace.$option);
        }
        foreach($siteOptions as $option => $value){
            update_site_option($namespace.$option, $value);
            $siteOptions[$option] = get_site_option($namespace.$option);
        }
        $options['site'] = $siteOptions;
        JsonHelper::respond($options);
    }

} 