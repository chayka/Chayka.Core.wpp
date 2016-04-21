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