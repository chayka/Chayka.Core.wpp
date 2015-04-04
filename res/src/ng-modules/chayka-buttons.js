'use strict';

angular.module('chayka-buttons', ['chayka-utils'])
    .provider('buttons', function() {

        var stdButtonClass = '';

        /**
         * Set button class
         * @param {string} cls
         */
        this.setButtonClass = function (cls) {
            stdButtonClass = cls;
        };

        this.$get = ['utils', function (utils) {

            var buttons = utils.ensure('Chayka.Buttons', {

                setButtonClass: function(cls){
                    stdButtonClass = cls;
                },

                getButtonClass: function(){
                    return stdButtonClass;
                }
            });

            return buttons;
        }];
    })
;

