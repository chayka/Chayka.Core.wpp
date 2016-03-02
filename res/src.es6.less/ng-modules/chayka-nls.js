'use strict';

angular.module('chayka-nls', ['chayka-utils'])
    .provider('nls', () => {

        var currentLocale = 'en-US';

        var dictionaries = {};

        var nls = {

            /**
             * Set current locale (e.g. 'en-US')
             *
             * @param {string} locale
             */
            setLocale: (locale) => {
                currentLocale = locale;
            },

            /**
             * Get current locale
             *
             * @return {string}
             */
            getLocale: () => {
                return currentLocale;
            },

            /**
             * Set translations for specified locale
             *
             * @param {string} locale
             * @param {{}} translations
             * @return {{}}
             */
            setTranslations: (locale, translations) => {
                dictionaries[locale] = dictionaries[locale] || {};
                angular.extend(dictionaries[locale], translations);

                return dictionaries[locale];
            },

            /**
             * Returns array of registered locales
             *
             * @return {Array}
             */
            getSupportedLocales: () => {
                return Object.keys(dictionaries);
            },

            /**
             * Get translation for specified string
             *
             * @param {string} str
             * @param {string} [locale]
             */
            _: (str, locale) => {
                locale = locale || currentLocale || 'en-US';
                var dictionary = dictionaries[locale] || {};
                var defaultDictionary = dictionaries['en-US'] || {};
                return dictionary[str] || defaultDictionary[str] || str;
            },

            $get: ['utils', (utils) => {

                utils.ensure('Chayka.NLS', nls);

                return nls;
            }]

        };

        return nls;
    })
    .filter('nls', ['nls', (nls) => {
        return (str, locale) => {
            return nls._(str, locale);
        };
    }])
    .config(['nlsProvider', (nlsProvider) => {
        var locale = window.Chayka && window.Chayka.Core && window.Chayka.Core.locale || 'en-US';
        nlsProvider.setLocale(locale);
    }])
    ;