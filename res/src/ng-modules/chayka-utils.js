'use strict';

angular.module('chayka-utils', [])
    .factory('utils', ['$window', '$timeout', '$compile', function($window, $timeout, $compile){
        var Chayka = $window.Chayka || {};

        Chayka.Utils = Chayka.Utils ||
        {


            /**
             * Convenient way do define some object with complex names like Chayka.Auth.aaa
             *
             * @param {String} classname
             * @param {Object} parent
             * @param {Object} implementation
             * @returns {*}
             */
            declare: function(classname, parent, implementation){
                var parts = classname.split('.');
                var root = $window;
                var part = '';
                for(var i = 0; i < parts.length; i++){
                    part = parts[i];
                    if(i === parts.length - 1){
                        break;
                    }
                    root[part] = root[part] || {};
                    root = root[part];
                }

                if(angular.isUndefined(implementation)){
                    implementation = parent;
                    parent = null;
                }

                if(parent){
                    if(parent.extend && angular.isFunction(parent.extend)){
                        root[part] = parent.extend(implementation);
                    }else{
                        root[part] = angular.extend(parent, implementation);
                    }
                }else{
                    root[part] = implementation;
                }

                return root[part];
            },

            /**
             * Ensure that object exists, extends it if needed and returns reference to it.
             *
             * @param {String} classname
             * @param {Object} extend
             * @returns {*}
             */
            ensure: function(classname, extend){
                var parts = classname.split('.');
                var root = $window;
                var part = '';
                for(var i = 0; i < parts.length; i++){
                    part = parts[i];
                    root[part] = root[part] || {};
                    root = root[part];
                }
                if(extend && angular.isObject(extend)){
                    angular.extend(root, extend);
                }

                return root;
            },

            /**
             * Some little helper to get default values,
             * Key can be complex like Chayka.Auth.aaa
             *
             * @param obj
             * @param key
             * @param defaultValue
             * @returns {*}
             */
            getItem: function(obj, key, defaultValue){
                if(defaultValue === undefined){
                    defaultValue = null;
                }
                var parts = (key+'').split('.');
                if(obj && (angular.isObject(obj) || angular.isArray(obj))){
                    var root = obj;
                    for(var i = 0; i < parts.length; i++){
                        var part = parts[i];
                        if((angular.isObject(root) || angular.isArray(root)) && root[part]!==undefined){
                            root = root[part];
                        }else{
                            return defaultValue;
                        }
                    }
                    return root;
                }

                return defaultValue;
            },

            /**
             * Set default values if object members not set
             *
             * @param {{}} obj
             * @param {{}} defaults
             */
            setObjectDefaults: function(obj, defaults){
                obj = obj || {};
                for(var key in defaults){
                    if(defaults.hasOwnProperty(key)){
                        if(typeof defaults[key] === 'object'){
                            obj[key] = Chayka.Utils.setObjectDefaults(obj[key] || {}, defaults[key]);
                        }else if(obj[key] === undefined){
                            obj[key] = defaults[key];
                        }
                    }
                }

                return obj;
            },

            /**
             * Remove all existing object members and set new ones from update.
             * Returns updated object
             *
             * @param {{}} obj
             * @param {{}} update
             * @return {{}}
             */
            updateObject: function(obj, update){
                for(var property in obj){
                    if(obj.hasOwnProperty(property)){
                        if(update[property] !== undefined){
                            obj[property] = null;
                        }else{
                            delete obj[property];
                        }
                    }
                }

                return angular.extend(obj, update);
            },

            /**
             * Get param from html tag
             *
             * @param {jQuery} $element
             * @param {string} name
             * @param {*} defaultValue
             * @return {*}
             */
            getHtmlParam: function($element, name, defaultValue){
                var value = $element.attr(name) || $element.attr('data-'+name) || $element.data(name);
                if(value === undefined){
                    value = defaultValue;
                }
                return value;
            },

            /**
             * Simple template function, replaces '{var}' with var value.
             *
             * @param {string} tpl
             * @param {obj} params
             * @returns {string}
             */
            template: function(tpl, params){
                return tpl.replace(/{([^}]+)}/g, function(all, param){
                    return params[param].toString() || '';
                });
            },

            /**
             * Bullet proof scope.$apply() caller
             * @param scope
             */
            patchScope: function(scope){
                if(scope && angular.isFunction(scope.$apply)){
                    $timeout(function(){scope.$apply();}, 0);
                }

            },

            /**
             * Get resource url from specified chayka application (plugin or theme)
             *
             * @param appId
             * @param resPath
             * @return {*}
             */
            getResourceUrl: function(appId, resPath){
                return Chayka.Utils.getItem(Chayka.Core.appResFolderUrls, appId, '/no_app_url_found/') + resPath;
            },


            /**
             * Manually compiles the element, fixing the recursion loop.
             * @see http://stackoverflow.com/questions/14430655/recursion-in-angular-directives
             *
             * @param element
             * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
             * @returns An object containing the linking functions.
             */
            recursiveDirectiveCompile: function(element, link){
                // Normalize the link parameter
                if(angular.isFunction(link)){
                    link = { post: link };
                }

                // Break the recursion loop by removing the contents
                var contents = element.contents().remove();
                var compiledContents;
                return {
                    pre: (link && link.pre) ? link.pre : null,
                    /**
                     * Compiles and re-adds the contents
                     */
                    post: function(scope, element){
                        // Compile the contents
                        if(!compiledContents){
                            compiledContents = $compile(contents);
                        }
                        // Re-add the compiled contents to the element
                        compiledContents(scope, function(clone){
                            element.append(clone);
                        });

                        // Call the post-linking function, if any
                        if(link && link.post){
                            link.post.apply(null, arguments);
                        }
                    }
                };
            },

            /**
             * Return ordinal suffix of an integer
             * @param {int} input
             * @return {string}
             */
            ordinal: function(input){
                var n = input % 100;
                return (n < 11 || n > 13) ?
                        ['st', 'nd', 'rd', 'th'][Math.min((n - 1) % 10, 3)] :
                        'th';
            }

        };

        Chayka.Utils.ensure('Chayka.Utils', Chayka.Utils);

        return Chayka.Utils;
    }])
    /**
     * Angular directive that includes a template from WP plugin or theme.
     * You don't have to know plugin server path but it's ID instead
     * Works like that:
     *      <div wp-include="Chayka.Core:ng/template.html"></div>
     *      <div wp-include="ng/template.html" wp-app="Chayka.Core"></div>
     *      <wp-include="Chayka.Core:ng/template.html"></wp-include>
     *      <wp-include="ng/template.html" app-id="Chayka.Core"></wp-include>
     */
    .directive('wpInclude', ['utils', function(utils){
        return {
            restrict: 'AE',
            templateUrl: function(element, attributes){
                var include = attributes['wpInclude'] ||
                    attributes['wp-include'] ||
                    attributes['data-wp-include'] ||
                    attributes['src'];
                var src = include,
                    params = include.split(':');
                var appId = attributes['wpApp'] ||
                    attributes['wp-app'] ||
                    attributes['data-wp-app'] ||
                    attributes['app-id'];
                if(params.length > 1){
                    appId = params[0];
                    src = params[1];
                }
                return utils.getResourceUrl(appId, src);
            }
        };
    }])
    .filter('ordinal', ['utils', function(utils){
        return function(input){
            return input + utils.ordinal(input);
        };
    }])
;