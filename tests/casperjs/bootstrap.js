'use strict';

var utils = require('utils');

/**
 * Get absolute url by providing relative url.
 * Base url is passed from cli
 *
 * @param url
 * @return {*}
 */
casper.wpUrl = function wpUrl (url){
    url = url || '';
    var wpBaseUrl = this.cli.options.wpUrl || '';
    return wpBaseUrl + url;
};

/**
 * Get default password defined in env
 *
 * @return {string}
 */
casper.wpCiPass = function wpCiPass (){
    return this.cli.options.wpCiPass || '';
};

var errors = [];
var errorHandlerBound = false;

/**
 * Login to wordpress
 *
 * @param user
 * @param [password]
 * @return {casper}
 */
casper.wpLogin = function wpLogin (user, password){
    return casper.open(casper.wpUrl('/wp-login.php'), {
        method: 'post',
        data: {
            log: 'ci-admin',
            pwd: password || casper.wpCiPass(),
            redirect_to: casper.wpUrl('/wp-admin/'),
            testcookie: 1,
            'wp-submin': 'Login'
        }
    })
};

/**
 * Set up test suite to capture JS errors and return errors array instance.
 *
 * @return {Array}
 */
casper.captureJsErrors = function(){
    errors = [];
    if(!errorHandlerBound){
        casper.on('page.error', function(message, details){
            errors.push({
                message: message,
                details: details
            });
        });
        errorHandlerBound = true;
    }

    return errors;
};

/**
 * Performs if page has thrown any JS errors since last check.
 *
 * @param test
 */
casper.runJsErrorsTest = function(test){
    test.assert(errors.length === 0, 'Page should not contain any JS errors');
    if(errors.length){
        utils.dump(errors);
    }
    errors = [];
};

/**
 * Perform basic URL test
 * - check if PHP notices are absent
 * - If response is parseble check if code == 0
 *   otherwise output error message or first line of stacktrace
 * - check if http response code is lower than 400
 * - check if response is not empty
 * - check for javascript errors
 *
 * @param test
 * @return {casper}
 */
casper.runBasicUrlTest = function basicUrlTest (test){
    // test.assertTextDoesntExist('( ! )', 'Page should not contain any PHP error output');
    casper.echo('Checking page: ' + casper.getCurrentUrl(), 'INFO_BAR');
    var content = casper.getPageContent();
    var plainBody = casper.fetchText('body');
    var jsonData = null;
    var httpResponseCode = parseInt(casper.status().currentHTTPStatus);
    casper.echo('HTTP Status: ' + httpResponseCode);
    // casper.echo(plainBody);

    /**
     * Try to detect JSON response
     */
    try{
        jsonData = JSON.parse(plainBody);
        casper.echo('JSON response detected');
        // utils.dump(jsonData);
    }catch(e){
        casper.echo('HTML response detected');
    }


    if(jsonData){
        /**
         * JSON response detected, check if no error thrown
         */
        var message = jsonData.code !== 0 ? '\nresponse message: ' + jsonData.message : '';
        test.assertEquals(jsonData.code, 0, 'Successful API responses contain "0" as response code' + message);
    }else{
        /**
         * No JSON detected, check if response is non-empty
         */
        test.assert(!!plainBody, 'Non-empty response expected');
    }

    /**
     * Check if response does not contain any PHP errors, warnings and notices
     */
    test.assert(!/>\( ! \)</.test(content), 'Page should not contain any PHP error output');

    /**
     * Check if HTTP response code is below 400
     */
    test.assert(httpResponseCode < 400, 'HTTP response code should be less than 400');

    /**
     * Check if response contains closing </body> tag.
     * That means server didn't crashed during processing request.
     * Unfortunately this test is useless, since PhantomJS wraps
     * any response into <html><body></body></html>
     */
    // test.assert(/<\/body>/.test(content), 'Page should contain closing </body> tag');

    /**
     * Check if Javascript errors are absent
     */
    casper.runJsErrorsTest(test);

    return casper;
};

casper.thenOpen = function(url, options, callback){
    if (! callback && typeof options === 'function' && options.call && options.apply){
        callback = options;
        options = {};
    }
    return casper.then(function(){
        casper.open(url, options).then(callback);
    });
};

casper.thenPost = function(url, data, callback){
    return casper.thenOpen(url, {
        method: 'post',
        data: data
    }, callback);
};
