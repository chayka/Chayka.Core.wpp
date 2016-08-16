'use strict';

angular.module('chayka-modals', ['chayka-nls', 'chayka-buttons', 'chayka-utils'])
    .provider('modals', function(){

        return {
            $get: ['$window', 'nls', 'buttons', 'utils', function($window, nls, btn, utils){

                var modals = utils.ensure('Chayka.Modals', {
                    queue: [],
                    //queue: modals.queue,

                    //setQueueScope: function($scope){
                    //    modals.scope = $scope;
                    //},

                    /**
                     * Creates config object to be pushed to a modal queue
                     *
                     * @param options
                     * @returns {modal}
                     */
                    create: function(options){
                        if (options.buttons && angular.isObject(options.buttons) && !angular.isArray(options.buttons)) {
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
                        var defaultOptions = {};
                        var m = angular.extend(defaultOptions, options);
                        //var m = angular.extend(defaultOptions, options, modal);
                        //m.prototype = modal;
                        //if (m.element) {
                        //    m.element.data('modal', m);
                        //}
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
                        var m = modals.create(options);
                        modals.queue.push(m);
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
                        modals.show({
                            content: message,
                            title: title || '',
                            modalClass: modalClass,
                            buttons: [
                                {text: nls._('Ok'), click: callback}
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
                        modals.show({
                            content: message,
                            title: title || '',
                            modalClass: 'modal_confirm',
                            //modal: false,
                            buttons: [
                                {text: nls._('Yes'), click: callback},
                                {text: nls._('No')}
                            ]
                        });
                    },

                    /**
                     * Close current modal
                     */
                    close: function($event){
                        if(!$event || $event.target === $event.currentTarget){
                            modals.queue.shift();
                        }
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
                        if (buttonClass) {
                            cls.push(buttonClass);
                        }
                        if (button && button.cls) {
                            cls.push(button.cls);
                        }
                        return cls.join(' ');
                    }
                });

                //modals = angular.extend(modals, api);

                return modals;
            }]
        };
    })
    .directive('modalsManager', ['modals', 'buttons', function(modals){
        return {
            restrict: 'AE',
            controllerAs: 'mm',
            bindToController: {},
            template: '<div id="chayka-modals" data-ng-show="mm.queue.length" class="ng-cloak chayka-modals" data-ng-cloak="">' +
            '   <div class="chayka-modals-fader" data-ng-click="mm.close($event)">' +
            '       <div data-ng-repeat="item in mm.queue | limitTo: 1" class="chayka-modals-modal">' +
            '           <div class="modal_header">' +
            '               <div class="modal_header-title">{{item.title | nls}}</div>' +
            '               <div class="modal_header-close" data-ng-click="mm.close($event)">&times;</div>' +
            '           </div>' +
            '           <div class="modal_body">' +
            '               <div class="modal_body-content" data-ng-bind-html="item.content"></div>' +
            '           </div>' +
            '           <div class="modal_buttons" data-ng-show="item.buttons && item.buttons.length">' +
            '               <button data-ng-repeat="button in item.buttons" data-ng-click="button.persist || mm.close(); button.click && button.click();" class="{{mm.getButtonClass(button)}}">{{button.text | nls}}</button>' +
            '           </div>' +
            '       </div>' +
            '   </div>' +
                //'   <div class="ng-hide" id="chayka-modals-pool"></div>' +
            '</div>',
            controller: function () {
                return {
                    close: modals.close,
                    queue: modals.queue,
                    getButtonClass: modals.getButtonClass
                };
            }
        };
    }])
    .directive('modal', ['modals', function(modals) {
        return {
            restrict: 'AE',
            transclude: true,
            controllerAs: 'm',
            // bindToController: true,
            scope: {
                modal: '=modal',
                title: '@?modalTitle',
                show: '@modalShow',
                buttons: '=?modalButtons',
                width: '@modalWidth',
                height: '@modalHeight',
                onClose: '&?onModalClose'

            },
            template: '<div class="chayka-modals ng-cloak" data-ng-show="m.isOpen">' +
            '   <div class="chayka-modals-fader" data-ng-click="m.hide($event)">' +
            '       <div class="chayka-modals-modal">' +
            '           <div class="modal_header">' +
            '               <div class="modal_header-title">{{m.title | nls}}</div>' +
            '               <div class="modal_header-close" data-ng-click="m.hide($event)">&times;</div>' +
            '           </div>' +
            '           <div class="modal_body" data-ng-transclude></div>' +
            '           <div class="modal_buttons" data-ng-show="m.buttons && m.buttons.length">' +
            '               <button data-ng-repeat="button in buttons" data-ng-click="button.persist || m.hide(); button.click && button.click();" class="{{m.getButtonClass(button)}}">{{button.text | nls}}</button>' +
            '           </div>' +
            '       </div>' +
            '   </div>' +
            '</div>',
            controller: function ($scope, $element) {
                //console.log('modal.directive');

                var ctrl = {

                    isOpen: false,
                    title: $scope.title || '',
                    buttons: $scope.buttons || [],

                    /**
                     * Show element within modal popup.
                     */
                    show: function () {
                        ctrl.isOpen = true;
                    },

                    /**
                     * Hide modal popup.
                     *
                     * @type {Function}
                     */
                    hide: function ($event) {
                        if (!$event || $event.target === $event.currentTarget) {
                            ctrl.isOpen = false;
                            if ($scope.onClose) {
                                $scope.onClose();
                            }
                        }
                    },

                    /**
                     * Set popup window.
                     *
                     * @param {string} title
                     */
                    setTitle: function (title) {
                        ctrl.title = title;
                    },

                    /**
                     * Set button set.
                     *
                     * @param {object|Array} buttons
                     */
                    setButtons: function (buttons) {
                        if (buttons && angular.isObject(buttons) && !angular.isArray(buttons)) {
                            var btns = [];
                            angular.forEach(buttons, function (button, text) {
                                button.text = text;
                                btns.push(button);
                            });
                            buttons = btns;
                        }
                        ctrl.buttons = $scope.buttons = buttons;
                    },

                    /**
                     *
                     * @param button
                     * @return {string}
                     */
                    getButtonClass: function (button) {
                        return modals.getButtonClass(button);
                    }
                };

                if ($scope.buttons) {
                    ctrl.setButtons($scope.buttons);
                }

                $scope.modal = ctrl;
                if ($scope.show) {
                    ctrl.show();
                }

                if ($scope.height) {
                    $element.css('height', $scope.height);
                }

                if ($scope.width) {
                    $element.css('width', $scope.width);
                }

                return ctrl;
            }
        };
    }])
    .config(['nlsProvider', function(nlsProvider){

        // Adding a translation table for the English language
        nlsProvider.setTranslations('en-US', {
            'Yes': 'Yes',
            'No': 'No',
            'Ok': 'Ok'
        });

        nlsProvider.setTranslations('ru-RU', {
            'Yes': 'Да',
            'No': 'Нет',
            'Ok': 'Ok'
        });
    }])
;