<?php

namespace Chayka\Core;

use Chayka\WP\Helpers;

class EmailHelper extends Helpers\EmailHelper{

    /**
     * Get email template
     * 
     * @return string
     */
    public static function getTemplatePath(){
        $fn = parent::getTemplatePath();
        if(!file_exists($fn)){
            $fn = Plugin::getInstance()->getPath('app/views/email/template.phtml');
        }
        return $fn;
    }

    /**
     * Get view to render
     * 
     * @return \Chayka\MVC\View
     */
    public static function getView(){
        $view = Plugin::getView();
        return $view;
    }

}

