'use strict';

angular.module('chayka-modals', ['chayka-translate', 'chayka-buttons', 'chayka-utils'])
    .controller('modalCtrl', ['$scope', 'modals', 'buttons', function($scope, modals){
        modals.setQueueScope($scope);
        $scope.close = modals.close;
        $scope.queue = modals.queue;
        $scope.getButtonClass = function(button){
            return modals.getButtonClass(button);
        };
    }])
    //.factory('modals', ['$window', '$translate', 'utils', function($window, $translate, utils){
    .provider('modals', function(){

        this.$get = ['$window', '$translate', 'buttons', 'utils', function($window, $translate, btn, utils){

            var modals = utils.ensure('Chayka.Modals', {
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
                            utils.patchScope(modals.scope);
                            //modals.scope.$apply();
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
                //queue: modals.queue,

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
                        /**
                         * @var {{
                         *  text: string,
                         *  click: function,
                         *  persist: boolean,
                         *  cls: string
                         * }} button
                         */
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
                 * @returns {object}
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
                 * @param {String} [title]
                 * @param {String} [modalClass]
                 * @param {Function} [callback]
                 */
                alert: function(message, title, modalClass, callback){
                    modalClass = modalClass || 'modal_alert';
                    api.show({
                        content: message,
                        title: title || '',
                        modalClass: modalClass,
                        buttons: [
                            {text: $translate.instant('Ok'), click: callback}
                        ]
                    });
                },

                /**
                 * Shows confirm box
                 * @param {string} message
                 * @param {Function} callback
                 * @param {string} [title]
                 * @returns {undefined}
                 */
                confirm: function(message, callback, title){
                    api.show({
                        content: message,
                        title: title || '',
                        modalClass: 'modal_confirm',
                        //modal: false,
                        buttons: [
                            {text: $translate.instant('Yes'), click: callback},
                            {text: $translate.instant('No')}
                        ]
                    });
                },

                /**
                 * Close current modal
                 */
                close: function(){
                    var m = modals.queue.shift();
                    m.isOpen = false;
                },

                /**
                 * Get button class
                 * @param {{text: string, click: function, cls: string}} button
                 *
                 * @return {string}
                 */
                getButtonClass: function(button){
                    //return buttonClass;
                    var cls = [];
                    var buttonClass = btn.getButtonClass();
                    if(buttonClass){
                        cls.push(buttonClass);
                    }
                    if(button && button.cls){
                        cls.push(button.cls);
                    }
                    return cls.join(' ');
                }
            };

            modals = angular.extend(modals, api);

            return modals;
        }];
    })
    .directive('modal', ['modals', function(modals){
        return {
            restrict: 'AE',
            transclude: true,
            scope: {
                modal: '=modal',
                title: '@?modalTitle',
                show: '@modalShow',
                buttons: '=?modalButtons'

            },
            template: document.getElementById('chayka-modals-template').innerHTML,
            link: function(scope){
                //console.log('modal.directive');

                var ctrl = {};

                /**
                 * Show element within modal popup.
                 */
                ctrl.show = function(){
                    scope.isOpen = true;
                };

                /**
                 * Hide modal popup.
                 *
                 * @type {Function}
                 */
                ctrl.hide = scope.hide = function(){
                    scope.isOpen = false;
                };

                /**
                 * Set popup window.
                 *
                 * @param {string} title
                 */
                ctrl.setTitle = function(title){
                    scope.title = title;
                };

                /**
                 * Set button set.
                 *
                 * @param {object|Array} buttons
                 */
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

                /**
                 *
                 * @param button
                 * @return {string}
                 */
                scope.getButtonClass = function(button){
                    return modals.getButtonClass(button);
                };

                if(scope.buttons){
                    ctrl.setButtons(scope.buttons);
                }

                scope.modal = ctrl;
                if(scope.show){
                    ctrl.show();
                }
            },
            controller: function($scope) {
            }
        };
    }])
    .config(['$translateProvider', function($translateProvider) {

        // Adding a translation table for the English language
        $translateProvider.translations('en-US', {
            'Yes': 'Yes',
            'No': 'No',
            'Ok': 'Ok'
        });

        $translateProvider.translations('ru-RU', {
            'Yes': 'Да',
            'No': 'Нет',
            'Ok': 'Ok'
        });
    }])
;