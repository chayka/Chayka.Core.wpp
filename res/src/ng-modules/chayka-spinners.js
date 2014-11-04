'use strict';

angular.module('chayka-spinners', ['chayka-translate', 'chayka-utils'])
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
                        $scope.$apply();
                    }
                };

                $scope.spinner = ctrl;
            }
        }
    }])
    .directive('generalSpinner', ['generalSpinner', function(){
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
                        $scope.$apply();
                    }
                });
                $(document).on('Chayka.Spinners.hide', function(e, id){
                    if($scope.spinner){
                        $scope.spinner.hide(id);
                        $scope.$apply();
                    }
                });
            }
        }
    }])
    .factory('generalSpinner', ['utils', function(_){
        var $ = angular.element;

        return _.ensure('Chayka.Spinners', {
            show: function (message, id) {
                $(document).trigger('Chayka.Spinners.show', [message, id]);
            },
            hide: function (id) {
                $(document).trigger('Chayka.Spinners.hide', [id]);
            }
        });
    }])
;