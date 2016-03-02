'use strict';

angular.module('chayka-avatars', ['chayka-utils', 'angular-md5'])
    .provider('avatars', () => {

        var Chayka = window.Chayka || {};
        Chayka.Avatars = Chayka.Avatars || {};
        var gravatarOptions = Chayka.Avatars.gravatarOptions || {};

        var avatars = {
            /**
             * Set gravatar type.
             *
             * mm - Mystery Man
             * blank - Empty transparent block
             * identicon - Identicon
             * wavatar - Wavatar
             * monsterid - MonsterID
             * retro - Retro
             *
             * @param {'mm'|'blank'|'identicon'|'wavatar'|'monsterid'|'retro'} type
             */
            setGravatarType: (type) => {
                gravatarOptions.type = type;
            },

            /**
             * Set gravatar type for empty email.
             *
             * mm - Mystery Man
             * blank - Empty transparent block
             * identicon - Identicon
             * wavatar - Wavatar
             * monsterid - MonsterID
             * retro - Retro
             *
             * @param {'mm'|'blank'|'identicon'|'wavatar'|'monsterid'|'retro'} type
             */
            setGravatarEmptyType: (type) => {
                gravatarOptions.emptyType = type;
            },

            /**
             * Set gravatar max rating
             * G - Any auditory
             * PG - 13+
             * R - 17+
             * X - 21+
             *
             * @param {'G'|'PG'|'R'|'X'} rating
             */
            setGravatarRating: (rating) => {
                gravatarOptions.rating = rating;
            },

            setGravatarForceDefault: (force) => {
                gravatarOptions.forceDefault = force;
            },

            $get: ['md5', 'utils', (md5, utils) => {
                return utils.ensure('Chayka.Avatars', {
                    /**
                     * Get gravatar image url
                     * @param {string} email
                     * @param {int} size
                     * @param {'mm'|'blank'|'identicon'|'wavatar'|'monsterid'|'retro'} [type]
                     * @param {'G'|'PG'|'R'|'X'} [rating]
                     * @param [forceDefault]
                     * @return {string}
                     */
                    gravatar: (email, size, type, rating, forceDefault) => {
                        size = size || 80;
                        var url = '//www.gravatar.com/avatar/';
                        type = type === undefined ? gravatarOptions.type : type;
                        rating = rating || gravatarOptions.rating;
                        forceDefault = forceDefault === undefined ? gravatarOptions.forceDefault : forceDefault;
                        if (email) {
                            url = url + md5.createHash(email);
                        } else {
                            type = gravatarOptions.emptyType;
                        }
                        url = url + '?s=' + size;
                        if (type) {
                            url = url + '&d=' + type;
                        }
                        if (rating) {
                            url = url + '&r=' + rating;
                        }
                        if (forceDefault) {
                            url = url + '&forcedefault=1';
                        }
                        return url;
                    },

                    /**
                     * Get facebook avatar url
                     * @param fbUserId
                     * @param size
                     * @return {string}
                     */
                    fbavatar: (fbUserId, size) => {
                        size = parseInt(size) || 80;
                        return '//graph.facebook.com/' + fbUserId + '/picture/?type=square&height=' + size + '&width=' + size;
                    }
                });
            }]
        };

        return avatars;
    })
;