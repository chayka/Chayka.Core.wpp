#CI environment setup

## Setup PHPCI instance
 Follow this instruction:
 https://www.phptesting.org/wiki/Installing-PHPCI

 **Heads up:** do not forget to setup PHPCI deamon or Cron Job!

    nohup php ./daemonise phpci:daemonise > /dev/null 2>&1 &

## Setup nginx to serve WP site on some test domain
 Let's say it will be accessible from domain name **http://test.sample.com**
 and located in **/var/www/test.example.com/htdocs/**

 **Heads up:** You don't have to install wp itself,
 just create nginx config, folder and restart nginx to serve that folder
 by requiesting some domain name. We'll setup WP using bash script

 **Heads up:** It'll be probably a good idea not to setup dns to serve that test domain.
 It is still a WordPress with it's vulnerabilities. Better do not make it publicly accessible.

## Configure server environment variables.
 Add to **/etc/profile** following variables:

    # path of WP instance for CI
    export WP_CI_DIR=/var/www/test.example.com/htdocs/

    # url of WP instance for CI
    export WP_CI_URL=http://test.example.com

    # universal pass for all WP users that will be created on demand
    export WP_CI_PASS=_secret_pass_

    # path where you want to put successful releases,
    # don't forget to create this folder first.
    export CI_RELEASE_DIR=/tmp/ci-releses/

    # webhook url that you want to notify about new release
    # if you don't need any hook, hust put 'http://localhost' here
    export CI_RELEASE_HOOK_URL=http://download.example.com/api/check-releases

## Setup PHPUnit environment by running tests/phpunit/install.sh
 Run script **tests/phpunit/install.sh**, it will:
  - install composer (if needed)
  - install phpunit (if needed)
  - install WordPress instance (if needed)
  - install WordPress testing suite (if needed)
  - install Chayka.Core.wpp plugin that is needed to run all other plugins
  - create empty database

 **Heads up:** The database will be dropped and recreated each time PHPCI will launch tests!
 The good part is that both PHPUnit and CasperJS test suits will work with the same database.
 So you can create some test data in PHPUnit tests and CasperJS will be run on the instance
 with the same data.

## Setup CasperJS environment by running tests/casperjs/install.sh
 Run script **tests/casperjs/install.sh**, it will:
  - install PhantomJS headless browser
  - install CasperJS testing suite
  - install WP-CLI

 **Heads up:** In oreder to install and run PhantomJS & CasperJS you need set up
 node.js environment with it's npm package manager installed.

## In PHPCI Create a project "Chayka.Core.wpp"

 If you have ssh access to this project repository and you can add deployment keys, then:
  - In PHPCI admin area Click "Admin Options" -> "Create Project"
  - Follow instruction in the top-right corner about deployment keys, add it to repository on GitHub
  - Where is your project hosted?: "GitHub"
  - Repository Name / URL (Remote) or Path (Local): "chayka/Chayka.Core.wpp"
  - Click "Save Project"
  - Go to view mode, follow instruction in a top right corner about a webhook.

 If you don't have access to this project repository
  - In PHPCI admin area Click "Admin Options" -> "Create Project"
  - Where is your project hosted?: "Remote URL"
  - Repository Name / URL (Remote) or Path (Local): "https://github.com/chayka/Chayka.Core.wpp.git"
  - Click "Save Project"
