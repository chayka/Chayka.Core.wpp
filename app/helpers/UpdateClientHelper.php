<?php
/**
 * Created by PhpStorm.
 * User: borismossounov
 * Date: 10.04.16
 * Time: 9:44
 */

namespace Chayka\Core;
use Chayka\Helpers\CurlHelper;
use Chayka\Helpers\DateHelper;
use Chayka\Helpers\FsHelper;
use Chayka\Helpers\RandomizerHelper;
use Chayka\Helpers\Util;
use Chayka\WP\Helpers\CacheHelper;

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
        if(!function_exists('get_plugins')){
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $data = [];

        $pluginsRootDir = defined('WP_PLUGIN_DIR')? WP_PLUGIN_DIR.'/' : WP_CONTENT_DIR.'/plugins/';
//
//        $plugins = FsHelper::readDir($pluginsRootDir);

        $plugins = get_plugins();

        foreach($plugins as $path => $plugin){
            if(strpos($path, '/')){
                list($pluginFolder, $phpScript) = explode('/', $path);
                $configFn = $pluginsRootDir . $pluginFolder . '/chayka.json';
                $slug = str_replace('.php', '', $phpScript);
                $slug = strtolower($slug);
                $slug = preg_replace('/[^\w\d]+/', '-', $slug);
                if(file_exists($configFn)){
                    $json = file_get_contents($configFn);
                    $config = json_decode($json);
                    $data[$path] = [
                        'name' => $config->appName,
                        'slug' => $slug,
                        'version' => $config->appVersion,
                    ];
                }
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
            self::$temporaryAccessRoute = OptionHelper::getEncryptedOption('UpdateClient.temporaryAccessRoute', '');
            $expirationDate = OptionHelper::getEncryptedOption('UpdateClient.temporaryAccessExpirationDate', null);
            self::$temporaryAccessExpirationDate = $expirationDate ? DateHelper::dbStrToDatetime($expirationDate) : null;
        }
        if(!self::$temporaryAccessRoute || $expirationPeriodInSeconds){
            $existing = [self::$temporaryAccessRoute];
            self::$temporaryAccessRoute = mb_strtolower(str_replace(' ', '-', RandomizerHelper::getRandomCelebrity($existing)));
            OptionHelper::setEncryptedOption('UpdateClient.temporaryAccessRoute', self::$temporaryAccessRoute);
            $expirationDate = new \DateTime();
            $expirationDate->add(new \DateInterval(sprintf('PT%dS', $expirationPeriodInSeconds)));
            self::$temporaryAccessExpirationDate = $expirationDate;
            OptionHelper::setEncryptedOption('UpdateClient.temporaryAccessExpirationDate', DateHelper::datetimeToDbStr($expirationDate));
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

    /**
     * @return \DateTime|null
     */
    public static function getTemporaryAccessExpirationDate(){
        self::getTemporaryAccessRoute();
        return self::$temporaryAccessExpirationDate;
    }

    /**
     * @return array
     */
    public static function requestUpdates(){
        set_time_limit(0);
        $url = OptionHelper::getEncryptedOption('updateServerUrl');
        $url = untrailingslashit($url) . '/api/release/get-updates';
        $result = [];
        if($url){
            $result = CurlHelper::postJson($url, ['plugins' => self::getInstalledPluginsData()]);
        }

        $payload = Util::getItem($result, 'payload', []);
        return Util::getItem($payload, 'response', []);
    }

    public static function updatePluginsTransient($transient){
        if (empty($transient->last_checked)) {
            return $transient;
        }

        $updates = CacheHelper::getSiteValue('Chayka.Plugins.Updates', function (){
            return self::requestUpdates();
        }, 60);

        $plugins = self::getInstalledPluginsData();

        foreach($plugins as $path => $plugin){
            $update = Util::getItem($updates, $path);
            if (strpos($path, '/') && $update && version_compare($plugin['version'], $update['version'], '<')) {
                list($pluginDir, $phpScript) = explode('/', $path);
                $obj = new \stdClass();
                $obj->slug = $pluginDir;
                $obj->new_version = $update['version'];
                $obj->url = $update['url_info'];
                $obj->package = $update['url_download'];
                $obj->compatibility = false;
                $obj->tested = $update['tested'];
                $transient->response[$path] = $obj;
            }
        }

        return $transient;
    }
}
