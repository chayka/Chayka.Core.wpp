<?php

namespace Chayka\Core;

use Chayka\MVC\Pagination;
use Chayka\WP;
use Chayka\Helpers\Util;
use Chayka\Helpers\NlsHelper;
use Chayka\WP\Helpers\OptionHelper;

class Plugin extends WP\Plugin{

    const POST_TYPE_CONTENT_FRAGMENT = 'content-fragment';
    const TAXONOMY_CONTENT_FRAGMENT_TAG = 'content-fragment-tag';
    /* chayka: constants */

    public static $adminBar = false;

    public static $instance = null;

    public static function init(){
        if(!static::$instance){
            static::$instance = $app = new self(__FILE__, array(
                'upload',
//            'timezone',
                'options',
//            'blockade',
//            'not-found-404'
                /* chayka: init/controllers */
            ));

            $locale = OptionHelper::getOption('Locale', 'auto');

            NlsHelper::setLocale($locale);

            $app->addJsNls();

            $app->addSupport_ConsolePages();
            $app->addSupport_Metaboxes();
            $app->addSupport_PostProcessing();
//          $app->addSupport_UriProcessing();

            $app->registerComposerPlugins();

            $app->addModals();
            $app->addSpinners();
            $app->addPagination();
            /* chayka: init-addSupport */
        }
    }

    /**
     * This code ensures this plugin is loaded first
     */
    public function thisPluginGoesFirst() {
        // ensure path to this file is via main wp plugin path
        $wpPathToThisFile = preg_replace('/(.*)plugins\/(.*)$/', WP_PLUGIN_DIR . "/$2", __FILE__);
        $thisPlugin = plugin_basename(trim($wpPathToThisFile));
        $activePlugins = get_option('active_plugins');
        $thisPluginKey = array_search($thisPlugin, $activePlugins);
        if ($thisPluginKey) { // if it's 0 it's the first plugin already, no need to continue
            array_splice($activePlugins, $thisPluginKey, 1);
            array_unshift($activePlugins, $thisPlugin);
            update_option('active_plugins', $activePlugins);
        }
    }

    /**
     * Translit provided string
     * @param $title
     * @return string
     */
    public static function slug($title){
        $table = array(
            'А' => 'A', 'Б' => 'B', 'В' => 'V', 'Г' => 'G', 'Д' => 'D', 'Е' => 'E',
            'Ё' => 'YO', 'Ж' => 'ZH', 'З' => 'Z', 'И' => 'I', 'Й' => 'J',
            'К' => 'K', 'Л' => 'L', 'М' => 'M', 'Н' => 'N', 'О' => 'O', 'П' => 'P',
            'Р' => 'R', 'С' => 'S', 'Т' => 'T', 'У' => 'U', 'Ф' => 'F', 'Х' => 'H',
            'Ц' => 'C', 'Ч' => 'CH', 'Ш' => 'SH', 'Щ' => 'CSH', 'Ь' => '',
            'Ы' => 'Y', 'Ъ' => '', 'Э' => 'E', 'Ю' => 'YU', 'Я' => 'YA',

            'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'g', 'д' => 'd', 'е' => 'e',
            'ё' => 'yo', 'ж' => 'zh', 'з' => 'z', 'и' => 'i', 'й' => 'j',
            'к' => 'k', 'л' => 'l', 'м' => 'm', 'н' => 'n', 'о' => 'o', 'п' => 'p',
            'р' => 'r', 'с' => 's', 'т' => 't', 'у' => 'u', 'ф' => 'f', 'х' => 'h',
            'ц' => 'c', 'ч' => 'ch', 'ш' => 'sh', 'щ' => 'csh', 'ь' => '',
            'ы' => 'y', 'ъ' => '', 'э' => 'e', 'ю' => 'yu', 'я' => 'ya',
        );

        $title = str_replace(
            array_keys($table),
            array_values($table),$title
        );
        $title = sanitize_title($title);
        return $title;
    }

    /**
     * Callback
     * @param $post
     * @return mixed
     */
    public function autoSlug($post){
        if(!$post['post_name'] && $post['post_status']=='draft'){
            $post['post_name'] = self::slug($post['post_title']);
        }else{
            $post['post_name'] = self::slug(urldecode($post['post_name']));
        }
        return $post;
    }

    public static function checkDomainAndScheme(){
        $server = Util::serverName();
        $scheme = OptionHelper::getOption('SingleScheme');
        $schemeDiffers = $scheme === 'http' && $_SERVER['HTTPS'] || $scheme === 'https' && !$_SERVER['HTTPS'];
        if($scheme){
            $scheme.=':';
        }
        switch(OptionHelper::getOption('SingleDomain')){
            case 'www':
//                die($_SERVER['SERVER_NAME'].' ! '.$server);
                if($_SERVER['SERVER_NAME'] !== 'www.'.$server){
                    header("Location: $scheme//www.".$server.$_SERVER['REQUEST_URI'], true, 301);
                    die();
                }
                break;
            case 'no-www':
                if($_SERVER['SERVER_NAME'] === 'www.'.$server){
                    header("Location: $scheme//".$server.$_SERVER['REQUEST_URI'], true, 301);
                    die();
                }
                break;
            default :
                if($schemeDiffers){
                    header("Location: $scheme//".$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'], true, 301);
                    die();
                }
        }
    }

    public function addJsNls(){
        $view = self::getView();
        $cb = function() use ($view){
            echo $view->render('chayka-js-nls.phtml');
        };
        $this->addAction('wp_head', $cb);
        $this->addAction('admin_head', $cb);
    }

    public function addModals(){
        WP\Helpers\ResourceHelper::enqueueScriptStyle('chayka-modals');
//        wp_enqueue_script('chayka-modals');
//        wp_enqueue_style('chayka-modals');
        $view = self::getView();
        $cb = function() use ($view){
            echo $view->render('chayka-modals.phtml');
        };
        $this->addAction('wp_footer', $cb);
        $this->addAction('admin_footer', $cb);
    }

    public function addSpinners(){
        WP\Helpers\ResourceHelper::enqueueScriptStyle('chayka-spinners');
//        wp_enqueue_script('chayka-spinners');
//        wp_enqueue_style('chayka-spinners');
        $view = self::getView();
        $cb = function() use ($view){
            echo $view->render('chayka-spinners.phtml');
        };
        $this->addAction('wp_footer', $cb);
        $this->addAction('admin_footer', $cb);
    }

    public function addPagination(){
        Pagination::getInstance()->setViewTemplate($this->getPath('app/views/chayka-pagination.phtml'));
    }

    /**
     * Register your action hooks here using $this->addAction();
     */
    public function registerActions() {
        $this->addAction('activated_plugin', 'thisPluginGoesFirst');
        $this->addAction('parse_request', 'checkDomainAndScheme', 1);
        Util::sessionStart();
        if(empty($_SESSION['timezone'])){
//            $this->addAction('wp_footer', 'fixTimezone');
        }
    	/* chayka: registerActions */
    }

    /**
     * Register your action hooks here using $this->addFilter();
     */
    public function registerFilters() {
        $this->addFilter('wp_insert_post_data', 'autoSlug', 10, 1 );
		/* chayka: registerFilters */
    }

    /**
     * Register scripts and styles here using $this->registerScript() and $this->registerStyle()
     *
     * @param bool $minimize
     */
    public function registerResources($minimize = false) {

        $this->registerBowerResources(true);

        $this->setResSrcDir('src/');
        $this->setResDistDir('dist/');

        $this->registerScript('chayka-translate', 'ng-modules/chayka-translate.js', array('jquery', 'angular', 'angular-translate'));

        $this->registerScript('chayka-utils', 'ng-modules/chayka-utils.js', array('jquery', 'angular'));

        $this->registerScript('chayka-spinners', 'ng-modules/chayka-spinners.js', array('jquery', 'angular', 'chayka-translate', 'chayka-utils'));
        $this->registerStyle('chayka-spinners', 'ng-modules/chayka-spinners.css', array());

        $this->registerScript('chayka-modals', 'ng-modules/chayka-modals.js', array('jquery', 'angular', 'angular-sanitize', 'chayka-translate', 'chayka-utils'));
        $this->registerStyle('chayka-modals', 'ng-modules/chayka-modals.css', array());

        $this->registerScript('chayka-ajax', 'ng-modules/chayka-ajax.js', array('jquery', 'angular', 'chayka-spinners'));

        $this->registerScript('chayka-forms', 'ng-modules/chayka-forms.js', array('jquery', 'angular', 'angular-sanitize', 'chayka-modals', 'chayka-translate', 'chayka-ajax'));
        $this->registerStyle('chayka-forms', 'ng-modules/chayka-forms.css', array());

        $this->registerScript('chayka-options-form', 'ng-modules/chayka-options-form.js', array('chayka-forms'));
        $this->registerStyle('chayka-options-form', 'ng-modules/chayka-options-form.css', array('chayka-forms'));

        $this->registerScript('chayka-pagination', 'ng-modules/chayka-pagination.js', array('chayka-utils', 'chayka-translate'));
        $this->registerStyle('chayka-pagination', 'ng-modules/chayka-pagination.css', array());

        $this->registerScript('chayka-wp-admin', 'ng-modules/chayka-wp-admin.js', array('chayka-spinners', 'chayka-translate', 'chayka-utils'));
        $this->registerStyle('chayka-wp-admin', 'ng-modules/chayka-wp-admin.css', array('chayka-forms'));

        $this->registerMinimizedScript('chayka-core', 'ng-modules/chayka-core.js', array(
            'chayka-translate',
            'chayka-utils',
            'chayka-spinners',
            'chayka-modals',
            'chayka-ajax',
            'chayka-forms',
            'chayka-pagination',
        ));

        $this->registerMinimizedStyle('chayka-core', 'ng-modules/chayka-core.css', array(
            'chayka-spinners',
            'chayka-modals',
            'chayka-forms',
            'chayka-pagination',
        ));

        $this->registerMinimizedScript('chayka-admin', 'ng-modules/chayka-admin.js', array(
            'chayka-options-form',
            'chayka-wp-admin',
        ));

        $this->registerMinimizedStyle('chayka-admin', 'ng-modules/chayka-admin.css', array(
            'chayka-options-form',
            'chayka-wp-admin',
        ));

		/* chayka: registerResources */
    }

    /**
     * Routes are to be added here via $this->addRoute();
     */
    public function registerRoutes() {
        $this->addRoute('default');
    }

    /**
     * Custom post type are to be added here
     */
    public function registerCustomPostTypes() {
		/* chayka: registerCustomPostTypes */	
    }

    /**
     * Registers CPT Content fragment.
     * Not called directly in registerCustomPostTypes.
     * Called from custom themes and plugins if needed.
     */
    public static function registerCustomPostTypeContentFragment() {
        $labels = array(
            'name' => NlsHelper::_('Content fragment'), //'post type general name'
            'singular_name' => NlsHelper::_('Content fragment'), //'post type singular name'
            'add_new' => NlsHelper::_('Add fragment'), //'item'
            'add_new_item' => NlsHelper::_('Add fragment'),
            'edit_item' => NlsHelper::_('Edit fragment'),
            'new_item' => NlsHelper::_('New fragment'),
            'all_items' => NlsHelper::_('All fragments'),
            'view_item' => NlsHelper::_('View fragment'),
            'search_items' => NlsHelper::_('Search fragments'),
            'not_found' => NlsHelper::_('No fragments found'),
            'not_found_in_trash' => NlsHelper::_('No deleted fragments found'),
            'parent_item_colon' => 'Parent fragment:',
            'menu_name' => NlsHelper::_('Content fragments')
        );
        $args = array(
            'labels' => $labels,
            'public' => true,
            'publicly_queryable' => false,
            'show_ui' => true,
            'show_in_menu' => true,
            'capability_type' => 'post',
            'has_archive' => false,
            'hierarchical' => true,
            'menu_position' => 20,
            'taxonomies' => array(
                self::TAXONOMY_CONTENT_FRAGMENT_TAG
            ),
            'supports' => array(
                'title',
                'editor',
                'thumbnail',
                'excerpt',
                'page-attributes'
            )
        );
        register_post_type(self::POST_TYPE_CONTENT_FRAGMENT, $args);
        self::registerTaxonomyContentFragmentTag();
//        self::addMetaBoxContentFragment();
    }
	/* chayka: registerCustomPostType */
	

    /**
     * Custom Taxonomies are to be added here
     */
    public function registerTaxonomies() {
		/* chayka: registerTaxonomies */
    }

    /**
     * Registers taxonomy 'tag' for CPT Content fragment.
     * Not called directly in registerTaxonomies.
     * Called from registerCustomPostTypeContentFragment().
     */
    public static function registerTaxonomyContentFragmentTag(){
        $labels = array(
            'name' => NlsHelper::_('Fragment Tags'), //'taxonomy general name'),
            'singular_name' => NlsHelper::_('Fragment Tag'), //'taxonomy singular name'),
            'search_items' => NlsHelper::_('Search tags'),
            'all_items' => NlsHelper::_('All tags'),
            'edit_item' => NlsHelper::_('Edit'),
            'update_item' => NlsHelper::_('Update'),
            'add_new_item' => NlsHelper::_('Add tag'),
            'new_item_name' => NlsHelper::_('New tag name'),
            'menu_name' => NlsHelper::_('Fragment Tags'),
        );

        register_taxonomy(self::TAXONOMY_CONTENT_FRAGMENT_TAG,
            array(
                self::POST_TYPE_CONTENT_FRAGMENT,
            ),
            array(
                'hierarchical' => false,
                'labels' => $labels,
                'show_ui' => true,
                'query_var' => true,
                'show_admin_column' => true,
                'rewrite' => array('slug' => self::TAXONOMY_CONTENT_FRAGMENT_TAG),
            ));
    }
	/* chayka: registerTaxonomy */

    /**
     * Registering console pages
     */
    public function registerConsolePages(){
        $this->addConsolePage('Chayka', 'update_core', 'chayka-core', '/admin/');

        $this->addConsoleSubPage('chayka-core',
            'phpinfo()', 'update_core', 'chayka-core-phpinfo',
            '/admin/phpinfo');

        $this->addConsoleSubPage('chayka-core',
            'WP Hooks', 'update_core', 'chayka-core-wp-hooks',
            '/admin/wp-hooks', '', null);

//        $this->addConsoleSubPage('chayka-core-admin',
//            'Blockade', 'Blockade', 'update_core', 'zf-core-blockade',
//            '/admin/blockade-options', '', null);
        /* chayka: registerConsolePages */
    }
    
    /**
     * Add custom metaboxes here via addMetaBox() calls;
     */
    public function registerMetaBoxes(){
        /* chayka: registerMetaBoxes */
    }
}

Plugin::init();