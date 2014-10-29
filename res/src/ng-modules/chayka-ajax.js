angular.module('chayka-ajax', ['chayka-modals'])
    .factory('ajax', ['$window', '$http', 'modals', function($window, $http, modals){
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
             * @param id
             * @param handler
             * @param errorCode
             */
            addErrorHandler: function(id, handler, errorCode){
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
            removeErrorHandler: function(id){
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
            handleError: function(code, message, payload){
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
            handleErrors: function(data){
                if(!data){
                    return {'empty_response': 'Empty response'};
                }
                if('mass_errors' == data.code){
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
            processResponse: function(response, defaultMessage){
                var message = defaultMessage || null;
                var code = 1;
                if(!response || !response.length){
                    message = 'Empty response';
                }else if(!angular.isUndefined(response.payload)){
                    return response;
                }else if(angular.isString(response)){
                    var m = response.match(/<body[^>]*>([\s\S]*)<\/body>/m);
                    m = m?m:response.match(/<br\s*\/>\s*<b>[^<]+<\/b>\:\s*(.*)<br\s*\/>/m);
                    message = m?m[1].trim():defaultMessage;
                }
                return {code: code, message: message, payload: null};
            },
            /**
             * Prepares all the handlers to show all the spinners and errors
             *
             * @param options
             * @returns {*}
             */
            prepare: function(options){
                var defaults = {
                };

                options = options || {};

                options = angular.extend(defaults, options);

                var spinner = options.spinner || null;
                var spinnerId = options.spinnerId;
                var spinnerFieldId = options.spinnerFieldId;
                var spinnerMessage = options.spinnerMessage || 'Processing...';
                var errorMessage = options.errorMessage || 'Operation failed';
                var formValidator = options.formValidator;

                var send = options.send;
                var success = options.success;
                var error = options.error;
                var complete = options.complete;

                /**
                 * Sender
                 *
                 * @returns {boolean}
                 */
                var sendHandler = function(){
                    var result = false;
                    if(send && angular.isFunction(send)){
                        result = send();
                    }
                    if(result){
                        if(spinner!==false){
                            if(spinner){
                                spinner.show(spinnerMessage);
                            }else if(spinnerFieldId && formValidator){
                                formValidator.setFieldState(spinnerFieldId, 'progress', spinnerMessage);
                            }else if(angular.isFunction($.trigger)){
                                $(document).trigger('Chayka.Spinners.show', spinnerMessage, spinnerId);
                            }
                        }
                    }
                    return result;
                };

                options.send = sendHandler;

                /**
                 * Complete handler, called no matter what.
                 *
                 * @param data
                 * @param status
                 * @param headers
                 * @param config
                 */
                var completeHandler = function(data, status, headers, config){
                    if(spinner!==false){
                        if(spinner){
                            spinner.hide();
                        }else if(spinnerFieldId && formValidator){
                            formValidator.setFieldState(spinnerFieldId, 'clean', spinnerMessage);
                        }else if(angular.isFunction($.trigger)){
                            $(document).trigger('Chayka.Spinners.hide', spinnerId);
                        }
                    }
                    if(complete && angular.isFunction(complete)){
                        complete(data, status, headers, config);
                    }
                };

                options.complete = completeHandler;

                /**
                 * Extended error handler, calls complete beforehand
                 *
                 * @param data
                 * @param status
                 * @param headers
                 * @param config
                 */
                var errorHandler = function(data, status, headers, config){
                    completeHandler(data, status, headers, config);
                    //console.dir({errorHandler: arguments});
                    var errors = ajax.handleErrors(data);
                    var message = errorMessage;
                    for(var i in errors){
                        message = errors[i] || errorMessage;
                        break;
                    }
                    if(formValidator){
                        formValidator.showErrors(errors);
                    }else{
                        modals.alert(message);
                    }

                    if(angular.isFunction(error)){
                        error(data, status, headers, config);
                    }
                };

                options.error = errorHandler;

                /**
                 * Extended success handler, calls complete beforehand
                 *
                 * @param data
                 * @param status
                 * @param headers
                 * @param config
                 */
                var successHandler = function(data, status, headers, config){
                    //var data = $.brx.Ajax.detectArgData(arguments);
                    var data = ajax.processResponse(data, errorMessage);
                    if(data.code){
                        errorHandler(data, status, headers, config);
                    }else{

                        completeHandler(data, status, headers, config);

                        if(success && angular.isFunction(success)){
                            success(data, status, headers, config);
                        }
                    }
                };

                options.success = successHandler;

                return options;

            },

            request: function(url, options){

                var data = options.data || null,
                    method = options.method || 'post',
                    config = options.config || {};

                var send = null;

                switch (method){
                    case 'get':
                        send = function(){
                            return $http.get(url, config);
                        };
                        break;
                    case 'delete':
                        send = function(){
                            return $http.delete(url, config);
                        };
                        break;
                    case 'head':
                        send = function(){
                            return $http.head(url, config);
                        };
                        break;
                    case 'jsonp':
                        send = function(){
                            return $http.jsonp(url, config);
                        };
                        break;
                    case 'post':
                        send = function(){
                            return $http.post(url, data, config);
                        };
                        break;
                    case 'put':
                        send = function(){
                            return $http.put(url, data, config);
                        };
                        break;
                    case 'patch':
                        send = function(){
                            return $http.patch(url, data, config);
                        };
                        break;
                    default :
                }

                options.send = send;

                var prepared = ajax.prepare(options);

                var promise = prepared.send();

                promise.success(prepared.success).error(prepared.error);

                return promise;
            },

            get: function(url, options, config){
                options.method = 'get';
                options.config = config;
                return ajax.request(url, options);
            },

            del: function(url, options, config){
                options.method = 'delete';
                options.config = config;
                return ajax.request(url, options);
            },

            head: function(url, options, config){
                options.method = 'head';
                options.config = config;
                return ajax.request(url, options);
            },

            jsonp: function(url, options, config){
                options.method = 'jsonp';
                options.config = config;
                return ajax.request(url, options);
            },

            post: function(url, data, options, config){
                options.method = 'post';
                options.data = data;
                options.config = config;
                return ajax.request(url, options);
            },

            put: function(url, data, options, config){
                options.method = 'putt';
                options.data = data;
                options.config = config;
                return ajax.request(url, options);
            },

            patch: function(url, data, options, config){
                options.method = 'patch';
                options.data = data;
                options.config = config;
                return ajax.request(url, options);
            }
        }
    }]);