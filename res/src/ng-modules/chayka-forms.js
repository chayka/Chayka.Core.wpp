'use strict';

angular.module('chayka-forms', ['ngSanitize', 'chayka-modals', 'chayka-translate', 'chayka-ajax'])
    .directive('formValidator', ['$window', 'modals', 'ajax', 'utils', function($window, modals, ajax, utils) {
        return {
            restrict: 'AE',
            //transclude: true,
            scope: {
                validator: '=?formValidator',
                scrollMargin: '@',
                scrollDuration: '@'
            },
            link: function(scope, element){
                scope.element = element;
            },
            controller: function($scope) {
                var fields = $scope.fields = {};
                var ctrl = this;
                var messageBox = null;
                $scope.scrollMargin = $scope.scrollMargin || 50;
                //console.log('validation form');

                /**
                 * Sets message box for validator.
                 * The box that will show common errors.
                 * This function is called by 'form-message' directive.
                 *
                 * If not set, Chayka.Modals.alert() will be utilized.
                 *
                 * @param {$scope} msgBox
                 */
                ctrl.setMessageBox = function(msgBox){
                    messageBox = msgBox;
                };

                /**
                 * Show message using message box or Chayka.Modals.alert()
                 *
                 * @param {string} message
                 * @param {string} state
                 * @returns {boolean}
                 */
                ctrl.showMessage = function(message, state){
                    if(messageBox){
                        messageBox.message = message;
                        messageBox.state = state || '';
                        return true;
                    }
                    modals.alert(message, '', state);
                    return false;
                };

                /**
                 * Hide message shown by message box
                 *
                 * @returns {boolean}
                 */
                ctrl.clearMessage = function(){
                    if(messageBox){
                        messageBox.message = '';
                        messageBox.state = '';
                        return true;
                    }
                    return false;
                };

                /**
                 * Add field to the set of validated fields
                 *
                 * @param {$scope} field
                 */
                ctrl.addField = function(field) {
                    fields[field['name']] = field;
                };

                /**
                 * Set field state and message (hint)
                 *
                 * @param {string|$scope} field
                 * @param {string} state
                 * @param {string} [message]
                 */
                ctrl.setFieldState = function(field, state, message){
                    if(angular.isString(field)){
                        field = fields[field];
                        if(!field){
                            return;
                        }
                    }
                    field['valid'] = state === 'valid' || state === 'clean';
                    field['state'] = state;
                    field['message'] = message || field['hint'];

                    utils.patchScope(field);
                };

                /**
                 * Set field state to error
                 *
                 * @param {string|scope} field
                 * @param message
                 */
                ctrl.setFieldError = function(field, message){
                    ctrl.setFieldState(field, 'invalid', message);
                };

                /**
                 * Clear field error state.
                 *
                 * @param {string|scope} field
                 */
                ctrl.clearFieldError = function(field){
                    ctrl.setFieldState(field, 'clear');
                };

                /**
                 * Check required field
                 *
                 * @param {$scope} field
                 * @returns {boolean}
                 */
                ctrl.checkRequired = function (field) {
                    return !!field['value'];
                };

                /**
                 * Check field length.
                 *
                 * @param {$scope} field
                 * - length
                 * @returns {boolean}
                 */
                ctrl.checkLength = function(field) {
                    var c = field['checks'].length;
                    return !(c.max && field['value'].length > c.max || field['value'].length < c.min);
                };

                /**
                 * Check field value range.
                 *
                 * @param {$scope} field
                 * - min
                 * - minE
                 * - max
                 * - maxE
                 * @returns {boolean}
                 */
                ctrl.checkRange = function(field) {
                    var c = field['checks'].range;
                    var lower = c.min && (c.minE && field['value'] < c.min || !c.minE && field['value'] <= c.min);
                    var greater = c.max && (c.maxE && field['value'] > c.max || !c.minE && field['value'] >= c.max);
                    return !(lower || greater);
                };

                /**
                 * Check field value lt (<).
                 *
                 * @param {$scope} field
                 * - max
                 * @returns {boolean}
                 */
                ctrl.checkLt = function(field) {
                    var c = field['checks'].lt;
                    return field['value'] < c.max;
                };

                /**
                 * Check field value le (<=).
                 *
                 * @param {$scope} field
                 * - max
                 * @returns {boolean}
                 */
                ctrl.checkLe = function(field) {
                    var c = field['checks'].le;
                    return field['value'] <= c.max;
                };

                /**
                 * Check field value gt (>).
                 *
                 * @param {$scope} field
                 * - min
                 * @returns {boolean}
                 */
                ctrl.checkGt = function(field) {
                    var c = field['checks'].gt;
                    return field['value'] > c.min;
                };

                /**
                 * Check field value ge (>=).
                 *
                 * @param {$scope} field
                 * - min
                 * @returns {boolean}
                 */
                ctrl.checkGe = function(field) {
                    var c = field['checks'].ge;
                    return field['value'] >= c.min;
                };

                /**
                 * Check field value against regexp.
                 *
                 * @param {$scope} field
                 * - regexp
                 * @returns {*|boolean}
                 */
                ctrl.checkRegexp = function (field) {
                    var c = field['checks'].regexp;
                    var valid = c.regexp.test( field['value'] );
                    if(c.forbid){
                        valid = !valid;
                    }
                    return valid;
                };

                /**
                 * Compare two password field values.
                 *
                 * @param {$scope} field
                 * - repeat
                 * @returns {boolean}
                 */
                ctrl.checkPasswords = function(field){
                    var c = field['checks'].passwords;
                    var repeatField = fields[c.repeat] || field;
                    return field['value'] === repeatField.value;
                };

                /**
                 * Check value using api call.
                 * Stores checked values to cache.
                 *
                 * @param {$scope} field
                 * - url
                 * - delay
                 * @returns {string} state
                 */
                ctrl.checkApi = function(field){
                    var c = field['checks'].api;
                    var url = utils.template(c.url, {name: encodeURIComponent(field['name']), value: encodeURIComponent(field['value'])});
                    var value = field['value'] + '';
                    if(value in c.dictionary){
                        if('valid' === c.dictionary[value]){
                            ctrl.setFieldState(field, 'valid', null);
                        }else{
                            ctrl.setFieldState(field, 'invalid', c.message);
                        }
                        return c.dictionary[value];
                    }

                    c.dictionary[value] = 'progress';
                    ajax.get(url, {
                        spinner: $scope.spinner,
                        spinnerFieldId: field['name'],
                        spinnerMessage: ' ',
                        showMessage: false,
                        formValidator: ctrl,
                        errorMessage: c.message,
                        scope: field,
                        success: function(data){
                            //console.dir({'data': data});
                            c.dictionary[value] = 'valid';
                            ctrl.setFieldState(field, 'valid', null);
                        },
                        error: function(data){
                            c.dictionary[value] = 'invalid';
                            c.message = c.message || 'mass_errors' === data.code && data.message[field['name']] || data.message;
                        }
                    });
                    return c.dictionary[value];

                };

                /**
                 * Perform custom check by calling provided scope callback.
                 *
                 * @param {$scope} field
                 * @returns {*}
                 */
                ctrl.checkCustom = function(field){
                    var c = field['checks'].custom;
                    var callback = c.callback;
                    return $scope.$parent[callback].call($scope, field['value']);
                };

                /**
                 * Perform all the set up checks for the given field.
                 * If silent, does not visualize validation state.
                 *
                 * @param {$scope} field
                 * @param {boolean} [silent]
                 * @returns {*}
                 */
                ctrl.validateField = function(field, silent) {
                    var valid = true,
                        message = '',
                        state,
                        checks = field['checks'];

                    if(!field['active']){
                        return true;
                    }

                    if(checks.required && !ctrl.checkRequired(field)){
                        valid = false;
                        message = checks.required.message;
                    }

                    if(field['value']){
                        angular.forEach(checks, function(c, check){
                            if(!valid){
                                return;
                            }
                            switch(check){
                                case 'length':
                                    valid = ctrl.checkLength(field);
                                    break;
                                case 'range':
                                    valid = ctrl.checkRange(field);
                                    break;
                                case 'lt':
                                    valid = ctrl.checkLt(field);
                                    break;
                                case 'le':
                                    valid = ctrl.checkLe(field);
                                    break;
                                case 'gt':
                                    valid = ctrl.checkGt(field);
                                    break;
                                case 'ge':
                                    valid = ctrl.checkGe(field);
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

                    if(valid && checks.custom){
                        valid = ctrl.checkCustom(field);
                        message = valid?'':checks.custom.message;
                    }

                    state = valid?'valid':'invalid';

                    if(valid && checks.api){
                        state = ctrl.checkApi(field);
                        message = state === 'invalid'?checks.api.message:'';
                    }


                    if(!silent){
                        ctrl.setFieldState(field, state, message);
                    }

                    return field.valid;
                };

                /**
                 * Validate all registered fields and scroll to
                 * top invalid field in case it is invisible.
                 *
                 * @returns {boolean}
                 */
                ctrl.validateFields = function() {
                    var valid = true;

                    var scrollTo = 0;

                    angular.forEach(fields, function(field){
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

                /**
                 * Scroll to set position in case if position is out of the vieport.
                 * If duration is 0, scroll is not animated.
                 * Default duration value is taken from markup (see scroll-duration directive).
                 *
                 * @param {int} scrollTo
                 * @param {int|string} [duration]
                 */
                ctrl.scrollTo = function(scrollTo, duration){

                    if(angular.isUndefined(duration)){
                        duration = parseInt($scope.scrollDuration) || $scope.scrollDuration;
                    }

                    scrollTo-=parseInt($scope.scrollMargin);
                    if($window.jQuery){
                        var $ = $window.jQuery;
                        if(scrollTo < $window.pageYOffset || scrollTo > $window.pageYOffset + $($window).height()){
                            if(duration){
                                $window.jQuery('html, body').animate({scrollTop: scrollTo}, duration);
                            }else{
                                $window.jQuery('html, body').scrollTop(scrollTo);
                            }
                        }
                    }
                };

                /**
                 * Scroll to top of the form-validator DOM-element if one is not visible.
                 *
                 * @param {int|string} [duration]
                 */
                ctrl.scrollUp = function(duration){
                    ctrl.scrollTo($scope.element.offset().top, duration);
                };

                /**
                 * Show set of errors organized by fields.
                 * This function is handy to show errors from backend api call.
                 *
                 * Errors for non-existing fields will be shown in message box
                 * or via Chayka.Modals.alert();
                 *
                 * @param {object} errors
                 */
                ctrl.showErrors = function(errors){
                    var scrollTo = 0;
                    angular.forEach(errors, function(message, key){
                        var field = fields[key];
                        if(field){
                            ctrl.setFieldState(field, 'invalid', message);
                            var scrollPos = field.element.offset().top;
                            if(!scrollTo || scrollPos && scrollTo > scrollPos){
                                scrollTo = scrollPos;
                            }
                        }else{
                            ctrl.showMessage(message, 'error');
                        }
                    });

                    if(scrollTo){
                        ctrl.scrollTo(scrollTo);
                    }
                };

                $scope.validator = ctrl;

            }
        };
    }])
    .directive('formField', ['$translate', 'delayedCall', 'utils', function($translate, delayedCall, utils) {
        return {
            require: '^formValidator',
            restrict: 'AE',
            transclude: true,
            template: '<label>{{label|translate}}</label><div class="input" data-ng-transclude></div><div class="message" data-ng-class="{error: !valid}" data-ng-bind-html="message">{{message}}</div>',
            scope: {
                name: '@formField',
                label: '@',
                hint: '@',
                message: '@hint'
                //value: '='
            },
            link: function($scope, $element, attrs, formCtrl) {
                var $input = $element.find('[ng-model],[data-ng-model]'),
                    inputType = $input.attr('type'),
                //hint = element.find('.message'),
                    model = $input.attr('data-ng-model') || $input.attr('ng-model'),
                    $oldLabel = $element.find('.input > label:first-child'),
                    $newLabel = $element.find('> label');
                if(!$scope.label && inputType !=='checkbox' /*&& inputType !== 'radio'*/){
                    //element.find('> label').remove();
                    $scope.label = $oldLabel.text().replace(/\s*:\s*$/, '');
                    angular.forEach($oldLabel.attributes, function(i, attr){
                        var name = attr.name;
                        var value = attr.value;
                        $newLabel.attr(name, value);
                    });
                    $newLabel.addClass($oldLabel.attr('class'));
                    $newLabel.text($scope.label);
                    $oldLabel.remove();
                    //scope.$digest();
                }
                //console.log('model binding: '+model);

                //console.dir({'attrs': attrs, element: element, input: input});

                $scope.valid = true;

                $scope.state = 'clean'; // clean|progress|valid|invalid

                $scope.active = true;

                $scope.checks = {};

                $scope.element = $element;

                $input.focus(function(){
                    //formCtrl.clearFieldError(scope);
                    //formCtrl.setFieldState(field, 'clean');
                });

                $input.blur(function(){
                    //formCtrl.setFieldError(scope, 'error');
                    if($scope.value){
                        //console.log('validating value: '+scope.value);
                        formCtrl.validateField($scope, false);
                    }
                    utils.patchScope($scope);
                    //scope.$apply(); // ok
                });

                /**
                 * setup data-check-if="condition"
                 */
                function setupIf(){
                    if(attrs['checkIf']){
                        $scope.$parent.$watch(attrs['checkIf'], function(value){
                            $scope.active = value;
                        });
                    }
                }

                /**
                 * Setup required field check.
                 *
                 * Html format:
                 *      data-required = "This field is required"
                 */
                function setupRequired(){
                    $scope.checks.required = {
                        message: attrs['checkRequired'] || $translate.instant('message_required')
                    };
                }

                /**
                 * Setup field value length check.
                 *
                 * Html format:
                 *      data-check-length = "The length of this value should be between {min} and {max} symbols|0|16"
                 * or
                 *      data-check-length-message = "The length of this value should be between {min} and {max} symbols"
                 *      data-check-length-min = "0"
                 *      data-check-length-max = "16"
                 *
                 */
                function setupLength(){
                    var short = attrs['checkLength'];
                    var shorts = short?short.split('|'):[];
                    var min = parseInt(shorts[1] || attrs['checkLengthMin'] || 0);
                    var max = parseInt(shorts[2] || attrs['checkLengthMax'] || 0);
                    var messageTemplate = shorts[0] || attrs['checkLengthMessage'] ||
                        $translate.instant('message_length');
                    var message = utils.template(messageTemplate, {min: min, max: max, label: $scope.label});
                    $scope.checks.length = {
                        message: message,
                        min: min,
                        max: max
                    };
                }

                /**
                 * Setup field value range check.
                 *
                 * Html format:
                 *      data-check-range = "The value should be between {min} and {max}|=0|16|int"
                 * or
                 *      data-check-range-message = "The value should be between {min} and {max}"
                 *      data-check-range-min = "=0" ('=' means 'inclusive')
                 *      data-check-range-max = "16"
                 *      data-check-range-format = "int"
                 *
                 */
                function setupRange(){
                    var short = attrs['checkRange'];
                    var shorts = short?short.split('|'):[];
                    var minStr = shorts[1] || attrs['checkRangeMin'] || 0;
                    var minE = !!minStr.match(/^=/);
                    var min = minE? minStr.substr(1): minStr;
                    var maxStr = shorts[2] || attrs['checkRangeMax'] || 0;
                    var maxE = !!maxStr.match(/^=/);
                    var max = maxE? maxStr.substr(1): maxStr;
                    var format = shorts[3] || attrs['checkRangeFormat'] || 'int';
                    switch(format){
                        case 'int':
                            min = parseInt(min);
                            max = parseInt(max);
                            break;
                        case 'float':
                            min = parseFloat(min);
                            max = parseFloat(max);
                            break;
                        default:
                    }
                    var messageTemplate = shorts[0] || attrs['checkRangeMessage'] ||
                        $translate.instant('message_range');
                    var message = utils.template(messageTemplate, {min: min, max: max, label: $scope.label});
                    $scope.checks.range = {
                        message: message,
                        min: min,
                        minE: minE,
                        max: max,
                        maxE: maxE
                    };
                }

                /**
                 * Setup field value 'lower than (<)'.
                 *
                 * Html format:
                 *      data-check-lt = "The value should be lower than {max}|0|int"
                 * or
                 *      data-check-lt-message = "The value should be lower than {max}"
                 *      data-check-lt-max = "0"
                 *      data-check-lt-format = "int"
                 */
                function setupLt(){
                    var short = attrs['checkLt'];
                    var shorts = short?short.split('|'):[];
                    var max = shorts[1] || attrs['checkLtMax'] || 0;
                    var messageTemplate = shorts[0] || attrs['checkLtMessage'] ||
                        $translate.instant('message_lt');
                    var message = utils.template(messageTemplate, {max: max, label: $scope.label});
                    var format = shorts[2] || attrs['checkLtFormat'] || 'int';
                    switch(format){
                        case 'int':
                            max = parseInt(max);
                            break;
                        case 'float':
                            max = parseFloat(max);
                            break;
                        default:
                    }
                    $scope.checks.lt = {
                        message: message,
                        max: max
                    };
                }

                /**
                 * Setup field value 'lower or equal (<=)'.
                 *
                 * Html format:
                 *      data-check-le = "The value should be lower than {max} or equal|0|int"
                 * or
                 *      data-check-le-message = "The value should be lower than {max} or equal"
                 *      data-check-le-max = "0"
                 *      data-check-le-format = "int"
                 */
                function setupLe(){
                    var short = attrs['checkLe'];
                    var shorts = short?short.split('|'):[];
                    var max = shorts[1] || attrs['checkLeMax'] || 0;
                    var messageTemplate = shorts[0] || attrs['checkLeMessage'] ||
                        $translate.instant('message_le');
                    var message = utils.template(messageTemplate, {max: max, label: $scope.label});
                    var format = shorts[2] || attrs['checkLeFormat'] || 'int';
                    switch(format){
                        case 'int':
                            max = parseInt(max);
                            break;
                        case 'float':
                            max = parseFloat(max);
                            break;
                        default:
                    }
                    $scope.checks.le = {
                        message: message,
                        max: max
                    };
                }

                /**
                 * Setup field value 'greater than (>)'.
                 *
                 * Html format:
                 *      data-check-gt = "The value should be greater than {min}|0|int"
                 * or
                 *      data-check-gt-message = "The value should be greater than {min}"
                 *      data-check-gt-max = "0"
                 *      data-check-gt-format = "int"
                 */
                function setupGt(){
                    var short = attrs['checkGt'];
                    var shorts = short?short.split('|'):[];
                    var min = shorts[1] || attrs['checkGtMin'] || 0;
                    var messageTemplate = shorts[0] || attrs['checkGtMessage'] ||
                        $translate.instant('message_gt');
                    var message = utils.template(messageTemplate, {min: min, label: $scope.label});
                    var format = shorts[2] || attrs['checkGtFormat'] || 'int';
                    switch(format){
                        case 'int':
                            min = parseInt(min);
                            break;
                        case 'float':
                            min = parseFloat(min);
                            break;
                        default:
                    }
                    $scope.checks.gt = {
                        message: message,
                        min: min
                    };
                }

                /**
                 * Setup field value 'greater or equal (<=)'.
                 *
                 * Html format:
                 *      data-check-ge = "The value should be greater than {min} or equal|0|int"
                 * or
                 *      data-check-ge-message = "The value should be greater than {min} or equal"
                 *      data-check-ge-min = "0"
                 *      data-check-ge-format = "int"
                 */
                function setupGe(){
                    var short = attrs['checkGe'];
                    var shorts = short?short.split('|'):[];
                    var min = shorts[1] || attrs['checkGeMin'] || 0;
                    var messageTemplate = shorts[0] || attrs['checkGeMessage'] ||
                        $translate.instant('message_ge');
                    var message = utils.template(messageTemplate, {min: min, label: $scope.label});
                    var format = shorts[2] || attrs['checkGeFormat'] || 'int';
                    switch(format){
                        case 'int':
                            min = parseInt(min);
                            break;
                        case 'float':
                            min = parseFloat(min);
                            break;
                        default:
                    }
                    $scope.checks.ge = {
                        message: message,
                        min: min
                    };
                }

                /**
                 * Setup field regexp check.
                 * Heads up: If you need '/' char in a message or '|' char in a pattern,
                 * You'd better use extended format instead of short one.
                 *
                 * Html format:
                 *      data-check-regexp = "Invalid phone format|/\d{7}/i|forbid"
                 * or
                 *      data-check-regexp-message = "Invalid phone format"
                 *      data-check-regexp-pattern = "\d{7}"
                 *      data-check-regexp-modifiers = "i"
                 *      data-check-regexp-forbid = "forbid"
                 */
                function setupRegExp(){
                    var short = attrs['checkRegexp'];
                    var shorts = short?short.split('|'):[];
                    var patternAndModifiers = short && /\/(.*)\/(\w*)$/.exec(shorts[1]) || [];
                    var message = shorts[0] || attrs['checkRegexpMessage'] || $translate.instant('message_regexp');
                    var pattern = patternAndModifiers[1] || attrs['checkRegexpPattern'] || '.*';
                    var modifiers = patternAndModifiers[2] || attrs['checkRegexpModifiers'] || '';
                    var forbid = shorts[2] || attrs['checkRegexpForbid'] || false;

                    var regexp = new RegExp(pattern, modifiers);

                    $scope.checks.regexp = {
                        message: message,
                        regexp: regexp,
                        forbid: forbid
                    };

                    //console.dir({'regexp':scope.checks.regexp});

                }

                /**
                 * Setup email field check.
                 *
                 * Html format:
                 *      data-check-email = "Valid email format: user@domain.com"
                 */
                function setupEmail() {
                    var message = attrs['checkEmail'] || $translate.instant('message_email');
                    $scope.checks.regexp = {
                        message: message,
                        regexp: /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i,
                        forbid: false
                    };
                }

                /**
                 * Setup password compare check.
                 *
                 * Html format:
                 *      data-check-passwords = "pass1_id|Passwords do not match"
                 * or
                 *      data-check-passwords-message = "Invalid phone format"
                 *      data-check-passwords-repeat = "pass1_id"
                 */
                function setupPasswords() {
                    var short = attrs['checkPasswords']; // 'pass1id|Введенные пароли отличаются'
                    var shorts = short?short.split('|'):[];

                    var repeat = shorts[0] || attrs['checkPasswordsRepeat'];

                    var message = shorts[1] || attrs['checkPasswordsMessage'] || $translate.instant('message_passwords');

                    $scope.checks.passwords = {
                        message: message,
                        repeat: repeat
                    };
                }

                /**
                 * Setup backend api check.
                 *
                 * Html format:
                 *      data-check-api = "/api/check-existing/{name}/{value}|Email exists|500"
                 * or
                 *      data-check-api-message = "Invalid phone format"
                 *      data-check-api-url = "/api/check-existing/{name}/{value}"
                 *      data-check-api-delay = "500"
                 */
                function setupApiCall() {
                    var short = attrs['checkApi']; // '/api/check-existing/{name}/{value}|Email exists|500'
                    var shorts = short?short.split('|'):[];

                    var url = shorts[0] || attrs['checkApiUrl'];

                    var message = shorts[1] || attrs['checkApiMessage'];

                    var delay = shorts[2] || attrs['checkApiDelay'] || 0;

                    $scope.checks.api = {
                        message: message,
                        url: url,
                        delay: delay,
                        dictionary: {}
                    };

                    $input.on('keyup change', function(){
                        formCtrl.setFieldState($scope, 'clean');
                        utils.patchScope($scope);
                        //scope.$apply(); // ok
                        if($scope.value){
                            delayedCall('check-api-'+$scope.name, delay, function(){
                                formCtrl.validateField($scope, true);
                                utils.patchScope($scope);
                                //scope.$apply();
                            });
                        }
                    });


                }

                /**
                 * Setup custom check.
                 *
                 * Html format:
                 *      data-check-custom = "validateProjectTitle|Project Title should be sweet"
                 * or
                 *      data-check-custom-message = "Project Title should be sweet"
                 *      data-check-custom-callback = "validateProjectTitle"
                 *
                 * callback.call($scope, value) will be called
                 */
                function setupCustom() {
                    var short = attrs['checkCustom'];
                    var shorts = short?short.split('|'):[];

                    var callback = shorts[0] || attrs['checkCustomCallback'];

                    var message = shorts[1] || attrs['checkCustomMessage'] || $translate.instant('message_custom');

                    $scope.checks.custom = {
                        message: message,
                        callback: callback
                    };
                }

                angular.forEach(attrs, function(attr, key){
                    var m = key.match(/^check([A-Z][a-z]*)/),
                        check = m && m[1];
                    if(check && !$scope.checks[check]){
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
                            case 'Le':
                                setupLe();
                                break;
                            case 'Lt':
                                setupLt();
                                break;
                            case 'Ge':
                                setupGe();
                                break;
                            case 'Gt':
                                setupGt();
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
                            case 'Custom':
                                setupCustom();
                                break;
                            default:
                        }
                    }
                });
                //console.dir({'checks': scope.checks});

                $scope.$parent.$watch(model, function(value){
                    //console.log('we are watching: '+value);
                    $scope.value = value;
                    //formCtrl.validateField(scope);
                });

                $scope.$watch('state', function(value){
                    $element.removeClass('clean progress valid invalid');
                    $element.addClass(value);
                });

                formCtrl.addField($scope);
            },
            controller: function($scope){
            }
        };
    }])
    .directive('formMessage', function() {
        return {
            require: '^formValidator',
            restrict: 'AE',
            replace: true,
            template: '<div class="form-message {{state}}" data-ng-show="!!message" data-ng-bind-html="message"></div>',
            scope: {
                message: '@'
            },
            link: function ($scope, $element, attrs, formCtrl) {
                $scope.message = '';
                $scope.state = '';
                formCtrl.setMessageBox($scope);
            }
        };
    })
    .directive('autoHeight', [function(){
        return {
            restrict: 'A',
            link: function($scope, $element){
                var resizeTextarea = function(){
                    var height = $element.css('box-sizing')==='border-box'?
                        parseInt($element.css('borderTopWidth')) +
                        $element.prop('scrollHeight')+
                        parseInt($element.css('borderBottomWidth')):
                        $element.prop('scrollHeight');
                    $element.css('height', height+'px');
                };

                $element.on('change input cut paste drop keydown', resizeTextarea);
            }
        };
    }])
    .factory('delayedCall', ['$timeout', function($timeout){
        var timeouts={};

        /**
         * This function created named timeout that is canceled and rescheduled
         * if function was called once again before timeout happened.
         * Handy for field checks while user types in.
         *
         * @param {string} callId
         * @param {int} timeout
         * @param {function} callback
         */
        return function (callId, delay, callback) {
            var handle = timeouts[callId];
            if (handle) {
                $timeout.cancel(handle);
            }
            timeouts[callId] = $timeout(function () {
                timeouts[callId] = null;
                callback();
            }, delay);
        };
    }])
    .config(['$translateProvider', function($translateProvider) {

        // Adding a translation table for the English language
        $translateProvider.translations('en-US', {
            'message_required': 'Required Field',
            'message_length': 'The length of this value should be between {min} and {max} symbols',
            'message_range': 'The value should be between {min} and {max}',
            'message_lt': 'The value should be lower than {max}',
            'message_le': 'The value should be lower than {max} or equal',
            'message_gt': 'The value should be greater than {min}',
            'message_ge': 'The value should be greater than {min} or equal',
            'message_regexp': 'Invalid format',
            'message_email': 'Valid email format: user@domain.com',
            'message_passwords': 'Passwords do not match',
            'message_custom': 'Invalid value'


        });

        $translateProvider.translations('ru-RU', {
            'message_required': 'Обязательное поле',
            'message_length': 'Длина значения должна быть от {min} до {max} символов',
            'message_range': 'Значение должно быть в диапазоне от {min} до {max}',
            'message_lt': 'Значение должно быть меньше {max}',
            'message_le': 'Значение должно быть меньше или равно {max}',
            'message_gt': 'Значение должно быть больше {min}',
            'message_ge': 'Значение должно быть больше или равно {min}',
            'message_regexp': 'Некорректный формат',
            'message_email': 'Формат email: user@domain.com',
            'message_passwords': 'Введенные пароли отличаются',
            'message_custom': 'Некорректное значение'
        });
    }])
;

