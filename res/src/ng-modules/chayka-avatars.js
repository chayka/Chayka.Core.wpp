'use strict';

angular.module('chayka-avatars', ['angular-md5'])
    .factory('avatars', ['md5', function(md5){
        var avatars = {
            /**
             * Get gravatar image url
             * @param email
             * @param size
             * @return {string}
             */
            gravatar: function(email, size) {
                size = size || 80;
                return '//www.gravatar.com/avatar/' + md5.createHash(email) + '?s=' + size + '&d=identicon&r=G';
            },

            /**
             * Get facebook avatar url
             * @param fbUserId
             * @param size
             * @return {string}
             */
            fbavatar: function(fbUserId, size){
                size = parseInt(size) || 80;
                return '//graph.facebook.com/'+fbUserId+'/picture/?type=square&height='+size+'&width='+size;
            }
        };

        return avatars;
    }])
;