'use strict';

angular.module('chayka-spinners', ['chayka-translate'])
    .directive('spinner', [function(){
        return {
            restrict: 'AE',
            scope:{
                spinner: '=',
                visible: '@',
                message: '@'
            },
            template: '<div class="chayka-spinner" data-ng-show="visible">{{message}}</div>',
            //replace: true,
            controller: function($scope){
                var ctrl = {};

                ctrl.show = function(message){
                    $scope.message = message || $scope.message || 'Loading...';
                    $scope.visible = true;
                };

                ctrl.hide = function(){
                    $scope.visible = false;
                };

                $scope.spinner = ctrl;
            }
        }
    }])
    .directive('multiSpinner', [function(){
        return {
            restrict: 'AE',
            scope:{
                spinner: '=multiSpinner'
            },
            template: '<div class="chayka-multi_spinner" data-ng-show="spinners.keys.length"><div data-ng-repeat="(id, message) in spinners"><div data-spinner data-message="message" data-visible="true"></div></div></div>',
            //replace: true,
            controller: function($scope){
                var ctrl = {};
                $scope.spinners = {};

                ctrl.show = function(message, id){
                    $scope.spinners[id] = message;
                };

                ctrl.hide = function(id){
                    delete $scope.spinners[id];
                };

                $scope.spinner = ctrl;
            }
        }
    }])
    .directive('generalSpinner', [function(){
        return {
            restrict: 'AE',
            template: '<div class="chayka-general_spinner"><div data-multi-spinner="spinner"></div></div>',
            //replace: true,
            controller: function($scope){
                $scope.spinner = null;
                var $ = angular.element;
                $(document).on('Chayka.Spinners.show', function(e, message, id){
                    if($scope.spinner){
                        $scope.spinner.show(message, id);
                    }
                });
                $(document).on('Chayka.Spinners.hide', function(e, id){
                    if($scope.spinner){
                        $scope.spinner.hide(id);
                    }
                });
            }
        }
    }])
    .factory('generalSpinner', function(){
        var $ = angular.element;
        return {
            show: function(message, id){
                $(document).trigger('Chayka.Spinners.show', [message, id]);
            },
            hide: function(message, id){
                $(document).trigger('Chayka.Spinners.hide', [id]);
            }
        }
    })
;