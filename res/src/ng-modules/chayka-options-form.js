'use strict';

angular.module('chayka-options-form', ['chayka-forms', 'chayka-wp-admin']).controller('optionsForm', ['$scope', '$timeout', 'ajax', function ($scope, $timeout, ajax) {

    $scope.namespace = '';
    $scope.options = {
        site: {}
    };
    $scope.validator = null;

    var processResponse = function processResponse(data) {
        angular.forEach(data.payload, function (value, option) {
            $scope.options[option] = value;
        });
        //$scope.options = data.payload;
    };

    $scope.saveOptions = function () {
        if (!$scope.validator || $scope.validator.validateFields()) {
            ajax.post('/api/options/set', {
                namespace: $scope.namespace,
                options: $scope.options
            }, {
                spinnerMessage: 'Saving options',
                success: processResponse
            });
        }
    };

    $scope.loadOptions = function () {
        ajax.post('/api/options/get', {
            namespace: $scope.namespace,
            options: $scope.options
        }, {
            spinnerMessage: 'Loading options',
            success: processResponse
        });
    };

    $timeout($scope.loadOptions, 0);
}]);