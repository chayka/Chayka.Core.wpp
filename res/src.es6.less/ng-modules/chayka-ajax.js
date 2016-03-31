'use strict';

angular.module('chayka-ajax', ['chayka-modals', 'chayka-spinners'])
    .factory('ajax', ['$window', '$http', '$timeout', 'modals', 'generalSpinner', 'utils', ($window, $http, $timeout, modals, generalSpinner, utils) => {
        var $ = angular.element;
        var Chayka = $window.Chayka || {};
        var ajax = Chayka.Ajax = Chayka.Ajax || {

            /**
             * Registered error handlers for different error codes
             */
            errorHandlers: {},

            /**
             * Add error handler for errorCode.
             * Handler may accept following params (code, message, payload),
             * and should return true if error should not be processed with other handlers,
             * false otherwise.
             *
             * @param {string} id   unique handler id
             * @param {function} handler    error handler
             * @param {string} errorCode    error code to process using handler
             */
            addErrorHandler: (id, handler, errorCode) => {
                errorCode = errorCode || null;
                ajax.errorHandlers[id] = {
                    'code': errorCode,
                    'handler': handler
                };
            },

            /**
             * Remove error handler for specified id
             * @param id
             */
            removeErrorHandler: (id) => {
                ajax.errorHandlers[id] = null;
            },

            /**
             * Handle error with all the registered error handlers
             * Returns true if error was processed and should be removed from the stack
             *
             * @param code
             * @param message
             * @param payload
             * @returns {boolean}
             */
            handleError: (code, message, payload) => {
                var res = false;
                for(var id in ajax.errorHandlers){
                    var reg = ajax.errorHandlers[id];
                    if(reg && (!reg.code || reg.code === code)){
                        res = res || reg.handler(code, message, payload);
                        if(res){
                            break;
                        }
                    }
                }

                return res;
            },

            /**
             * Handle all the errors found in response including mass_errors
             *
             * @param data
             * @returns {*}
             */
            handleErrors: (data) => {
                if(!data){
                    return {'empty_response': 'Empty response'};
                }
                if('mass_errors' === data.code){
                    for(var code in data.message){
                        if(ajax.handleError(code, data.message[code], data.payload)){
                            delete data.message[code];
                        }
                    }
                    return data.message;
                }

                var errors = {};
                if(!ajax.handleError(data.code, data.message, data.payload)){
                    errors[data.code] = data.message;
                }
                return errors;
            },

            /**
             * Parse json in case some empty or html response
             *
             * @param response
             * @param defaultMessage
             * @returns {*}
             */
            processResponse: (response, defaultMessage) => {
                var message = defaultMessage || false;
                var code = 1;
                if(!angular.isUndefined(response.payload)){
                    return response;
                }else if(!response || angular.isString(response) && !response.length){
                    message = 'Empty response';
                }else if(angular.isString(response)){
                    var m = response.match(/<body[^>]*>([\s\S]*)<\/body>/m);
                    m = m?m:response.match(/<br\s*\/>\s*<b>[^<]+<\/b>\:\s*(.*)<br\s*\/>/m);
                    message = m?m[1].trim():defaultMessage;
                }
                return {code: code, message: message, payload: null};
            },

            spinnersUsed: 0,

            /**
             * Prepares all the handlers to show all the spinners and errors
             *
             * @param options
             * - spinner: reference to Chayka.Spinners.spinner or false if no spinners needed
             * - spinnerId: id for generalSpinner
             * - spinnerFieldId: field id for showing spinner in the form field (uses formValidator)
             * - spinnerMessage: message to show with spinner
             * - errorMessage: default error message to show in case of error. Pass 'false' to suppress.
             * - successMessage: default success message to show in case of success. Pass 'false' to suppress.
             * - formValidator: reference to Chayka.Forms.formValidator
             * - validateOnSend: set to false if you don't want automatic validation
             * - scope: scope to call $apply in callbacks
             * - success: function(data, status, headers, config)
             * - error: function(data, status, headers, config)
             * - complete: function(data, status, headers, config)
             *
             * @returns {*}
             */
            prepare: (options) => {
                var defaults = {
                };

                options = options || {};

                options = angular.extend(defaults, options);

                var spinner = options.spinner; //|| null;
                if(!spinner && spinner !== false){
                    spinner = null;
                }
                var spinnerId = options.spinnerId || 'spinner';
                var spinnerFieldId = options.spinnerFieldId;
                var spinnerMessage = options.spinnerMessage || 'Processing...';
                var errorMessage = options.errorMessage || 'Operation failed';
                var successMessage = options.successMessage;
                var formValidator = options.formValidator;
                var validateOnSend = angular.isUndefined(options.validateOnSend)?true:options.validateOnSend;
                var scope = options.scope;

                var send = options.send;
                var success = options.success;
                var error = options.error;
                var complete = options.complete;

                spinnerId = spinnerId + ajax.spinnersUsed++;

                var prepared = {};
                /**
                 * Sender, ensures all the spinner initializations
                 *
                 * @returns {boolean}
                 */
                var sendHandler = () => {
                    var result = false;
                    if(formValidator && validateOnSend && !(!spinnerFieldId && formValidator.validateFields() || spinnerFieldId && formValidator.validateFieldById(spinnerId))){
                        return false;
                    }
                    if(send && angular.isFunction(send)){
                        result = send();
                    }
                    if(result){
                        if(spinner!==false){
                            if(spinner){
                                spinner.show(spinnerMessage);
                            }else if(spinnerFieldId && formValidator){
                                formValidator.setFieldState(spinnerFieldId, 'progress', spinnerMessage);
                            }else{
                                generalSpinner.show(spinnerMessage, spinnerId);
                            }
                        }
                        if(formValidator){
                            formValidator.clearMessage();
                        }

                        if(scope){
                            utils.patchScope(scope);
                        }
                        //if(scope && !scope.$$phase){
                        //    scope.$apply();
                        //}
                    }

                    return result;
                };

                prepared.send = sendHandler;

                /**
                 * Complete handler, called no matter what.
                 *
                 * @param data
                 * @param status
                 * @param headers
                 * @param config
                 */
                var completeHandler = (data, status, headers, config) => {
                    if(spinner!==false){
                        if(spinner){
                            spinner.hide();
                        }else if(spinnerFieldId && formValidator){
                            formValidator.setFieldState(spinnerFieldId, 'clean');
                        }else{
                            generalSpinner.hide(spinnerId);
                        }
                    }
                    if(complete && angular.isFunction(complete)){
                        complete(data, status, headers, config);
                    }
                };

                prepared.complete = completeHandler;

                /**
                 * Extended error handler, calls complete beforehand
                 *
                 * @param data
                 * @param status
                 * @param headers
                 * @param config
                 */
                var errorHandler = (data, status, headers, config) => {

                    data = ajax.processResponse(data, errorMessage);

                    completeHandler(data, status, headers, config);

                    var errors = ajax.handleErrors(data);
                    var message = errorMessage;
                    for(var i in errors){
                        if(errors.hasOwnProperty(i)) {
                            message = errors[i] || errorMessage;
                            break;
                        }
                    }
                    if(formValidator){
                        if(spinnerFieldId){
                            formValidator.setFieldState(spinnerFieldId, 'error', message);
                        }else {
                            formValidator.showErrors(errors);
                        }
                    }else if(message !== false){
                        modals.alert(message);
                    }

                    if(angular.isFunction(error)){
                        error(data, status, headers, config);
                    }
                    if(scope){
                        utils.patchScope(scope);
                    }
                };

                prepared.error = errorHandler;

                /**
                 * Extended success handler, calls complete beforehand, and error if needed
                 *
                 * @param data
                 * @param status
                 * @param headers
                 * @param config
                 */
                var successHandler = (data, status, headers, config) => {
                    //var data = $.brx.Ajax.detectArgData(arguments);
                    data = ajax.processResponse(data, errorMessage);
                    if(data.code){
                        errorHandler(data, status, headers, config);
                    }else{
                        completeHandler(data, status, headers, config);
                        var message = successMessage === false ? false : data.message || successMessage;
                        if(formValidator && message){
                            formValidator.showMessage(message);
                        }
                        if(success && angular.isFunction(success)){
                            success(data, status, headers, config);
                        }
                    }
                    if(scope){
                        utils.patchScope(scope);
                    }
                };

                prepared.success = successHandler;

                return prepared;

            },

            /**
             * Main request function.
             * @param url
             * @param options can contain all the 'prepare' options alongside with:
             * - data: data for post, put, patch
             * - method: http method ('get', 'post', etc)
             * - config: config for angular.$http
             *
             * @returns {*}
             */
            request: (url, options) => {

                var data = options.data || null,
                    method = options.method || 'post',
                    config = options.config || {};

                var send = null;

                switch (method){
                    case 'get':
                        send = () => {
                            return $http.get(url, config);
                        };
                        break;
                    case 'delete':
                        send = () => {
                            return $http.delete(url, config);
                        };
                        break;
                    case 'head':
                        send = () => {
                            return $http.head(url, config);
                        };
                        break;
                    case 'jsonp':
                        send = () => {
                            return $http.jsonp(url, config);
                        };
                        break;
                    case 'post':
                        send = () => {
                            return $http.post(url, data, config);
                        };
                        break;
                    case 'put':
                        send = () => {
                            return $http.put(url, data, config);
                        };
                        break;
                    case 'patch':
                        send = () => {
                            return $http.patch(url, data, config);
                        };
                        break;
                    default :
                }

                options.send = send;

                var prepared = ajax.prepare(options);

                var promise = prepared.send();

                if(promise){
                    promise.success(prepared.success).error(prepared.error);
                }

                return promise;
            },

            get: (url, options, config) => {
                options = options || {};
                options.method = 'get';
                options.config = config;
                return ajax.request(url, options);
            },

            del: (url, options, config) => {
                options = options || {};
                options.method = 'delete';
                options.config = config;
                return ajax.request(url, options);
            },

            head: (url, options, config) => {
                options = options || {};
                options.method = 'head';
                options.config = config;
                return ajax.request(url, options);
            },

            jsonp: (url, options, config) => {
                options = options || {};
                options.method = 'jsonp';
                options.config = config;
                return ajax.request(url, options);
            },

            post: (url, data, options, config) => {
                options = options || {};
                options.method = 'post';
                options.data = data;
                options.config = config;
                return ajax.request(url, options);
            },

            put: (url, data, options, config) => {
                options = options || {};
                options.method = 'put';
                options.data = data;
                options.config = config;
                return ajax.request(url, options);
            },

            patch: (url, data, options, config) => {
                options = options || {};
                options.method = 'patch';
                options.data = data;
                options.config = config;
                return ajax.request(url, options);
            }
        };

        return ajax;
    }])
    .directive('buttonAjaxRequest', ['ajax', 'modals', (ajax, modals) => {
        return {
            scope: {
                url: '@buttonAjaxRequest',
                postData: '=?post',
                confirm: '@?',
                formValidator: '=?validator'
            },

            link: ($scope, $element) => {
                var onSuccess = (data) => {
                    if(data.message){
                        modals.alert(data.message);
                    }
                };
                var sendRequest = () => {
                    var params = {
                        success: onSuccess
                    };
                    if($scope.formValidator){
                        params.formValidator = $scope.formValidator;
                    }
                    if($scope.postData){
                        ajax.post($scope.url, $scope.postData, params);
                    }else{
                        ajax.get($scope.url, params);
                    }
                };

                $element.click((e) => {
                    e.preventDefault();
                    if($scope.confirm){
                        modals.confirm($scope.confirm, sendRequest);
                    }else{
                        sendRequest();
                    }
                });
            }
        };
    }])
;