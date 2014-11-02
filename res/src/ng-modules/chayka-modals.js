'use strict';

angular.module('chayka-modals', ['chayka-translate', 'chayka-utils'])
    .controller('modalCtrl', ['$scope', 'modals', function($scope, modals){
        modals.setQueueScope($scope);
        $scope.close = modals.close;
        $scope.queue = modals.queue;
    }])
    .factory('modals', ['$window', 'utils', function($window, _){

        var modals = _.declare('Chayka.Modals', {
            queue: [],
            scope: null
        });

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
                if(this.element){
                    this.element.appendTo(document.getElementById('chayka-modals-pool'));
                }
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
                return m;
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

        modals = angular.extend(modals, api);

        return api;
    }])
    .directive('modal', ['modals', function(modals){
        return {
            restrict: 'AE',
            transclude: true,
            scope: {
                modal: '=modal',
                title: '=modalTitle',
                show: '@modalShow'
            },
            template: document.getElementById('chayka-modals-template').innerHTML,
            link: function(scope, element, attrs){
                console.log('modal.directive');
                //element.remove();
                //scope[attrs.modal] = modals.create({
                //    title: attrs.modalTitle,
                //    element: element
                //});
                var ctrl = {};

                ctrl.show = function(){
                    scope.isOpen = true;
                    if(!scope.$$phase){
                        //scope.$apply();
                    }
                };

                ctrl.hide = scope.hide = function(){
                    scope.isOpen = false;
                };

                ctrl.setTitle = function(title){
                    scope.title = title;
                };

                ctrl.setButtons = function(buttons){
                    if(buttons && angular.isObject(buttons) && !angular.isArray(buttons)){
                        var btns = [];
                        angular.forEach(buttons, function(button, text){
                            button.text = text;
                            btns.push(button);
                        });
                        buttons = btns;
                    }
                    scope.buttons = buttons;
                };

                scope.modal = ctrl;
                if(scope.show){
                    ctrl.show();
                }
            },
            controller: function($scope) {
            }
        };
    }])
;