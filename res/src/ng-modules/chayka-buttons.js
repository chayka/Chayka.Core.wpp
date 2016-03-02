'use strict';

angular.module('chayka-buttons', ['chayka-utils']).provider('buttons', function () {

    var stdButtonClass = '';

    //var buttons = {
    //
    //};

    //angular.extend(this, buttons);
    var buttons = {

        /**
         * Set button class
         * @param {string} cls
         */
        setButtonClass: function setButtonClass(cls) {
            stdButtonClass = cls;
        },

        /**
         * Get button class
         * @return {string}
         */
        getButtonClass: function getButtonClass() {
            return stdButtonClass;
        },

        $get: ['utils', function (utils) {

            utils.ensure('Chayka.Buttons', buttons);

            return buttons;
        }]
    };

    return buttons;
});