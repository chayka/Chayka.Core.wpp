#!/usr/bin/env bash

#
# Install wp-cli
#
install_wp_cli() {
    if [ ! -f /usr/local/bin/wp ]; then
        download https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar wp-cli.phar
        chmod +x wp-cli.phar
        sudo mv wp-cli.phar /usr/local/bin/wp
    fi
    wp --info
}

#
# Install headless browser PhantomJS and CasperJS test suite
#
install_headless () {
    npm install -g phantomjs casperjs
    phantomjs --version
    casperjs --version
}

install_wp_cli
install_headless
