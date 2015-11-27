'use strict';

angular.module('chayka-wp-admin', ['chayka-spinners', 'chayka-nls', 'chayka-utils', 'chayka-buttons', 'chayka-forms', 'ui.sortable'])
    .controller('metabox', ['$scope', function($scope){
        $scope.meta = {};
        $scope.validator = null;
    }])
    .controller('sidebar-widget-form', ['$scope', function($scope){
        $scope.options = {};
        $scope.validator = null;
    }])
    .factory('mediaResolver', ['ajax', function(ajax){

        var queue = {};

        var multiQueue = [];

        var cache = {};

        var bulkDelay = 100;

        var bulkTimeout = null;

        var resolver = {

            /**
             * Resolve media object by API and pass it to callback.
             * This function pushes request to the queue to perform bulk api call
             * @param {int} id
             * @param {function} callback
             * @param {int} delay
             */
            resolveById: function(id, callback, delay){
                if(cache[id]){
                    callback(cache[id]);
                    return;
                }
                if(!queue[id]){
                    queue[id] = [];
                }
                queue[id].push(callback);
                if(bulkTimeout){
                    clearTimeout(bulkTimeout);
                }
                bulkTimeout = setTimeout(resolver.bulkResolveById, delay || bulkDelay);
            },

            /**
             * Resolve media objects by API and pass it to callback.
             * This function pushes request to the queue to perform bulk api call
             * @param {array|string} ids
             * @param {function} callback
             * @param {int} delay
             */
            resolveByIds: function(ids, callback, delay){
                var idsArr;
                var unresolvedIds = [];
                var resolvedItems = [];
                if(angular.isString(ids)){
                    idsArr = [];
                    ids.split(' ').forEach(function(id){
                        idsArr.push(parseInt(id));
                    });
                }
                if(angular.isArray(ids)){
                    idsArr = ids;
                }

                for(var i=0; i < idsArr.length; i++){
                    var id = parseInt(idsArr[i]);
                    idsArr[i] = id;
                    if(cache[id]){
                        resolvedItems.push(cache[id]);
                    }else{
                        unresolvedIds.push(id);
                    }
                }

                if(!unresolvedIds.length) {
                    callback(resolvedItems);
                    return;
                }

                multiQueue.push({ids: idsArr, callback: callback});
                if(bulkTimeout){
                    clearTimeout(bulkTimeout);
                }
                bulkTimeout = setTimeout(resolver.bulkResolveById, delay || bulkDelay);
            },

            /**
             * Resolves all the enqueued media objects and fires all the needed callbacks
             */
            bulkResolveById: function(){
                var requestQueue = queue;
                queue = {};
                var requestMultiQueue = multiQueue;
                multiQueue = [];
                var ids = [];
                var requestedIds = {};
                for(var id in requestQueue){
                    if(requestQueue.hasOwnProperty(id)){
                        ids.push(id);
                        requestedIds[id]=true;
                    }
                }
                requestMultiQueue.forEach(function(itemSet){
                    for(var i=0; i < itemSet.ids.length; i++){
                        id = itemSet.ids[i];
                        if(!cache[id] && !requestedIds[id]){
                            ids.push(id);
                            requestedIds[id]=true;
                        }
                    }
                });

                ajax.post(
                    '/api/post-models/',
                    {
                        'post_type': 'attachment',
                        'post__in': ids,
                        'post_status': 'any',
                        'posts_per_page': -1
                    },
                    {
                        spinnerMessage: 'Retrieving media data',
                        errorMessage: 'Failed to retrieve media data',
                        success: function(data){
                            var items = data.payload.items;
                            items.forEach(function(item){
                                cache[item.id] = item;
                                var callbacks = requestQueue[item.id];
                                if(callbacks && callbacks.length) {
                                    for (var i = 0; i < callbacks.length; i++) {
                                        callbacks[i](item);
                                    }
                                }
                            });
                            requestMultiQueue.forEach(function(itemSet){
                                var items = [], item, id;
                                for(var i=0; i<itemSet.ids.length; i++){
                                    id = itemSet.ids[i];
                                    item = cache[id];
                                    if(item){
                                        items.push(item);
                                    }
                                }
                                itemSet.callback(items);
                            });
                        }
                    }
                );
            }
        };

        return resolver;
    }])
    .directive('mediaPicker', ['buttons', 'mediaResolver', 'nls', 'modals', function(buttons, mediaResolver, nls, modals){
        return {
            restrict: 'AE',
            scope: {
                /**
                 * Picker popup title
                 */
                title: '@?',

                /**
                 * Picker button text (both popup and inline input)
                 */
                pickerButtonText: '@?',

                /**
                 * Media type: all, images, audio, video
                 */
                type: '@?',

                /**
                 * Value (model) mode: id|url|object
                 */
                mode: '@',

                /**
                 * Scope model that is being adjusted
                 */
                model: '=',

                /**
                 * Image size: thumbnail, medium, large, full.
                 * 'medium' by default, but downgraded to 'thumbnail' for non-image attachments
                 */
                size: '@',

                /**
                 * Is media picker able to select multiple items
                 */
                multiple: '@?',

                /**
                 * In case of multiple mode defines width of media item,
                 * If not defined uses item-height or 100px
                 */
                itemWidth: '@?',

                /**
                 * In case of multiple mode defines height of media item,
                 * If not defined uses item-width or 100px
                 */
                itemHeight: '@?',

                /**
                 * Item background mode:
                 * - contain
                 * - cover
                 */
                itemMode: '@?'
            },
            transclude: true,
            template:
                '<div class="chayka-media_picker" data-ng-class="{\'image-set\': hasImages(), multiple: multiple}">' +
                '<img data-ng-src="{{mediaSrc}}" data-ng-show="!!mediaSrc" data-ng-click="pickMedia();"/>' +
                '<div class="media_items sortable-row" data-ng-show="mediaItems && mediaItems.length" data-ng-model="mediaItems" data-as-sortable="dragControl" >' +
                '<div class="media_item" data-ng-class="{contain: itemMode === \'contain\', cover: itemMode === \'cover\'}" data-ng-repeat="item in mediaItems" data-as-sortable-item style="background-image: {{\'url(\'+item.url+\')\'}}; width: {{itemWidth || itemHeight || \'100px\'}}; height: {{itemHeight || itemWidth || \'100px\'}};">' +
                '<div class="sortable-handle" data-as-sortable-item-handle>' +
                '<button class="btn_remove" data-ng-click="removeMediaItem($event, item)" data-no-drag ><span>&times;</span></button>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="no_image" data-ng-click="pickMedia();" data-ng-show="!hasImages()">' +
                '   <div data-spinner="spinner"></div>' +
                '</div>' +
                '<div class="note" data-ng-transclude></div>' +
                '<div class="buttons">' +
                '   <button class="{{buttonClass}} btn_clear" data-ng-click="clearMedia($event);" data-ng-show="!!hasImages()" >{{ "Clear" | nls}}</button>' +
                '   <button class="{{buttonClass}} btn_pick" data-ng-click="pickMedia($event);">{{ pickerButtonText || "Browse" | nls}}</button>' +
                '</div>' +
                '</div>',
            controller: function($scope, $element){
                $scope.buttonClass = buttons.getButtonClass();
                $scope.mediaSrc = null;
                $scope.mediaItems = [];
                $scope.mode = $scope.mode || 'id';
                $scope.size = $scope.size || 'medium';
                $scope.spinner = null;

                var frame = null;
                var wp = window.wp;
                //var media = null;


                /**
                 * Watch madel, request items by ids and render them
                 */
                $scope.$watch('model', function(model){
                    if($scope.multiple){
                        switch ($scope.mode){
                            case 'id':
                                $scope.mediaSrc = '';
                                $scope.mediaItems = [];
                                if(model){
                                    if($scope.spinner){
                                        $scope.spinner.show(nls._('Retrieving media data...'));
                                    }
                                    mediaResolver.resolveByIds(model, function(items){
                                        if($scope.spinner){
                                            $scope.spinner.hide();
                                        }
                                        items.forEach(function(item){
                                            $scope.mediaItems.push({
                                                id: item.id,
                                                url:(item.image[$scope.size] || item.image.thumbnail).url
                                            });
                                        });
                                    });
                                }
                                break;
                            case 'url':
                                model.split(' ').forEach(function(url){
                                    $scope.mediaItems.push({
                                        id: 0,
                                        url: url
                                    });
                                });

                                break;
                        }

                    }else{
                        switch ($scope.mode){
                            case 'id':
                                $scope.mediaSrc = '';
                                $scope.mediaItems = [];
                                model = parseInt(model);
                                if(model){
                                    if($scope.spinner){
                                        $scope.spinner.show(nls._('Retrieving media data...'));
                                    }
                                    mediaResolver.resolveById(model, function(item){
                                        if($scope.spinner){
                                            $scope.spinner.hide();
                                        }
                                        //media = item;
                                        $scope.mediaSrc = (item.image[$scope.size] || item.image.thumbnail).url;
                                    });
                                }
                                break;
                            case 'url':
                                $scope.mediaSrc = model;
                                break;
                        }

                    }
                });

                /**
                 * ng-sortable options
                 *
                 * @type {{orderChanged: Function, scrollableContainer: *}}
                 */
                $scope.dragControl = {
                    //accept: function (sourceItemHandleScope, destSortableScope) {return true;},//override to determine drag is allowed or not. default is true.
                    //itemMoved: function (event) {},
                    orderChanged: function(event) {
                        $scope.updateMultiModel($scope.mediaItems);
                    },
                    //containerPositioning: 'absolute'
                    scrollableContainer: $element.attr('id')//optional param.
                };

                /**
                 * Check if images are stt
                 * @return {boolean}
                 */
                $scope.hasImages = function(){
                    return !!$scope.mediaItems && !!$scope.mediaItems.length || !!$scope.mediaSrc;
                };

                /**
                 * Remover media item in multiple mode
                 * @param $event
                 * @param {{id: int, url: string}} item
                 */
                $scope.removeMediaItem = function($event, item){
                    $event.preventDefault();
                    modals.confirm(nls._('Delete this item?'), function(){
                        var value = '';
                        switch ($scope.mode){
                            case 'id':
                                value = item.id;
                                break;
                            case 'url':
                                value = item.url;
                                break;
                        }
                        var re = new RegExp('\\b'+value+'\\b\\s?');
                        $scope.model = $scope.model.replace(re, '').trim();
                    });
                };

                /**
                 * Update model in multiple mode
                 *
                 * @param items
                 */
                $scope.updateMultiModel = function(items){
                    var values = [];
                    items.forEach(function(item){
                        switch ($scope.mode){
                            case 'id':
                                values.push(item.id);
                                break;
                            case 'url':
                                values.push(item.url);
                                break;
                        }
                    });
                    $scope.model = values.join(' ');
                };

                /**
                 * Pick media
                 * @param $event
                 */
                $scope.pickMedia = function($event){
                    if($event && $event.preventDefault) {
                        $event.preventDefault();
                    }
                    if(frame){
                        frame.$el.remove();
                    }
                    if(true || !frame){
                        frame = wp.media({
                            title: nls._($scope.title || 'Select or Upload Media'),
                            button: {
                                text: nls._($scope.pickerButtonText || 'Use this media')
                            },
                            multiple: $scope.multiple  // Set to true to allow multiple files to be selected
                        });

                        frame.on('open', function(){
                            if($scope.mode === 'id'){
                                var selection = frame.state().get('selection');
                                if ($scope.model) {
                                    if($scope.multiple){
                                        $scope.model.split(' ').forEach(function(id){
                                            selection.add(wp.media.attachment(id));
                                        });
                                    }else{
                                        selection.add(wp.media.attachment($scope.model));
                                    }
                                }
                            }
                        });

                        // When an image is selected in the media frame...
                        frame.on( 'select', function() {
                            // Get media attachment details from the frame state
                            if($scope.multiple){
                                var attachments = frame.state().get('selection').toJSON();
                                $scope.updateMultiModel(attachments);

                            }else{
                                var attachment = frame.state().get('selection').first().toJSON();

                                switch ($scope.mode){
                                    case 'id':
                                        $scope.model = attachment.id;
                                        break;
                                    case 'url':
                                        $scope.model = attachment.url;
                                        break;
                                }
                            }
                            $scope.$apply();

                        });

                        // Finally, open the modal on click
                        frame.open();
                        frame.$el.show();

                    }
                };

                /**
                 * Reset state to no media selected
                 *
                 * @param $event
                 */
                $scope.clearMedia = function($event){
                    $event.preventDefault();
                    if($scope.multiple && $scope.mediaItems.length > 3){
                        modals.confirm(nls._('Remove media items?'), function(){
                            $scope.model = '';
                        });
                    }else{
                        $scope.model = '';
                    }
                };
            }
        };
    }])
    .directive('colorPicker', ['utils', function(utils){
        return {
            restrict: 'AE',
            scope:{
                defaultColor: '@?',
                palettes: '=?'
            },
            link: function($scope, element, attrs){
                var $ = angular.element,
                    $element = $(element);

                var onPickerColorChange = function(event, change){
                    setTimeout(function(){
                        $scope.$parent.$apply(attrs.ngModel+'="'+(change && change.color.toString() || '')+'";');
                    }, 0);
                };
                if($.fn.wpColorPicker){
                    $element.attr('type', 'hidden');
                    var $input = $('<input type="text">')
                        .insertAfter(element)
                        .val($element.val())
                        .wpColorPicker({
                            defaultColor: $scope.defaultColor,
                            hide: true,
                            palettes: $scope.palettes,
                            change: onPickerColorChange,
                            clear: onPickerColorChange
                        });
                    $scope.$parent.$watch(attrs.ngModel, function(value){
                        if(value!==$input.val()){
                            $input.wpColorPicker('color', value);
                        }
                    });
                    var $inputDiv = $element.parent(),
                        $pickerContainer = $inputDiv.find('.wp-picker-container'),
                        $pickerColorButton = $pickerContainer.find('.wp-color-result'),
                        $pickerInputWrap = $pickerContainer.find('.wp-picker-input-wrap'),
                        $pickerHolder = $pickerContainer.find('.wp-picker-holder');
                    $pickerContainer.off('keyup', '*');
                    $input.off('keyup').on( 'keyup', function( event ) {
                        if ( event.keyCode === 13 || event.keyCode === 32 ) {
                            event.preventDefault();
                            event.stopPropagation();
                            //$pickerColorButton.trigger( 'click' );//.next().focus();
                            $input.wpColorPicker('close');
                        }
                    });

                    //$pickerColorButton.appendTo($inputDiv);

                }
            }
        };
    }])
    .directive('jobControl', [function(){
        return {
            restrict: 'AE',
            scope:{
                jobControl: '=',
                jobId: '=?',
                perIteration: '=?',
                buttons: '@?'
            },
            template:
            '<div class="chayka-job_control {{state}}">' +
            '<div class="progressbar">' +
            '<div class="progress_label">{{ total ? processed + " / " + total + " (" + Math.floor(processed / total * 100) + "%)" : "0%" }}</div>' +
            '</div>' +
            '<div class="box_controls">' +
            '<button class="dashicons-before dashicons-controls-play button button-small button_start" data-ng-click="start()" title="{{ \'btn_start\' | nls }}" data-ng-show="!state && buttons.indexOf(\'start\') >= 0"></button>' +
            '<button class="dashicons-before dashicons-controls-pause button button-small button_pause" data-ng-click="pause()" title="{{ \'btn_pause\' | nls }}" data-ng-show="state===\'running\' && buttons.indexOf(\'pause\') >= 0"></button>' +
            '<button class="dashicons-before dashicons-controls-repeat button button-small button_resume" data-ng-click="resume()" title="{{ \'btn_resume\' | nls }}" data-ng-show="state===\'paused\' && buttons.indexOf(\'resume\') >= 0"></button>' +
            '<button class="dashicons-before dashicons-no button button-small button_stop" data-ng-click="stop()" title="{{ \'btn_stop\' | nls }}" data-ng-show="state && buttons.indexOf(\'stop\') >= 0"></button>' +
            '<span class="field_items_per_iteration">' +
            '<label>{{ "label_per_iteration" | nls }}</label>' +
            '<input type="number" data-ng-model="perIteration"/>' +
            '</span>' +
            '</div>' +
            '<div data-spinner="spinner"></div>' +
            '<div class="box_output">' +
            '<div data-ng-repeat="message in log track by $index" class="message">{{message}}</div>' +
            '</div>' +
            '</div>',

            controller: function($scope){

                $scope.state = '';
                $scope.perIteration = $scope.perIteration || 10;
                $scope.total = $scope.total || 100;
                $scope.processed = 0;
                $scope.log = [];
                $scope.buttons = $scope.buttons?
                    $scope.buttons.split(' '):
                    ['start', 'pause', 'resume', 'stop'];

                $scope.setJobId = function(val){
                    $scope.jobId = val;
                    return $scope;
                };

                $scope.getJobId = function(){
                    return $scope.jobId;
                };

                $scope.setPerIteration = function(val){
                    $scope.perIteration = val;
                    return $scope;
                };

                $scope.getPerIteration = function(){
                    return $scope.perIteration;
                };

                $scope.setTotal = function(val){
                    $scope.total = val;
                    return $scope;
                };

                $scope.getTotal = function(){
                    return $scope.total;
                };

                $scope.setProcessed = function(val){
                    $scope.processed = val;
                    return $scope;
                };

                $scope.getProcessed = function(){
                    return $scope.processed;
                };

                $scope.isFinished = function(){
                    return this.getTotal() === this.getProcessed();
                };

                $scope.setProgress = function(processed, total){
                    this.setProcessed(processed);
                    this.setTotal(total || this.getTotal() || 100);
                    if(this.isFinished()){
                        this.setState('finished');
                    }
                    return $scope;
                };

                $scope.setState = function(val){
                    $scope.state = val;
                    return $scope;
                };

                $scope.getState = function(){
                    return $scope.state;
                };

                $scope.addLogMessage = function(message){
                    $scope.log.push(message);
                };

                $scope.clearLog = function(){
                    $scope.log = [];
                };

                $scope.start = function(){
                    $scope.$emit('JobControl.start', $scope.jobId);
                };

                $scope.started = function(){
                    this.setState('running');
                };

                $scope.pause = function(){
                    $scope.$emit('JobControl.pause', $scope.jobId);
                };

                $scope.paused = function(){
                    this.setState('paused');
                };

                $scope.resume = function(){
                    $scope.$emit('JobControl.resume', $scope.jobId);
                };

                $scope.resumed = function(){
                    this.setState('running');
                };

                $scope.stop = function(){
                    $scope.$emit('JobControl.stop', $scope.jobId);
                };

                $scope.stopped = function(){
                    this.setState('');
                };

                $scope.jobControl = $scope;
            }
        };
    }])
    .config(['nlsProvider', 'buttonsProvider', function(nlsProvider, buttonsProvider) {

        // Adding a translation table for the English language
        nlsProvider.setTranslations('en-US', {
            'btn_start': 'Start',
            'btn_stop': 'Stop',
            'btn_pause': 'Pause',
            'btn_resume': 'Resume',
            'label_per_iteration': 'Per iteration'
        });

        nlsProvider.setTranslations('ru-RU', {
            'btn_start': 'Старт',
            'btn_stop': 'Стоп',
            'btn_pause': 'Пауза',
            'btn_resume': 'Возобновить',
            'label_per_iteration': 'За итерацию'
        });

        buttonsProvider.setButtonClass('button');
    }])
;
