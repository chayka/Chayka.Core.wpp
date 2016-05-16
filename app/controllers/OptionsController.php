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
use Chayka\WP\Helpers\OptionHelper;

class OptionsController extends Controller{

    /**
     * Returns wp options by their ids.
     * If id begins with '_' then option is considered to be encoded and is decoded first.
     */
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
            $encrypted = $option[0] === '_';
            $value = $encrypted ?
                OptionHelper::decrypt(get_option($namespace.substr($option, 1))):
                get_option($namespace.$option);
            $options[$option] = strlen($value)?$value:$defValue;
        }
        AclHelper::apiPermissionRequired('', 'manage_network_options');
        foreach($siteOptions as $option => $defValue){
            if(!AclHelper::isAllowed('get_site_option', $namespace)) {
                AclHelper::apiPermissionRequired( '', 'get_site_option', $namespace . $option );
            }
            $encrypted = $option[0] === '_';
            $value = $encrypted ?
                OptionHelper::decrypt(get_site_option($namespace.substr($option, 1))):
                get_site_option($namespace.$option);
            $siteOptions[$option] = strlen($value)?$value:$defValue;
        }
        $options['site'] = $siteOptions;
        JsonHelper::respond($options);
    }

    /**
     * Sets wp options by their ids.
     * If id begins with '_' then option is encoded first.
     */
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
            if($option[0] === '_'){
                $value = OptionHelper::encrypt($value);
                $option = substr($option, 1);
            }
            update_option($namespace.$option, $value);
            $options[$option] = get_option($namespace.$option);
        }
        AclHelper::apiPermissionRequired('', 'manage_network_options');
        foreach($siteOptions as $option => $value){
            if(!AclHelper::isAllowed('update_site_option', $namespace)) {
                AclHelper::apiPermissionRequired( '', 'update_site_option', $namespace . $option );
            }
            if($option[0] === '_'){
                $value = OptionHelper::encrypt($value);
                $option = substr($option, 1);
            }
            update_site_option($namespace.$option, $value);
            $siteOptions[$option] = get_site_option($namespace.$option);
        }
        $options['site'] = $siteOptions;
        JsonHelper::respond($options);
    }

} 