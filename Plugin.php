<?php

namespace Chayka\Core;

use Chayka\MVC\Pagination;
use Chayka\WP;
use Chayka\Helpers\Util;
use Chayka\Helpers\NlsHelper;
use Chayka\Helpers\LogHelper;
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
	            'post-model',
	            'post-models',
	            'comment-model',
	            'comment-models',
	            'user-model',
	            'user-models',
                'update'
                /* chayka: init/controllers */
            ));

            /**
             * Logs settings
             */
            $logLevel = 0;
            if(OptionHelper::getOption('logFunctions')){
                $logLevel |= LogHelper::NEED_FUNC;
            }
            if(OptionHelper::getOption('logErrors')){
                $logLevel |= LogHelper::NEED_ERROR;
            }
            if(OptionHelper::getOption('logWarnings')){
                $logLevel |= LogHelper::NEED_WARNING;
            }
            if(OptionHelper::getOption('logInfo')){
                $logLevel |= LogHelper::NEED_INFO;
            }
            $logsDir = OptionHelper::getOption('logsFolderLocation', 'core') === 'core' ?
                $app->getPath('logs') :
                ABSPATH.'/logs';

            LogHelper::init($logsDir, $logLevel);
            LogHelper::flushLogsFolder(OptionHelper::getOption('logsLifeSpan'));

            /**
             * Locale setting
             */
            $locale = OptionHelper::getOption('Locale', 'auto');
            NlsHelper::setLocale($locale);

            $app->addAngular();
//            $app->addJsNls();

            $app->addSupport_UriProcessing();
            $app->addSupport_ConsolePages();
            $app->addSupport_Metaboxes();
            $app->addSupport_PostProcessing();

            $app->registerComposerPlugins();

            $app->addPagination();
            /* chayka: init-addSupport */
        }
    }

    /**
     * This code ensures this plugin is loaded first
     */
    public function thisPluginGoesFirst() {
        // ensure path to this file is via main wp plugin path
        //$wpPathToThisFile = preg_replace('/(.*)plugins\/(.*)Plugin$/', WP_PLUGIN_DIR . "/$2Chayka.Core.wpp", __FILE__);
	    $wpPathToThisFile = $this->basePath.'Chayka.Core.wpp.php';
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
        $title = Util::translit($title);
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

	public function addAngular(){
		$view = self::getView();
		$cb   = function () use ( $view ) {
			echo $view->render( 'chayka-ng.phtml' );
		};
		$this->addAction( 'wp_footer', $cb, 1000 );
		$this->addAction( 'admin_footer', $cb, 1000 );
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
        $this->addAction('admin_head', function(){
            if(is_admin() && in_array('chayka-buttons', WP\Helpers\AngularHelper::getQueue())){
                WP\Helpers\AngularHelper::enqueueScriptStyle('chayka-wp-admin');
            }
        });
        Util::sessionStart();
        if(empty($_SESSION['timezone'])){
//            $this->addAction('wp_footer', 'fixTimezone');
        }
        if(true){
            if(is_active_sidebar('chayka-core-js-header')){
                $this->addAction('wp_head', function (){
                    echo '<div id="chayka-core-js-header" style="display: none;">';
                    dynamic_sidebar('chayka-core-js-header');
                    echo '</div>';
                });
            }
            if(is_active_sidebar('chayka-core-js-footer')){
                $this->addAction('wp_footer', function (){
                    echo '<div id="chayka-core-js-footer" style="display: none;">';
                    dynamic_sidebar('chayka-core-js-footer');
                    echo '</div>';
                });
            }

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
        $this->registerBowerResources(false);
        $this->unregisterScript('angular');
        $this->registerScript('angular', $minimize ? 'lib/angular/angular.min.js':'lib/angular/angular.js', ['jquery'], '1.3.0');
        $this->registerStyle('angular', 'lib/angular/angular-csp.css', [], '1.3.0');
        $this->enqueueStyle('angular');
//	    $this->setScriptLocation('angular', false);
//	    $this->setScriptLocation('angular-sanitize', true);
//	    $this->setScriptLocation('angular-translate', true);

        $this->setResSrcDir('src/');
        $this->setResDistDir('dist/');

	    $this->registerNgScript('chayka-nls', 'ng-modules/chayka-nls.js', ['chayka-utils'], function(){
		    $view = self::getView();
		    $cb = function() use ($view){
			    echo $view->render('chayka-js-nls.phtml');
		    };
		    $this->addAction('wp_head', $cb);
		    $this->addAction('admin_head', $cb);
	    });

	    $this->registerNgScript('chayka-utils', 'ng-modules/chayka-utils.js', [], function(){
            $view = self::getView();
            $cb = function() use ($view){
                echo $view->render('chayka-js-app-urls.phtml');
            };
            $this->addAction('wp_head', $cb);
            $this->addAction('admin_head', $cb);
        });

	    $this->registerNgScript('chayka-spinners', 'ng-modules/chayka-spinners.js', ['chayka-nls', 'chayka-utils'], function(){
		    $view = self::getView();
		    $cb = function() use ($view){
			    echo $view->render('chayka-spinners.phtml');
		    };
		    $this->addAction('wp_footer', $cb, 1000);
		    $this->addAction('admin_footer', $cb, 1000);
	    });
        $this->registerNgStyle('chayka-spinners', 'ng-modules/chayka-spinners.css');

	    $this->registerNgScript('chayka-buttons', 'ng-modules/chayka-buttons.js');

	    $this->registerNgScript('chayka-modals', 'ng-modules/chayka-modals.js', ['chayka-buttons', 'chayka-nls', 'chayka-utils', 'angular-sanitize'], function(){
		    $view = self::getView();
		    $cb = function() use ($view){
			    echo $view->render('chayka-modals.phtml');
		    };
		    $this->addAction('wp_footer', $cb, 1000);
		    $this->addAction('admin_footer', $cb, 1000);
	    });
        $this->registerNgStyle('chayka-modals', 'ng-modules/chayka-modals.css');

	    $this->registerNgScript('chayka-ajax', 'ng-modules/chayka-ajax.js', ['chayka-spinners']);

	    $this->registerNgScript('chayka-forms', 'ng-modules/chayka-forms.js', ['chayka-modals', 'chayka-nls', 'chayka-ajax', 'angular-sanitize']);
        $this->registerNgStyle('chayka-forms', 'ng-modules/chayka-forms.css', ['chayka-spinners']);

	    $this->registerNgScript('chayka-wp-admin', 'ng-modules/chayka-wp-admin.js', ['chayka-spinners', 'chayka-nls', 'chayka-utils', 'chayka-modals', 'chayka-forms', 'ng-sortable', 'wp-color-picker']);
	    $this->registerNgStyle('chayka-wp-admin', 'ng-modules/chayka-wp-admin.css', ['chayka-forms', 'chayka-modals', 'ng-sortable', 'wp-color-picker']);

	    $this->registerNgScript('chayka-options-form', 'ng-modules/chayka-options-form.js', ['chayka-forms', 'chayka-wp-admin']);
        $this->registerNgStyle('chayka-options-form', 'ng-modules/chayka-options-form.css', ['chayka-forms', 'chayka-wp-admin']);

	    $this->registerNgScript('chayka-pagination', 'ng-modules/chayka-pagination.js', ['chayka-utils', 'chayka-nls']);
        $this->registerNgStyle('chayka-pagination', 'ng-modules/chayka-pagination.css');

	    $this->registerNgScript('chayka-avatars', 'ng-modules/chayka-avatars.js', ['chayka-utils', 'angular-md5'], function(){
		    $view = self::getView();
		    $cb = function() use ($view){
			    echo $view->render('chayka-avatars.phtml');
		    };
		    $this->addAction('wp_footer', $cb, 1000);
	    });

        $this->registerMinimizedScript('chayka-core', 'ng-modules/chayka-core.js', [
//	        'angular-translate',
	        'angular-sanitize',
            'chayka-nls',
            'chayka-utils',
            'chayka-spinners',
	        'chayka-buttons',
            'chayka-modals',
            'chayka-ajax',
            'chayka-forms',
            'chayka-pagination',
        ]);

        $this->registerMinimizedStyle('chayka-core', 'ng-modules/chayka-core.css', [
	        'angular',
            'chayka-spinners',
            'chayka-modals',
            'chayka-forms',
            'chayka-pagination',
        ]);

        $this->registerMinimizedScript('chayka-admin', 'ng-modules/chayka-admin.js', [
            'chayka-options-form',
            'chayka-wp-admin',
        ]);

        $this->registerMinimizedStyle('chayka-admin', 'ng-modules/chayka-admin.css', [
            'chayka-options-form',
            'chayka-wp-admin',
        ]);

	    $this->registerMinimizedScript('chayka-avatars-md5', 'ng-modules/chayka-avatars-md5.js', [
		    'angular-md5',
		    'chayka-avatars',
	    ]);

	    /* chayka: registerResources */
    }

    /**
     * Routes are to be added here via $this->addRoute();
     */
    public function registerRoutes() {
        $this->addRoute('default');

	    $this->addRestRoutes('post-model', 'post-models', '/?id', array('id'=>'/^\d+$/'), '\\Chayka\\WP\\Models\\PostModel');

	    $this->addRestRoutes('comment-model', 'comment-models', '/?id', array('id'=>'/^\d+$/'), '\\Chayka\\WP\\Models\\CommentModel');

	    $this->addRestRoutes('user-model', 'user-models', '/?id', array('id'=>'/^\d+$/'), '\\Chayka\\WP\\Models\\UserModel');
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
            '/admin/wp-hooks');

//        $this->addConsoleSubPage('chayka-core-admin',
//            'Blockade', 'Blockade', 'update_core', 'zf-core-blockade',
//            '/admin/blockade-options', '', null);
        $this->addConsoleSubPage('chayka-core', 'Logs', 'update_core', 'logs', '/admin/logs');

        /* chayka: registerConsolePages */
    }
    
    /**
     * Add custom metaboxes here via addMetaBox() calls;
     */
    public function registerMetaBoxes(){
        /* chayka: registerMetaBoxes */
    }

    /**
     * Add custom sidebars
     */
    public function registerSidebars(){
        if(true){
            register_sidebar(array(
                'name'          => 'Javascript - Header',
                'id'            => 'chayka-core-js-header',
                'before_widget' => '',
                'after_widget'  => '',
                'before_title'  => "<!--",
                'after_title'   => "-->\n"
            ));
            register_sidebar(array(
                'name'          => 'Javascript - Footer',
                'id'            => 'chayka-core-js-footer',
                'before_widget' => '',
                'after_widget'  => '',
                'before_title'  => "<!--",
                'after_title'   => "-->\n"
            ));
        }
    }
}

Plugin::init();