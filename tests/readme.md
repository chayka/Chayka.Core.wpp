#CI environment setup

## Step.1 create WP instance accessible from outside.
 Let's say it is accessible from domain name http://test.sample.com
 and is located in /var/www/test.example.com/htdocs/

## Step.2 configure server environment variables.
 Add to /etc/profile following variables:

    # path of WP instance for CI
    export WP_CI_DIR=/var/www/test.example.com/htdocs/

    # url of WP instance for CI
    export WP_CI_URL=http://test.example.com

    # universal pass for all WP users that will be created on demand
    export WP_CI_PASS=_secret_pass_

## Step.3 install wp-cli

    curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
    chmod +x wp-cli.phar
    sudo mv wp-cli.phar /usr/local/bin/wp
    wp --info

## Step.4 install PHPUnit

    wget https://phar.phpunit.de/phpunit.phar
    chmod +x phpunit.phar
    sudo mv phpunit.phar /usr/local/bin/phpunit
    phpunit --version

## Step.5 install CasperJS & PhantomJS to run headless browser tests

    npm install -g phantomjs casperjs
    phantomjs --version
    casperjs --version