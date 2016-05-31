'use strict';

angular.module('chayka-pagination', ['chayka-nls', 'chayka-utils'])
    .directive('pagination', ['utils', function(utils){

        return {
            restrict: 'AE',
            template:
            '<ul data-ng-show="totalPages > 1">' +
                '<li data-ng-repeat="item in items" class="{{item.cls}}"><a data-ng-click="item.click();" data-ng-bind-html="item.text"></a></li>'+
            '</ul>',
            scope:{
                pagination: '=',
                currentPage: '=?',
                totalPages: '=?',
                packSize: '=?',
                hrefTemplate: '@?',
                click: '=?',
                order: '@'
            },

            controller: function($scope){

                $scope.state = '';
                $scope.currentPage = $scope.currentPage || 1;
                $scope.totalPages = $scope.totalPages || 0;
                $scope.packSize = $scope.packSize || 10;
                $scope.hrefTemplate = $scope.hrefTemplate || '/page/<%= page %>';
                $scope.items = [];
                //$scope.order = $scope.order?
                //    $scope.order.split(/\s+/):
                //    ['previous', 'first', 'rewind', 'pages', 'forward', 'last', 'next'];

                if(!$scope.click){
                    $scope.click = function(page){
                        $scope.$emit('Pagination.currentPage', page);
                        if(page !== $scope.currentPage){
                            $scope.$emit('Pagination.pageChanged', page);
                        }
                    };
                }

                /**
                 * Set current page
                 *
                 * @param {int} val
                 * @param {bool} render
                 * @returns {*}
                 */
                $scope.setCurrentPage = function(val, render){
                    $scope.currentPage = val;
                    if(render){
                        $scope.render();
                    }
                    return $scope;
                };

                /**
                 * Get current page
                 *
                 * @returns {*|number}
                 */
                $scope.getCurrentPage = function(){
                    return $scope.currentPage;
                };

                /**
                 * Set total amount of pages
                 *
                 * @param val
                 * @param render
                 * @returns {*}
                 */
                $scope.setTotalPages = function(val, render){
                    $scope.totalPages = val;
                    if(render){
                        $scope.render();
                    }
                    return $scope;
                };

                /**
                 * Get total amount of pages
                 *
                 * @returns {*|number}
                 */
                $scope.getTotalPages = function(){
                    return $scope.totalPages;
                };

                /**
                 * Set number of pages between [...]
                 *
                 * @param val
                 * @param render
                 * @returns {*}
                 */
                $scope.setPackSize = function(val, render){
                    $scope.packSize = val;
                    if(render){
                        $scope.render();
                    }
                    return $scope;
                };

                /**
                 * Get number of pages between [...]
                 * @returns {*|number}
                 */
                $scope.getPackSize = function(){
                    return $scope.packSize;
                };

                /**
                 * Set href template
                 *
                 * @param val
                 * @param render
                 * @returns {*}
                 */
                $scope.setHrefTemplate = function(val, render){
                    $scope.hrefTemplate = val;
                    if(render){
                        $scope.render();
                    }
                    return $scope;
                };

                /**
                 * Get href template
                 *
                 * @returns {*|string}
                 */
                $scope.getHrefTemplate = function(){
                    return $scope.hrefTemplate;
                };

                /**
                 * Get page href
                 *
                 * @param page
                 * @returns {*}
                 */
                $scope.getHref = function(page){

                    if(page >= 1 && page <= $scope.getTotalPages() && $scope.getHrefTemplate()){
                        return utils.template($scope.getHrefTemplate(), {page: page});
                    }

                    return '#';

                };

                /**
                 * Generate page nav link item
                 *
                 * @param page
                 * @param text
                 * @returns {{page: Number, text: *, href: *, cls: string, click: Function}}
                 */
                $scope.getItem = function(page, text){

                    page = parseInt(page);
                    text = text || page;

                    var cls = '';
                    if(page === $scope.getCurrentPage()){
                        cls = 'active';
                    }
                    if(page < 1 || page > $scope.getTotalPages()){
                        cls = 'disabled';
                    }

                    return {
                        page: page,
                        text: text,
                        href: $scope.getHref(page),
                        cls: cls,
                        click: function(){
                            if(page > 0 && page <= $scope.totalPages){
                                $scope.click(page);
                            }
                            return false;
                        }
                    };
                };

                /**
                 * Generate page nav link items
                 *
                 * @returns {Array}
                 */
                $scope.getItems = function(){
                    var current = $scope.getCurrentPage();
                    var packSize = $scope.getPackSize();
                    var totalPages = $scope.getTotalPages();
                    var packStart = 1;
                    var packFinish = totalPages;
                    var items = [];

                    if(packSize < totalPages){
                        packStart = current - Math.floor((packSize -1)/ 2);
                        packFinish = current + Math.ceil((packSize -1)/ 2);
                        var offset = 0;
                        if(packStart<1){
                            offset = 1 - packStart;
                        }
                        if(packFinish>totalPages){
                            offset = totalPages - packFinish;
                        }
                        packStart+=offset;
                        packFinish+=offset;
                    }


                    /**
                     *  ['previous', 'first', 'rewind', 'pages', 'forward', 'last', 'next'];
                     */
                    $scope.order.split(/\s+/).forEach(function(item){
                        switch(item){
                            case 'previous':
                                items.push($scope.getItem(current-1, '&larr;'));
                                break;
                            case 'first':
                                if(packStart > 1){
                                    items.push($scope.getItem(1));
                                }
                                break;
                            case 'rewind':
                                if(packStart > 2){
                                    items.push($scope.getItem(packStart - 1, '...'));
                                }
                                break;
                            case 'pages':
                                for(var i = packStart; i <= packFinish; i++){
                                    items.push($scope.getItem(i));
                                }
                                break;
                            case 'forward':
                                if(totalPages - packFinish >= 2){
                                    items.push($scope.getItem(packFinish + 1, '...'));
                                }
                                break;
                            case 'last':
                                if(totalPages > packFinish){
                                    items.push($scope.getItem(totalPages));
                                }
                                break;
                            case 'next':
                                items.push($scope.getItem(current+1, '&rarr;'));
                                break;
                        }
                    });

                    return items;
                };

                /**
                 * Render pagination
                 */
                $scope.render = function(){
                    $scope.items = $scope.getItems();
                };

                $scope.pagination = $scope;
            }
        };
    }])
    .config(['nlsProvider', function(nlsProvider){

        // Adding a translation table for the English language
        nlsProvider.setTranslations('en-US', {
            'next': 'Next',
            'previous': 'Previous',
            'next_page': 'Next page',
            'previous_page': 'Previous Page'
        });

        nlsProvider.setTranslations('ru-RU', {
            'next': 'Следующая',
            'previous': 'Предыдущая',
            'next_page': 'Следующая страница',
            'previous_page': 'Предыдущая страница'
        });
    }])
;
