'use strict';

angular.module('chayka-utils', [])
    .factory('utils', ['$window', function($window){
        var Chayka = $window.Chayka || {};
        var _ = Chayka.Utils = Chayka.Utils || {


            /**
             * Convenient way do define some object with complex names like Chayka.Auth.aaa
             *
             * @param classname
             * @param parent
             * @param implementation
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
            }

        };

        return Chayka.Utils;
    }]);