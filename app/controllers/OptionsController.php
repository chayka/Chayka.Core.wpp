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
use Chayka\WP\Helpers\AclHelper;

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
            if(!AclHelper::isAllowed('get_option', $namespace)) {
                AclHelper::apiPermissionRequired( '', 'get_option', $namespace . $option );
            }
            $value = get_option($namespace.$option);
            $options[$option] = $value?$value:$defValue;
        }
        AclHelper::apiPermissionRequired('', 'manage_network_options');
        foreach($siteOptions as $option => $defValue){
            if(!AclHelper::isAllowed('get_site_option', $namespace)) {
                AclHelper::apiPermissionRequired( '', 'get_site_option', $namespace . $option );
            }
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

        AclHelper::apiPermissionRequired('', 'manage_options');
        foreach($options as $option => $value){
            if(!AclHelper::isAllowed('update_option', $namespace)) {
                AclHelper::apiPermissionRequired( '', 'update_option', $namespace . $option );
            }
            update_option($namespace.$option, $value);
            $options[$option] = get_option($namespace.$option);
        }
        AclHelper::apiPermissionRequired('', 'manage_network_options');
        foreach($siteOptions as $option => $value){
            if(!AclHelper::isAllowed('update_site_option', $namespace)) {
                AclHelper::apiPermissionRequired( '', 'update_site_option', $namespace . $option );
            }
            update_site_option($namespace.$option, $value);
            $siteOptions[$option] = get_site_option($namespace.$option);
        }
        $options['site'] = $siteOptions;
        JsonHelper::respond($options);
    }

} 