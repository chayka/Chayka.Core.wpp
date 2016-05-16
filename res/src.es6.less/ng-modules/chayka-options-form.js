'use strict';

angular.module('chayka-options-form', ['chayka-forms', 'chayka-wp-admin'])
    .directive('consolePageOptions', ['$timeout', 'ajax', ($timeout, ajax) => {
        return {
            transclude: true,
            controllerAs: 'ctrl',
            scope: {
                namespace: '@',
                options: '=consolePageOptions'
            },
            bindToController: true,
            template:
                '<div class="chayka-options_form">' +
                '   <form data-form-validator="ctrl.validator" novalidate="novalidate">' +
                '       <div class="options_form-fields" data-ng-transclude></div>' +
                '       <div class="options_form-buttons">' +
                '           <button type="button" class="button button-primary button-large" data-ng-click="ctrl.saveOptions();">Save</button>' +
                '       </div>' +
                '   </form>' +
                '</div>',
            controller: () => {
                var ctrl = {
                    /**
                     * Namespace for options to save
                     *
                     * @var {string}
                     */
                    namespace: '',

                    /**
                     * Hashmap of options to edit
                     *
                     * @var {{}}
                     */
                    options: {},

                    /**
                     * Form validator
                     *
                     * @var {{}|null}
                     */
                    validator: null,

                    /**
                     * Getter and Setter Response processor
                     *
                     * @param data
                     */
                    processResponse: (data) => {
                        angular.forEach(data.payload, (value, option) => {
                            ctrl.options[option] = value;
                        });
                    },

                    /**
                     * Save options on button click
                     */
                    saveOptions: () => {
                        if(!ctrl.validator || ctrl.validator.validateFields()){
                            ajax.post('/api/options/set', {
                                namespace: ctrl.namespace,
                                options: ctrl.options
                            },{
                                spinnerMessage: 'Saving options',
                                success: ctrl.processResponse
                            });
                        }
                    },

                    /**
                     * Load options on form start
                     */
                    loadOptions: () => {
                        ajax.post('/api/options/get', {
                            namespace: ctrl.namespace,
                            options: ctrl.options
                        },{
                            spinnerMessage: 'Loading options',
                            success: ctrl.processResponse
                        });
                    }
                };

                // $timeout(ctrl.loadOptions, 100);

                return ctrl;
            },

            compile: function(element, attributes){

                return {
                    pre: function(scope, element, attributes, controller, transcludeFn){

                    },
                    post: function(scope, element, attributes, controller, transcludeFn){
                        $timeout(controller.loadOptions, 0);
                    }
                }
            }
        };
    }])
    .controller('optionsForm', ['$scope', '$timeout', 'ajax', ($scope, $timeout, ajax) => {

        $scope.namespace = '';
        $scope.options = {
            site: {}
        };
        $scope.validator = null;

        var processResponse = (data) => {
            angular.forEach(data.payload, (value, option) => {
                $scope.options[option] = value;
            });
            //$scope.options = data.payload;
        };

        $scope.saveOptions = () => {
            if(!$scope.validator || $scope.validator.validateFields()){
                ajax.post('/api/options/set', {
                    namespace: $scope.namespace,
                    options: $scope.options
                },{
                    spinnerMessage: 'Saving options',
                    success: processResponse
                });
            }
        };

        $scope.loadOptions = () => {
            ajax.post('/api/options/get', {
                namespace: $scope.namespace,
                options: $scope.options
            },{
                spinnerMessage: 'Loading options',
                success: processResponse
            });
        };

        $timeout($scope.loadOptions, 0);

    }]);