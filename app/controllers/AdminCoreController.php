<?php
/**
 * Created by PhpStorm.
 * User: borismossounov
 * Date: 31.10.14
 * Time: 13:07
 */

namespace Chayka\Core;

use Chayka\MVC\Controller;

class AdminCoreController extends Controller{

    public function init(){

    }

    public function indexAction(){
        wp_enqueue_script('chayka-options-form');
    }

    public function wpHooksAction(){
        $tables = array();

        global $wp_filter;

        foreach($wp_filter as $tag=>$filters){
            $table = array();
            foreach ($filters as $priority=>$filterSet){
                foreach($filterSet as $func=>$implementation){
                    $function = $implementation['function'];
                    $callback = $function;
                    if(is_array($function)){
                        list($cls, $method) = $function;
                        $delimiter = '::';
                        if(is_object($cls)){
                            $delimiter = '->';
                            $cls = get_class($cls);
                        }
                        $callback = sprintf('%s %s %s', $cls, $delimiter, $method);
                    }elseif(is_object($function) && ($function instanceof \Closure)){
                        $callback = 'Closure';
                    }else{
//                        $r = $this->ReflectionFunctionFactory($function);
//                        $r = new ReflectionMethod("wpp_BRX_SearchEngine", 'addMetaBoxSearchOptions');
//                        $file = $r->getFileName();
//                        $startLine = $r->getStartLine();
//                        $ref = sprintf('%s (%d)', $file, $startLine);
                    }
//                    $ref = '';
                    $table[]=array(
                        'priority' => $priority,
                        'callback' => $callback,
                        'args' => $implementation['accepted_args'],
//                        'reflection' => $ref,
                    );
                }
            }
            usort($table, function($a, $b){
                $a = $a['priority'];
                $b = $b['priority'];
                if ($a == $b) {
                    return 0;
                }
                return ($a < $b) ? -1 : 1;
            });
            $tag = urldecode($tag);
            $tables[$tag]=$table;
        }

        ksort($tables);

        $this->view->tables=$tables;
    }

} 