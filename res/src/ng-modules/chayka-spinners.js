'use strict';

angular.module('chayka-spinners', ['chayka-translate', 'chayka-utils'])
    .directive('spinner', [function(){
        return {
            restrict: 'AE',
            scope:{
                spinner: '=',
                visible: '=?',
                message: '=?'
            },
            replace: true,
            template: '<div class="chayka-spinner" data-ng-show="visible" data-ng-bind-html="message"></div>',

            controller: function($scope){
                var ctrl = {};

                $scope.show = function(message){
                    $scope.message = message || $scope.message || 'Loading...';
                    $scope.visible = true;
                };

                $scope.hide = function(){
                    $scope.visible = false;
                };

                $scope.spinner = $scope;
            }
        };
    }])
    .directive('multiSpinner', [function(){
        return {
            restrict: 'AE',
            scope:{
                spinner: '=multiSpinner'
            },
            replace: true,
            template: '<div class="chayka-multi_spinner" data-ng-show="total"><div data-ng-repeat="(id, message) in messages"><div data-spinner="spinners[id]" data-message="message" data-visible="true"></div></div></div>',
            //replace: true,
            controller: function($scope){
                var ctrl = {};
                $scope.spinners = {};
                $scope.messages = {};
                $scope.total = 0;

                ctrl.show = function(message, id){
                    if(!id){
                        id = 'spinner_'+$scope.total;
                    }
                    if(!$scope.messages[id]){
                        $scope.messages[id] = message;
                        $scope.total++;
                    }
                    return id;
                };

                ctrl.hide = function(id){
                    if($scope.messages[id]){
                        $scope.total--;
                        delete $scope.messages[id];
                        $scope.spinners[id] = null;
                        //$scope.$apply();
                    }
                };

                $scope.spinner = ctrl;
            }
        };
    }])
    .directive('generalSpinner', ['utils', 'generalSpinner', function(utils){
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
                        utils.patchScope($scope);
                        //$scope.$apply();
                    }
                });
                $(document).on('Chayka.Spinners.hide', function(e, id){
                    if($scope.spinner){
                        $scope.spinner.hide(id);
                        utils.patchScope($scope);
                        //$scope.$apply();
                    }
                });
            }
        };
    }])
    .factory('generalSpinner', ['utils', function(utils){
        var $ = angular.element;

        return utils.ensure('Chayka.Spinners', {
            show: function (message, id) {
                $(document).trigger('Chayka.Spinners.show', [message, id]);
            },
            hide: function (id) {
                $(document).trigger('Chayka.Spinners.hide', [id]);
            }
        });
    }])
;