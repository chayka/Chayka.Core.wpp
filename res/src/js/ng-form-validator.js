'use strict';

angular.module('ng-form-validator', ['ngSanitize'])
    .directive('formValidator', ['$http', '$window', function($http, $window) {
        return {
            restrict: 'AE',
            //transclude: true,
            scope: {
                validator: '=formValidator',
                scrollMargin: '@',
                scrollDuration: '@'
            },
            link: function(scope, element, attrs){
                scope.top = element.offset().top;
            },
            controller: function($scope) {
                var fields = $scope.fields = {};
                var ctrl = this;

                $scope.scrollMargin = $scope.scrollMargin || 50;
                //console.log('validation form');

                ctrl.template = function(tpl, params){
                    return tpl.replace(/{([^}]+)}/g, function(all, param){
                        return params[param].toString() || '';
                    });
                };

                ctrl.addField = function(field) {
                    //console.dir({'add form-field': field, 'scope': $scope});
                    fields[field.name] = field;
                };

                ctrl.setFieldState = function(field, state, message){
                    field.valid = state === 'valid' || state === 'clean';
                    field.state = state;
                    field.message = message || field.hint;
                };

                ctrl.setFieldError = function(field, message){
                    field.valid = false;
                    field.message = message;
                    //field.$digest();
                };

                ctrl.clearFieldError = function(field){
                    field.valid = true;
                    field.message = field.hint;
                    //field.$digest();
                };

                ctrl.checkRequired = function ( field) {
                    return !!field.value;
                };

                ctrl.checkLength = function(field) {
                    var c = field.checks.length;
                    return !(c.max && field.value.length > c.max || field.value.length < c.min);
                };

                ctrl.checkRegexp = function (field) {
                    var c = field.checks.regexp;
                    var valid = c.regexp.test( field.value );
                    if(c.forbid){
                        valid = !valid;
                    }
                    return valid;
                };

                ctrl.checkPasswords = function(field){
                    var c = field.checks.passwords;
                    var repeatField = fields[c.repeat] || field;
                    return field.value === repeatField.value;
                };

                ctrl.checkApi = function(field){
                    var c = field.checks.api;
                    var url = ctrl.template(c.url, {name: encodeURIComponent(field.name), value: encodeURIComponent(field.value)});
                    var value = field.value + '';
                    if(value in c.dictionary){
                        return c.dictionary[value];
                    }
                    //ctrl.setFieldState(field, 'progress');
                    c.dictionary[value] = 'progress';
                    $http.get(url)
                        .success(function(data, status, headers, config){
                            c.dictionary[value] = 'valid';
                            ctrl.setFieldState(field, 'valid');
                        })
                        .error(function(data, status, headers, config){
                            c.dictionary[value] = 'invalid';
                            c.message = c.message || data.message;
                            ctrl.setFieldState(field, 'invalid', c.message || data.message);
                        });
                    return 'progress';
                };

                ctrl.validateField = function(field) {
                    var valid = true,
                        message = '',
                        state;

                    //if(field.checks.condition){
                    //
                    //}

                    if(field.checks.required && !ctrl.checkRequired(field)){
                        valid = false;
                        message = field.checks.required.message;
                    }

                    if(field.value){
                        angular.forEach(field.checks, function(c, check){
                            if(!valid){
                                return;
                            }
                            switch(check){
                                case 'length':
                                    valid = ctrl.checkLength(field);
                                    break;
                                case 'regexp':
                                    valid = ctrl.checkRegexp(field);
                                    break;
                                case 'passwords':
                                    valid = ctrl.checkPasswords(field);
                                    break;
                                default :
                            }
                            if(!valid){
                                message = c.message;
                            }
                        });
                    }

                    state = valid?'valid':'invalid';

                    if(valid && field.checks.api){
                        state = ctrl.checkApi(field);
                        message = state === 'invalid'?field.checks.api.message:'';
                    }


                    ctrl.setFieldState(field, state, message);

                    return field.valid;
                };

                ctrl.validateFields = function() {
                    var valid = true;

                    var scrollTo = 0;

                    angular.forEach(fields, function(field){
                        //valid = ctrl.validateField(field) && valid;
                        if(!ctrl.validateField(field)){
                            var scrollPos = field.element.offset().top;
                            if(!scrollTo || scrollPos && scrollTo > scrollPos){
                                scrollTo = scrollPos;
                            }
                            valid = false;
                        }
                    });


                    if(!valid && scrollTo){
                        ctrl.scrollTo(scrollTo);
                    }

                    $scope.valid = valid;

                    return valid;
                };

                ctrl.scrollTo = function(scrollTo){
                    scrollTo-=parseInt($scope.scrollMargin);
                    if($window.jQuery){
                        var $ = $window.jQuery;
                        if(scrollTo < $window.pageYOffset || scrollTo > $window.pageYOffset + $($window).height()){
                            $window.jQuery('html, body').animate({scrollTop: scrollTo}, parseInt($scope.scrollDuration) || $scope.scrollDuration);
                        }
                    }
                };

                ctrl.scrollUp = function(){
                    ctrl.scrollTo($scope.top);
                };

                ctrl.showErrors = function(errors){
                    angular.forEach(errors, function(message, key){
                        var field = fields[key];
                        if(field){
                            ctrl.setFieldState(field, 'invalid', message);
                        }
                    });
                };

                $scope.validator = ctrl;

            }
            //template: '<div ng-transclude></div>'
        };
    }])
    .directive('formField', function() {
        return {
            require: '^formValidator',
            restrict: 'AE',
            transclude: true,
            template: '<label>{{label}}</label><div class="input" data-ng-transclude></div><div class="message" data-ng-class="{error: !valid}" ng-bind-html="message">{{message}}</div>',
            scope: {
                name: '@formField',
                label: '@',
                hint: '@',
                message: '@hint'
            },
            link: function(scope, element, attrs, formCtrl) {
                var input = element.find('[ng-model],[data-ng-model]'),
                    inputType = input.attr('type'),
                //hint = element.find('.message'),
                    model = input.attr('data-ng-model') || input.attr('ng-model'),
                    label = element.find('.input > label:first-child'),
                    $label = element.find('> label');
                if(!scope.label && inputType !=='checkbox' && inputType !== 'radio'){
                    //element.find('> label').remove();
                    scope.label = label.text().replace(/\s*:\s*$/, '');
                    angular.forEach(label.attributes, function(i, attr){
                        var name = attr.name;
                        var value = attr.value;
                        $label.attr(name, value);
                    });
                    $label.text(scope.label);
                    label.remove();
                    //scope.$digest();
                }
                //console.log('model binding: '+model);

                console.dir({'attrs': attrs, element: element, input: input});

                scope.valid = true;

                scope.state = 'clean'; // clean|progress|valid|invalid

                scope.checks = {};

                scope.element = element;

                input.focus(function(){
                    //formCtrl.clearFieldError(scope);
                    //formCtrl.setFieldState(field, 'clean');
                });

                input.blur(function(){
                    //formCtrl.setFieldError(scope, 'error');
                    if(scope.value){
                        //console.log('validating value: '+scope.value);
                        formCtrl.validateField(scope);
                        scope.$digest();
                    }
                });

                function setupIf(){
                    if(attrs.checkIf){
                        scope.checks.condition = {
                            fieldId: attrs.checkIf
                        };
                    }
                }

                function setupRequired(){
                    scope.checks.required = {
                        message: attrs.checkRequired || 'Required'
                    };
                }

                function setupLength(){
                    var short = attrs.checkLength; // 'Длина значения должна быть от <%= min %> до <%= max => символов.|0|16'
                    var shorts = short?short.split('|'):[];
                    var min = parseInt(shorts[1] || attrs.checkLengthMin || 0);
                    var max = parseInt(shorts[2] || attrs.checkLengthMax || 0);
                    var messageTemplate = shorts[0] || attrs.checkLengthMessage ||
                        'Длина значения должна быть от {min} до {max} символов.';
                    var message = formCtrl.template(messageTemplate, {min: min, max: max, label: scope.label});
                    scope.checks.length = {
                        message: message,
                        min: min,
                        max: max
                    };
                }

                function setupRange(){
                    var short = attrs.checkRange; // 'Значения должна быть от <%= min %> до <%= max =>|0|16'
                    var shorts = short?short.split('|'):[];
                    var min = parseInt(shorts[1] || attrs.checkRangeMin || 0);
                    var max = parseInt(shorts[2] || attrs.checkRangeMax || 0);
                    var messageTemplate = shorts[0] || attrs.checkRangeMessage ||
                        'Значение должно быть в диапазоне от {min} до {max}';
                    var message = formCtrl.template(messageTemplate, {min: min, max: max, label: scope.label});
                    scope.checks.range = {
                        message: message,
                        min: min,
                        max: max
                    };
                }

                function setupRegExp(){
                    var short = attrs.checkRegexp; // 'Неверный формат телефона...|/\d{7}/i|forbid'
                    var shorts = short?short.split('|'):[];
                    var patternAndModifiers = short && /\/(.*)\/(\w*)$/.exec(shorts[1]) || [];
                    var message = shorts[0] || attrs.checkRegexpMessage || 'Invalid format';
                    var pattern = patternAndModifiers[1] || attrs.checkRegexpPattern || '.*';
                    var modifiers = patternAndModifiers[2] || attrs.checkRegexpModifiers || '';
                    var forbid = shorts[2] || attrs.checkRegexpForbid || false;

                    var regexp = new RegExp(pattern, modifiers);

                    scope.checks.regexp = {
                        message: message,
                        regexp: regexp,
                        forbid: forbid
                    };

                    console.dir({'regexp':scope.checks.regexp});

                }

                function setupEmail() {
                    var message = attrs.checkEmail || 'Valid email format: user@domain.com';
                    scope.checks.regexp = {
                        message: message,
                        regexp: /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i,
                        forbid: false
                    };
                }

                function setupPasswords() {
                    var short = attrs.checkPasswords; // 'pass1id|Введенные пароли отличаются'
                    var shorts = short?short.split('|'):[];

                    var repeat = shorts[0] || attrs.checkPasswordsRepeat;

                    var message = shorts[1] || attrs.checkPasswordsMessage || 'Passwords do not match';

                    scope.checks.passwords = {
                        message: message,
                        repeat: repeat
                    };
                }

                function setupApiCall() {
                    var short = attrs.checkApi; // '/api/check-existing/{name}/{value}|Email exists'
                    var shorts = short?short.split('|'):[];

                    var url = shorts[0] || attrs.checkApiUrl;

                    var message= shorts[1] || attrs.checkApiMessage;

                    scope.checks.api = {
                        message: message,
                        url: url,
                        dictionary: {}
                    };
                }

                angular.forEach(attrs, function(attr, key){
                    var m = key.match(/^check([A-Z][a-z]*)/),
                        check = m && m[1];
                    if(check && !scope.checks[check]){
                        switch(check){
                            case 'If':
                                setupIf();
                                break;
                            case 'Required':
                                setupRequired();
                                break;
                            case 'Length':
                                setupLength();
                                break;
                            case 'Range':
                                setupRange();
                                break;
                            case 'Regexp':
                                setupRegExp();
                                break;
                            case 'Email':
                                setupEmail();
                                break;
                            case 'Passwords':
                                setupPasswords();
                                break;
                            case 'Api':
                                setupApiCall();
                                break;
                            default:
                        }
                    }
                });
                //console.dir({'checks': scope.checks});

                scope.$parent.$watch(model, function(value){
                    //console.log('we are watching: '+value);
                    scope.value = value;
                    //formCtrl.validateField(scope);
                });

                scope.$watch('state', function(value){
                    element.removeClass('clean progress valid invalid');
                    element.addClass(value);
                });

                formCtrl.addField(scope);
            },
            controller: function($scope){
            }
            //templateUrl: 'field.html'
        };
    });

