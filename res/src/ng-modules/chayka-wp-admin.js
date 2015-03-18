'use strict';

angular.module('chayka-wp-admin', ['chayka-spinners', 'chayka-translate', 'chayka-utils', 'chayka-modals'])
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
            '<button class="dashicons-before dashicons-controls-play button button-small button_start" data-ng-click="start()" title="{{ \'btn_start\' | translate }}" data-ng-show="!state && buttons.indexOf(\'start\') >= 0"></button>' +
            '<button class="dashicons-before dashicons-controls-pause button button-small button_pause" data-ng-click="pause()" title="{{ \'btn_pause\' | translate }}" data-ng-show="state===\'running\' && buttons.indexOf(\'pause\') >= 0"></button>' +
            '<button class="dashicons-before dashicons-controls-repeat button button-small button_resume" data-ng-click="resume()" title="{{ \'btn_resume\' | translate }}" data-ng-show="state===\'paused\' && buttons.indexOf(\'resume\') >= 0"></button>' +
            '<button class="dashicons-before dashicons-no button button-small button_stop" data-ng-click="stop()" title="{{ \'btn_stop\' | translate }}" data-ng-show="state && buttons.indexOf(\'stop\') >= 0"></button>' +
            '<span class="field_items_per_iteration">' +
            '<label>{{ "label_per_iteration" | translate }}</label>' +
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
    .config(['$translateProvider', 'modalsProvider', function($translateProvider, modalsProvider) {

        // Adding a translation table for the English language
        $translateProvider.translations('en-US', {
            'btn_start': 'Start',
            'btn_stop': 'Stop',
            'btn_pause': 'Pause',
            'btn_resume': 'Resume',
            'label_per_iteration': 'Per iteration'
        });

        $translateProvider.translations('ru-RU', {
            'btn_start': 'Старт',
            'btn_stop': 'Стоп',
            'btn_pause': 'Пауза',
            'btn_resume': 'Возобновить',
            'label_per_iteration': 'За итерацию'
        });

        modalsProvider.setButtonClass('button');
    }])
;
