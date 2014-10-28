
angular.module('chayka-modals', [])
    .controller('modalCtrl', ['$scope', 'modals', function($scope, modals){
        $scope.queue = modals.queue;
        console.log('Huuaa');

        modals.setQueueScope($scope);

    }])
    .factory('modals', ['$window', function($window){

        var total = 0;


        $window.Chayka = $window.Chayka || {};
        $window.Chayka.Modals = $window.Chayka.Modals || {
            queue: [],
            scope: null
        };

        var modals = $window.Chayka.Modals;

        var modal = {
            show: function(){
                modals.queue.push(this);
                if(modals.scope){
                    modals.scope.$apply();
                }
            },
            hide: function(){
                modals.queue.shift();
            }
        };

        var api = {
            queue: modals.queue,

            setQueueScope: function($scope){
                modals.scope = $scope;
            },
            /**
             * Shows $el in a modal window.
             * Ensures $el with modal $.brx.Modals.Window.
             * Calls $.brx.Modals.create($el, options) and shows modal via queue
             * processing.
             *
             * @param {$(DOMnode)} $el
             * @param {object} options
             *  - title
             *  - content
             *  - element
             *  - width
             *  - height
             *  - buttons
             * @returns {$.brx.Modals.Window}
             */
            create: function(options){
                //var view = $.brx.Modals.create($el, options);
                //
                //view.open();
                //return view;
                if(options.buttons && angular.isObject(options.buttons) && !angular.isArray(options.buttons)){
                    var buttons = [];
                    angular.forEach(options.buttons, function(button, text){
                        button.text = text;
                        buttons.push(button);
                    });
                    options.buttons = buttons;
                }
                var defaultOptions = {
                    //width: '50%',
                    //id: 'modal' + (total++),
                    //preserve: !!options.element
                };
                var m = angular.extend(defaultOptions, options, modal);
                //m.prototype = modal;
                if(m.element){
                    m.element.data('modal', m);
                }
                return m;
            },

            show: function(options){
                var m = api.create(options);
                console.dir({'m': m});
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
            }
        };

        return api;
    }])
    .directive('modal', ['modals', function(modals){
        return {
            restrict: 'AE',
            //transclude: true,
            scope: {
                modal: '=',
                modalTitle: '='
            },
            link: function(scope, element, attrs){
                scope.dialog = modals.create({
                    title: scope.modalTitle,
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
                element: '=modalElement',
            },
            link: function(scope, element, attrs){
                if(scope.element){
                    element.append(scope.element);
                }
            },
            controller: function($scope) {
            }
        };
    }]);