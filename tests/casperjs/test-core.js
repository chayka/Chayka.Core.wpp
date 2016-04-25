'use strict';

var util = require('utils');

casper.test.begin('Checking WP instance main page', function suite(test) {

    casper.echo('');
    casper.start(casper.wpUrl(''), function() {
        casper.runBasicUrlTest(test, this);
    });

    // casper.then(function() {
    //
    // });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Checking WP instance login page && logging in', function suite(test) {

    casper.echo('');
    casper.start(casper.wpUrl('/wp-login.php'), function() {
        casper.runBasicUrlTest(test, this);
    });

    casper.then(function(){
        casper.wpLogin('ci-admin')
            .then(function(){
                test.assertExists('#wp-toolbar', 'Admin toolbar exists');
                test.assertExists('#adminmenu', 'Admin menu exists');
            });
    });

    // casper.then(function() {
    //
    // });

    casper.run(function() {
        test.done();
    });
});