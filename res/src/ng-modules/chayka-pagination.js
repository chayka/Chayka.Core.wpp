'use strict';

angular.module('chayka-pagination', ['chayka-translate', 'chayka-utils'])
    .directive('pagination', ['utils', function(utils){

        return {
            restrict: 'AE',
            template:
            '<ul data-ng-show="totalPages > 1">' +
                '<li data-ng-repeat="item in items" class="{{item.cls}}"><a href="{{item.href}}" data-ng-click="item.click">{{item.text}}</a></li>'+
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

                $scope.click = $scope.click || function(page){
                    $scope.$emit('Pagination.currentPage', page);
                    if(page !== $scope.currentPage){
                        $scope.$emit('Pagination.pageChanged', page);
                    }
                };

                $scope.setCurrentPage = function(val){
                    $scope.currentPage = val;
                    $scope.items = $scope.getItems();
                    return $scope;
                };

                $scope.getCurrentPage = function(){
                    return $scope.currentPage;
                };

                $scope.setTotalPages = function(val){
                    $scope.totalPages = val;
                    $scope.items = $scope.getItems();
                    return $scope;
                };

                $scope.getTotalPages = function(){
                    return $scope.totalPages;
                };

                $scope.setPackSize = function(val){
                    $scope.packSize = val;
                    return $scope;
                };

                $scope.getPackSize = function(){
                    return $scope.packSize;
                };

                $scope.setHrefTemplate = function(val){
                    $scope.hrefTemplate = val;
                    return $scope;
                };

                $scope.getHrefTemplate = function(){
                    return $scope.hrefTemplate;
                };

                $scope.getHref = function(page){

                    if(page >= 1 && page <= this.getTotalPages() && this.getHrefTemplate()){
                        return utils.template(this.getHrefTemplate(), {page: page});
                    }

                    return '#';

                };

                $scope.getItem = function(page, text){

                    page = parseInt(page);
                    text = text || page;

                    var cls = '';
                    if(page === this.getCurrentPage()){
                        cls = 'active';
                    }
                    if(page < 1 || page > this.getTotalPages()){
                        cls = 'disabled';
                    }

                    return {
                        page: page,
                        text: text,
                        href: this.getHref(page),
                        cls: cls,
                        click: function() {
                            $scope.click(page);
                        }
                    };
                };

                $scope.getItems = function(){
                    var current = this.getCurrentPage();
                    var packSize = this.getPackSize();
                    var totalPages = this.getTotalPages();
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
                                //ul.append(this.renderItem(current-1, '&larr;'));
                                items.push($scope.getItem(current-1, '&larr;'));
                                break;
                            case 'first':
                                if(packStart > 1){
                                    //ul.append(this.renderItem(1));
                                    items.push($scope.getItem(1));
                                }
                                break;
                            case 'rewind':
                                if(packStart > 2){
                                    //ul.append(this.renderItem(packStart - 1, '...'));
                                    items.push($scope.getItem(packStart - 1, '...'));
                                }
                                break;
                            case 'pages':
                                for(var i = packStart; i <= packFinish; i++){
                                    //ul.append(this.renderItem(i));
                                    items.push($scope.getItem(i));
                                }
                                break;
                            case 'forward':
                                if(totalPages - packFinish >= 2){
                                    //ul.append(this.renderItem(packFinish + 1, '...'));
                                    items.push($scope.getItem(packFinish + 1, '...'));
                                }
                                break;
                            case 'last':
                                if(totalPages > packFinish){
                                    //ul.append(this.renderItem(totalPages));
                                    items.push($scope.getItem(totalPages));
                                }
                                break;
                            case 'next':
                                //ul.append(this.renderItem(current+1, '&rarr;'));
                                items.push($scope.getItem(current+1, '&rarr;'));
                                break;
                        }
                    });

                    return items;
                };

                $scope.pagination = $scope;
            }
        };
    }])
    .config(['$translateProvider', function($translateProvider) {

        // Adding a translation table for the English language
        $translateProvider.translations('en-US', {
            'next': 'Next',
            'previous': 'Previous',
            'next_page': 'Next page',
            'previous_page': 'Previous Page'
        });

        $translateProvider.translations('ru-RU', {
            'next': 'Следующая',
            'previous': 'Предыдущая',
            'next_page': 'Следующая страница',
            'previous_page': 'Предыдущая страница'
        });
    }])
;
