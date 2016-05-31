'use strict';

angular.module('chayka-email', ['chayka-wp-admin'])
    .directive('emailTestForm', ['ajax', function(ajax){
        return {
            controllerAs: 'ctrl',
            template: 
            '<form data-form-validator="ctrl.validator" novalidate="novalidate">' +
            '   <div class="form_field fullsize" data-form-field="to" data-check-required="Please specify email address" data-check-email="Should be a valid email">' +
            '       <label>To (email)</label><input type="text" data-ng-model="ctrl.fields.to" title="To (email)"/>' +
            '   </div>' +
            '   <div class="form_field fullsize" data-form-field="message">' +
            '       <label>Message</label><textarea data-ng-model="ctrl.fields.message" title="Message"></textarea>' +
            '   </div>' +
            '   <div class="buttons">' +
            '       <button class="button button-primary button-large" data-ng-click="ctrl.send();">Send</button>' +
            '   </div>' +
            '</form>',
            controller: function(){
                var ctrl = {
                    fields:{
                        to: '',
                        message: ''
                    },
                    
                    validator: null,
                    
                    send: function(){
                        // if(ctrl.validator.validateFields()){
                            ajax.post('/api/email/test', ctrl.fields, {
                                formValidator: ctrl.validator,
                                spinnerMessage: 'Sending email...',
                                success: function(data){
                                    //$scope.validator.showMessage(data.message);
                                }
                            });
                        // }
                    }
                };
                
                return ctrl;
            }
        };
    }])
    /**
     * @deprecated
     */
    .controller('test', ['$scope', 'ajax', function($scope, ajax){
        $scope.fields = {
            to: '',
            message: ''
        };

        $scope.validator = null;

        $scope.send = function(){
            if($scope.validator.validateFields()){
                ajax.post('/api/admin-email/test', $scope.fields, {
                    formValidator: $scope.validator,
                    spinnerMessage: 'Sending email...',
                    success: function(data){
                        //$scope.validator.showMessage(data.message);
                    }
                });
            }
        };
    }]);