'use strict';

angular.module('chayka-modals', [])
    .controller('modalCtrl', ['$scope', 'modals', function($scope, modals){
        modals.setQueueScope($scope);
        $scope.close = modals.close;
        $scope.queue = modals.queue;
    }])
    .factory('modals', ['$window', function($window){

        $window.Chayka = $window.Chayka || {};
        $window.Chayka.Modals = $window.Chayka.Modals || {
            queue: [],
            scope: null
        };

        var modals = $window.Chayka.Modals;

        var modal = {
            isOpen: false,
            show: function(){
                if(!this.isOpen) {
                    this.isOpen = true;
                    modals.queue.push(this);
                    if (modals.scope) {
                        modals.scope.$apply();
                    }
                }
            },
            hide: function(){
                var m = modals.queue.shift();
                m.isOpen = false;
            }
        };

        var api = {
            queue: modals.queue,

            setQueueScope: function($scope){
                modals.scope = $scope;
            },

            /**
             * Creates config object to be pushed to a modal queue
             *
             * @param options
             * @returns {modal}
             */
            create: function(options){
                if(options.buttons && angular.isObject(options.buttons) && !angular.isArray(options.buttons)){
                    var buttons = [];
                    angular.forEach(options.buttons, function(button, text){
                        button.text = text;
                        buttons.push(button);
                    });
                    options.buttons = buttons;
                }
                var defaultOptions = {
                };
                var m = angular.extend(defaultOptions, options, modal);
                //m.prototype = modal;
                if(m.element){
                    m.element.data('modal', m);
                }
                return m;
            },

            /**
             * Shows anything in a modal window.
             *
             * @param {object} options
             *  - title
             *  - content
             *  - element
             *  - width
             *  - height
             *  - buttons
             * @returns {modal}
             */
            show: function(options){
                var m = api.create(options);
                m.show();
            },

            /**
             * Shows alert box.
             *
             * @param {String} message
             * @param {String} title
             * @param {String} modalClass
             */
            alert: function(message, title, modalClass){
                modalClass = modalClass || 'modal_alert';
                api.show({
                    content: message,
                    title: title,
                    modalClass: modalClass,
                    modal: false,
                    buttons: [
                        {text: 'Ok'/*, click: function() {$(this).dialog("close");}*/}
                    ]
                });
            },

            /**
             * Shows confirm box
             * @param {type} message
             * @param {type} callback
             * @param {type} title
             * @returns {undefined}
             */
            confirm: function(message, callback, title){
                 api.show({
                    content: message,
                    title: title || 'Подтверждение',
                    modalClass: 'modal_confirm',
                    modal: false,
                    buttons: [
                        {text: 'Yes', click: callback},
                        {text: 'No'}
                    ]
                });
            },

            close: function(){
                var m = modals.queue.shift();
                m.isOpen = false;
            }
        };

        return api;
    }])
    .directive('modal', ['modals', function(modals){
        return {
            restrict: 'AE',
            //transclude: true,
            //scope: {
            //    modal: '=',
            //    modalTitle: '='
            //},
            link: function(scope, element, attrs){
                //element.remove();
                scope[attrs.modal] = modals.create({
                    title: attrs.modalTitle,
                    element: element
                });
            },
            controller: function($scope) {
            }
        };
    }])
    .directive('modalElement', ['modals', function(modals){
        return {
            restrict: 'AE',
            //transclude: true,
            scope: {
                element: '=modalElement'
            },
            link: function(scope, element, attrs){
                if(scope.element){
                    element.append(scope.element);
                    var s = angular.element(scope.element).scope();
                    if(s){
                        s.$apply();
                    }
                }
            },
            controller: function($scope) {
            }
        };
    }]);