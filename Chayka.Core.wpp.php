<?php

/*
  Plugin Name: Chayka.Core
  Description: Integration of MVC Framework into Wordpress.
  Author: Boris Mossounov
  Version: 1.0

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation; either version 2 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

 */

namespace Chayka\Core;

require_once 'vendor/autoload.php';

// TODO: refactor WpSidebarWidget

use Chayka\Helpers\Util;
use Chayka\WP;
use Chayka\Helpers\NlsHelper;
use Chayka\WP\Helpers\OptionHelper;

class Plugin extends WP\Plugin{

    public static $adminBar = false;

    public static $instance = null;

    const POST_TYPE_CONTENT_FRAGMENT = 'content-fragment';
    const TAXONOMY_CONTENT_FRAGMENT_TAG = 'content-fragment-tag';

    public static function init(){

        self::$instance = $plugin = new self(__FILE__, array(
            'admin-core', 'upload',
//            'timezone',
            'options',
//            'blockade',
//            'not-found-404'
        ));

        $locale = OptionHelper::getOption('Locale', 'auto');

        NlsHelper::setLocale($locale);

        $plugin->addJsNls();

        $plugin->addSupport_ConsolePages();
        $plugin->addSupport_Metaboxes();
        $plugin->addSupport_PostProcessing();

        $plugin->registerComposerPlugins();

        $plugin->addModals();


    }

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



    public static function slug($title){
        // Возвращаем результат.
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

    public function autoSlug($post){
        if(!$post['post_name'] && $post['post_status']=='draft'){
            $post['post_name'] = self::slug($post['post_title']);
        }else{
            $post['post_name'] = self::slug(urldecode($post['post_name']));
        }
        return $post;
    }

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
        self::addMetaBoxContentFragment();
    }

    public static function addMetaBoxContentFragment(){
        self::getInstance()->addMetaBox(
            'content_fragment',
            'Advanced',
            '/metabox/content-fragment',
            'normal',
            'high',
            self::POST_TYPE_CONTENT_FRAGMENT
        );

    }

    public function savePost($postId, $post){

    }

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

    public function registerActions(){
        $this->addAction('activated_plugin', 'thisPluginGoesFirst');
        Util::sessionStart();
        if(empty($_SESSION['timezone'])){
//            $this->addAction('wp_footer', 'fixTimezone');
        }
    }

    public function registerFilters(){
        $this->addFilter('wp_insert_post_data', 'autoSlug', 10, 1 );
    }

    public function registerResources($minimize = false){
        $this->registerBowerResources(true);
        $this->registerScript('chayka-translate', 'src/ng-modules/chayka-translate.js', array('jquery', 'angular', 'angular-translate'));
        $this->registerScript('chayka-utils', 'src/ng-modules/chayka-utils.js', array('jquery', 'angular'));
        $this->registerScript('chayka-spinners', 'src/ng-modules/chayka-spinners.js', array('jquery', 'angular', 'chayka-translate'));
        $this->registerScript('chayka-ajax', 'src/ng-modules/chayka-ajax.js', array('jquery', 'angular', 'chayka-spinners'));
        $this->registerScript('chayka-forms', 'src/ng-modules/chayka-forms.js', array('jquery', 'angular', 'angular-sanitize', 'chayka-modals', 'chayka-translate'));
        $this->registerScript('chayka-options-form', 'src/ng-modules/chayka-options-form.js', array('chayka-forms'));
        $this->registerScript('chayka-modals', 'src/ng-modules/chayka-modals.js', array('jquery', 'angular', 'angular-sanitize', 'chayka-translate', 'chayka-utils'));
        $this->registerStyle('chayka-modals', 'src/ng-modules/chayka-modals.css', array());
//        $isAdminPost = is_admin() && (strpos($_SERVER['REQUEST_URI'], 'post.php') || strpos($_SERVER['REQUEST_URI'], 'revision.php'));
//
//        // backbone & underscore
//        $this->registerScript( 'Underscore', ($minimize?'vendors/underscore.min.js':'vendors/underscore.js'), array('jquery'));
//        $this->registerScript( 'Backbone', ($minimize?'vendors/backbone.min.js':'vendors/backbone.js'), array('jquery', ($isAdminPost?'underscore': 'Underscore')));
//        $this->registerScript( 'nls', 'vendors/nls.js', array(($isAdminPost?'underscore': 'Underscore')));
//
//        $this->registerScript( 'require', ($minimize?'vendors/require.min.js':'vendors/require.js'));
//
//        $this->registerScript( 'underscore-brx', 'underscore.brx.js', array(($isAdminPost?'underscore':'Underscore')));
//        $this->registerScript( 'brx-parser', 'brx.Parser.js', array('underscore-brx', ($isAdminPost?'backbone':'Backbone')));
//        $this->registerScript( 'backbone-brx', 'backbone.brx.js', array(($isAdminPost?'backbone':'Backbone'), 'underscore-brx', 'brx-parser', 'nls', 'moment', 'brx-ajax'));
//        $this->registerScript( 'brx-ajax', 'brx.Ajax.js', array('underscore-brx'));
//        $this->registerStyle( 'brx-modals', 'brx.Modals.less', array());
//        $this->registerScript( 'brx-modals', 'brx.Modals.js', array('backbone-brx'));
//
//        $this->registerScript( 'backbone-wp-models', 'backbone.wp.models.js', array('backbone-brx'));
//
//        $this->registerScript( 'backbone-brx-pagination', 'brx.Pagination.view.js', array('backbone-brx'));
//
//        $this->registerScript( 'jquery-brx-utils', 'jquery.brx.utils.js', array('jquery',  'nls'));
//
//        $this->registerScript( 'backbone-brx-spinners', 'brx.spinners.view.js', array('backbone-brx'));
//        $this->registerStyle( 'backbone-brx-spinners', 'brx.spinners.view.less');
//
//        $this->registerStyle( 'backbone-brx-modals', 'brx.modals.view.less', array());
//        $this->registerScript( 'backbone-brx-modals', 'brx.modals.view.js', array('jquery-ui-dialog', 'backbone-brx'));
//        $this->registerStyle( 'backbone-brx-optionsForm', 'brx.OptionsForm.view.less');
//        $this->registerScript( 'backbone-brx-optionsForm', 'brx.OptionsForm.view.js', array('backbone-brx'));
////        TODO need progressbar
//        $this->registerScript( 'backbone-brx-jobControl', 'brx.JobControl.view.js', array('backbone-brx', 'jquery-ui-progressbar', 'backbone-brx-spinners'));
//        $this->registerStyle( 'backbone-brx-jobControl', 'brx.JobControl.view.less', array('backbone-brx-spinners'));
//        $this->registerScript( 'backbone-brx-attachmentPicker', 'brx.AttachmentPicker.view.js', array('backbone-brx', 'backbone-brx-spinners'/*, 'jquery-ajax-iframe-uploader'*/));
//        $this->registerStyle( 'backbone-brx-attachmentPicker', 'brx.AttachmentPicker.view.less', array('backbone-brx-spinners'));
//        $this->registerStyle('backbone-brx-taxonomyPicker', 'brx.TaxonomyPicker.view.less');
//        $this->registerScript('backbone-brx-taxonomyPicker', 'brx.TaxonomyPicker.view.js', array('jquery-brx-placeholder','backbone-brx'));
//        $this->registerStyle('backbone-brx-ribbonSlider', 'brx.RibbonSlider.view.less');
//        $this->registerScript('backbone-brx-ribbonSlider', 'brx.RibbonSlider.view.js', array('backbone-brx', 'jquery-touch-swipe'));
////        NlsHelper::registerScriptNls('backbone-brx-countDown-nls', 'brx.CountDown.view.js');
//        $this->registerScript('backbone-brx-countDown', 'brx.CountDown.view.js', array('backbone-brx', 'moment'));
//        $this->registerStyle('backbone-brx-countDown', 'brx.CountDown.view.less', array());
//
//        $this->registerScript('google-youtube-loader', 'google.YouTube.ApiLoader.js', array('backbone-brx'));
//
//        $this->registerStyle( 'admin-setupForm', 'bem-admin_setup_form.less');
//
//        $this->registerStyle('brx-forms', 'brx.forms.less');
//        $this->registerStyle('brx-wp-admin', 'brx.wp.admin.less');

    }

    public function registerConsolePages() {
        $this->addConsolePage('Chayka', 'Chayka', 'update_core', 'chayka-core', '/admin-core/');
//
//        $this->addConsoleSubPage('chayka-core-admin',
//            'phpinfo()', 'phpinfo()', 'update_core', 'zf-core-phpinfo',
//            '/admin/phpinfo');
//
//        $this->addConsoleSubPage('chayka-core-admin',
//            'WP Hooks', 'WP Hooks', 'update_core', 'zf-core-wp-hooks',
//            '/admin/wp-hooks', '', null);
//
//        $this->addConsoleSubPage('chayka-core-admin',
//            'E-mail', 'E-mail settings', 'update_core', 'zf-core-email',
//            '/admin/email-options', '', null);
//
//        $this->addConsoleSubPage('chayka-core-admin',
//            'Blockade', 'Blockade', 'update_core', 'zf-core-blockade',
//            '/admin/blockade-options', '', null);
    }

    public function registerCustomPostTypes() {

    }

    public function registerSidebars() {

    }

    public function registerTaxonomies() {

    }

    /**
     * Routes are to be added here via $this->addRoute();
     */
    public function registerRoutes()
    {

        $this->addRoute('default');
    }

    public function addJsNls(){
        $view = self::getView();
        $this->addAction('wp_head', function() use ($view){
            echo $view->render('chayka-js-nls.phtml');
        });
    }
    public function addModals(){
        wp_enqueue_script('chayka-modals');
        wp_enqueue_style('chayka-modals');
        $view = self::getView();
        $this->addAction('wp_footer', function() use ($view){
            echo $view->render('chayka-modals.phtml');
        });
    }
    public function addSpinners(){
        wp_enqueue_script('chayka-spinners');
        wp_enqueue_style('chayka-spinners');
        $view = self::getView();
        $this->addAction('wp_footer', function() use ($view){
            echo $view->render('chayka-spinners.phtml');
        });
    }
}

Plugin::init();
