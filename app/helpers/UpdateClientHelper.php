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
use Chayka\Helpers\LogHelper;
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
//        Util::print_r($result);
        $payload = Util::getItem($result, 'payload', []);
        return Util::getItem($payload, 'response', []);
    }

    /**
     * @param int $cacheTimeout
     *
     * @return mixed
     */
    public static function getUpdates($cacheTimeout = 60){
        return CacheHelper::getSiteValue('Chayka.Plugins.Updates', function (){
            return self::requestUpdates();
        }, $cacheTimeout);
    }

    /**
     * @param $transient
     *
     * @return mixed
     */
    public static function updatePluginsTransient($transient){
        if (empty($transient->last_checked)) {
            return $transient;
        }

        $updates = self::getUpdates();

        $plugins = self::getInstalledPluginsData();

        foreach($plugins as $path => $plugin){
            $update = Util::getItem($updates, $path);
            if (strpos($path, '/') && $update && version_compare($plugin['version'], $update['version'], '<')) {
                $obj = (object)$update;
//                list($pluginDir, $phpScript) = explode('/', $path);
//                $obj = new \stdClass();
//                $obj->slug = $pluginDir;
//                $obj->new_version = $update['version'];
//                $obj->url = $update['url_info'];
//                $obj->package = $update['url_download'];
//                $obj->compatibility = false;
//                $obj->tested = $update['tested'];
                $transient->response[$path] = $obj;
            }
        }

        return $transient;
    }

    public static function pluginInformation($false, $action, $arg){
        if('plugin_information' === $action){
            $slug = Util::getItem($arg, 'slug');
            LogHelper::dir($arg, 'Looking update for');

            $updates = self::getUpdates();
//            $update = (object) Util::getItem($updates, $slug);
            $update = $false;
            foreach($updates as $u){
                if($slug === $u['slug']){
                    $update = (object) $u;
                    break;
                }
            }
            if($update && $slug === $update->slug){
//                $obj = (object) $update;
//                $obj = new stdClass();
//                $obj->slug = $slug;
//                $obj->plugin_name = 'plugin.php';
//                $obj->new_version = '1.1';
//                $obj->requires = '3.0';
//                $obj->tested = '3.3.1';
//                $obj->downloaded = 12540;
//                $obj->last_updated = '2012-01-12';
//                $obj->sections = array(
//                    'description' => 'The new version of the Auto-Update plugin',
//                    'another_section' => 'This is another section',
//                    'changelog' => 'Some new features'
//                );
//                $obj->download_link = 'http://localhost/update.php';
                LogHelper::dir($update, 'Update Object');
                return $update;
            }
        }

        return $false;
    }
    
    public static function allowCustomUpdateServer( $allow, $host, $url ) {
        $updateServerUrl = OptionHelper::getEncryptedOption('updateServerUrl');
        $updateServerUrl = trailingslashit($updateServerUrl);
        $updateServerHost = parse_url($updateServerUrl, 'host');
        if ( $host === $updateServerHost ){
            $allow = true;
        }
        return $allow;
    }
}
