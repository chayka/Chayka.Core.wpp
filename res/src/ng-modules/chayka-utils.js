'use strict';

angular.module('chayka-utils', [])
    .factory('utils', ['$window', '$timeout', function($window, $timeout){
        var Chayka = $window.Chayka || {};

        var _ = Chayka.Utils = Chayka.Utils || {


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
                    $timeout(function(){scope.$apply()}, 0);
                }

            }
        };

        return Chayka.Utils;
    }]);