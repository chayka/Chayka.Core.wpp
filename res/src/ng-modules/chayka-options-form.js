'use strict';

angular.module('chayka-options-form', ['chayka-forms'])
    .controller('optionsForm', ['$scope', '$http', function($scope, $http){
        $scope.namespace = '';
        $scope.options = {
            site: {}
        };
        $scope.validator = null;

        var processResponse = function (data){
            $scope.options = data.payload;
        };

        $scope.saveOptions = function(){
            if(!$scope.validator || $scope.validator.validateFields()){
                $http.post('/api/options/set', {
                    namespace: $scope.namespace,
                    options: $scope.options
                }).success(processResponse);
            }
        };

        $scope.loadOptions = function(){
            $http.post('/api/options/get', {
                namespace: $scope.namespace,
                options: $scope.options
            }).success(processResponse);
        };
        //$scope.$digest();
        setTimeout($scope.loadOptions, 0);
        //();
    }]);