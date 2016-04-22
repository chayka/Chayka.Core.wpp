'use strict';

var util = require('utils');

casper.test.begin('Checking WP instance main page', function suite(test) {

    casper.echo('');
    casper.start(casper.wpUrl(''), function() {
        casper.runBasicUrlTest(test, this);
        
        test.assert(true, 'Always passing test :)');
        
    });

    // casper.then(function() {
    //
    // });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Checking potentially broken page', function suite(test) {

    casper.echo('');

    casper.start(casper.wpUrl('/api/buggy/php-notices'), function(){
        casper.runBasicUrlTest(test, this);
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Checking thrown json API exception', function suite(test) {

    casper.echo('');

    casper.start(casper.wpUrl('/api/buggy/non-existing-page'), function(){
        casper.runBasicUrlTest(test, this);
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Checking empty page', function suite(test) {

    casper.echo('');

    casper.start(casper.wpUrl('/api/buggy/void'), function(){
        casper.runBasicUrlTest(test, this);
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Checking page with HTTP error code', function suite(test) {

    casper.echo('');

    casper.start(casper.wpUrl('/api/buggy/server-error'), function(){
        casper.runBasicUrlTest(test, this);
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Checking page javascript errors', function suite(test) {

    casper.echo('');

    casper.captureJsErrors();

    casper.start(casper.wpUrl('/buggy/js-error'), function(){
        casper.runBasicUrlTest(test, this);
        casper.runJsErrorsTest(test);
    });

    casper.run(function() {
        // util.dump(casper.page);
        test.done();
    });
});
