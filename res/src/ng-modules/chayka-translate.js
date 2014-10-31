'use strict';

angular.module('chayka-translate', ['pascalprecht.translate'])
    .config(['$translateProvider', function($translateProvider){
        var locale = window.Chayka && window.Chayka.Core && window.Chayka.Core.locale || 'en-US';
        $translateProvider.preferredLanguage(locale);
    }]);