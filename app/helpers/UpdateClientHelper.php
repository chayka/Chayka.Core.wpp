<?php
/**
 * Created by PhpStorm.
 * User: borismossounov
 * Date: 10.04.16
 * Time: 9:44
 */

namespace Chayka\Core;
use Chayka\Helpers\DateHelper;
use Chayka\Helpers\FsHelper;
use Chayka\Helpers\RandomizerHelper;

/**
 * Class UpdateClientHelper is responsible for communicating with update server
 *
 * @package Chayka\Core
 */
class UpdateClientHelper{

    /**
     * Temporary access route
     * 
     * @var string
     */
    private static $temporaryAccessRoute = '';

    /**
     * Temporary access route expiration date
     * 
     * @var \DateTime|null
     */
    private static $temporaryAccessExpirationDate = null;
    
    /**
     * Discover installed plugins and return array that holds plugins data:
     * - name,
     * - description,
     * - version
     *
     * @return array
     */
    public static function getInstalledPluginsData(){
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

        return $data;
    }

    /**
     * Returns temporary route that update service will knock.
     * IMPORTANT: If param is set, new one will be generated and expiration will be set. 
     * 
     * @param int $expirationPeriodInSeconds
     *
     * @return string
     */
    public static function getTemporaryAccessRoute($expirationPeriodInSeconds = 0){
        if(!self::$temporaryAccessRoute && !$expirationPeriodInSeconds){
            self::$temporaryAccessRoute = get_option('Chayka.UpdateClient.temporaryAccessRoute', '');
            $expirationDate = get_option('Chayka.UpdateClient.temporaryAccessExpirationDate', null);
            self::$temporaryAccessExpirationDate = $expirationDate ? DateHelper::dbStrToDatetime($expirationDate) : null;
        }
        if(!self::$temporaryAccessRoute || $expirationPeriodInSeconds){
            $existing = [self::$temporaryAccessRoute];
            self::$temporaryAccessRoute = mb_strtolower(str_replace(' ', '-', RandomizerHelper::getRandomCelebrity($existing)));
            update_option('Chayka.UpdateClient.temporaryAccessRoute', self::$temporaryAccessRoute);
            $expirationDate = new \DateTime();
            $expirationDate->add(new \DateInterval(sprintf('PT%dS', $expirationPeriodInSeconds)));
            self::$temporaryAccessExpirationDate = $expirationDate;
            update_option('Chayka.UpdateClient.temporaryAccessExpirationDate', DateHelper::datetimeToDbStr($expirationDate));
        }
        return self::$temporaryAccessRoute;
    }

    /**
     * Checks if we did not hit the expiration date, so the access route is considered to be open.
     * 
     * @return bool
     */
    public static function isTemporaryAccessRouteOpen(){
        $now = new \DateTime();
        self::getTemporaryAccessRoute();
        return self::$temporaryAccessExpirationDate?
            self::$temporaryAccessExpirationDate > $now : false;
    }

    public static function getTemporaryAccessExpirationDate(){
        self::getTemporaryAccessRoute();
        return self::$temporaryAccessExpirationDate;
    }
}