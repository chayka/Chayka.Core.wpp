'use strict';

angular.module('chayka-spinners', [])
    .directive('spinner', [function(){
        return {
            restrict: 'AE',
            scope:{
                spinner: '=',
                visible: '@',
                message: '='
            },
            template: '<div class="chayka-spinner" data-ng-show="visible">{{message}}</div>',
            replace: true,
            controller: function($scope){
                var ctrl = this;

                ctrl.show = function(message){
                    $scope.message = message || $scope.message || 'Loading...';
                    $scope.visible = true;
                };

                ctrl.hide = function(){
                    $scope.visible = false;
                }

                $scope.spinner = ctrl;
            }
        }
    }])
    .factory()
;