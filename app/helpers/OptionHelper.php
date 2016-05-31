<?php

namespace Chayka\Core;

use Chayka\WP\Helpers;

class OptionHelper extends Helpers\OptionHelper{

    /**
     * Have to override standard method because some functionality
     * implemented in Chayka\WP uses options with Chayka.WP prefix
     *
     * @return string
     */
    public static function getPrefix(){
        return 'Chayka.WP.';
    }
} 