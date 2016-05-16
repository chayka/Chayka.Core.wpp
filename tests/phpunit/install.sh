#!/usr/bin/env bash

#
# checking params
#
if [ $# -lt 3 ]; then
	echo "usage: $0 <db-name> <db-user> <db-pass> [wp-version] [wp-core-dir] [wp-tests-lib-dir]"
	exit 1
fi

#
# acquiring params
#
DB_NAME=$1
DB_USER=$2
DB_PASS=$3
DB_HOST='localhost'
WP_VERSION=${4-latest}

#
# WordPress test instance
#
if [ -z ${WP_CI_DIR} ]; then
    WP_CI_DIR=${5-/tmp/wordpress/}
    export WP_CI_DIR=${WP_CI_DIR}
    echo "export WP_CI_DIR=${WP_CI_DIR}" >> /etc/profile
fi

#
# WordPress test library location
#
if [ -z WP_TESTS_DIR ]; then
    WP_TESTS_DIR=${6-${WP_CI_DIR}wp-content/tests-lib/}
    export WP_TESTS_DIR=${WP_TESTS_DIR}
fi

#
# download $1 and save it to $2
#
download() {
    if [ `which curl` ]; then
        curl -s "$1" > "$2";
    elif [ `which wget` ]; then
        wget -nv -O "$2" "$1"
    fi
}

#
# setting WP_TESTS_TAG variable based on version required
#
if [[ ${WP_VERSION} =~ [0-9]+\.[0-9]+(\.[0-9]+)? ]]; then
	WP_TESTS_TAG="tags/$WP_VERSION"
elif [[ ${WP_VERSION} == 'nightly' || ${WP_VERSION} == 'trunk' ]]; then
	WP_TESTS_TAG="trunk"
else
    #
    # API call to detect latest released version
	# http serves a single offer, whereas https serves multiple. we only want one
	#
	download http://api.wordpress.org/core/version-check/1.7/ /tmp/wp-latest.json
	grep '[0-9]+\.[0-9]+(\.[0-9]+)?' /tmp/wp-latest.json
	LATEST_VERSION=$(grep -o '"version":"[^"]*' /tmp/wp-latest.json | sed 's/"version":"//')
	if [[ -z "$LATEST_VERSION" ]]; then
		echo "Latest WordPress version could not be found"
		exit 1
	fi
	WP_TESTS_TAG="tags/$LATEST_VERSION"
fi

set -ex

#
# Install database
#
install_db() {
    #
	# parse DB_HOST for port or socket references
	#
	local PARTS=(${DB_HOST//\:/ })
	local DB_HOSTNAME=${PARTS[0]};
	local DB_SOCK_OR_PORT=${PARTS[1]};
	local EXTRA=""

	if ! [ -z ${DB_HOSTNAME} ] ; then
		if [ $(echo ${DB_SOCK_OR_PORT} | grep -e '^[0-9]\{1,\}$') ]; then
			EXTRA=" --host=$DB_HOSTNAME --port=$DB_SOCK_OR_PORT --protocol=tcp"
		elif ! [ -z ${DB_SOCK_OR_PORT} ] ; then
			EXTRA=" --socket=$DB_SOCK_OR_PORT"
		elif ! [ -z ${DB_HOSTNAME} ] ; then
			EXTRA=" --host=$DB_HOSTNAME --protocol=tcp"
		fi
	fi

	# create database
	mysqladmin create ${DB_NAME} --user="$DB_USER" --password="$DB_PASS"${EXTRA}
}

#
# Install WordPress test instance
#
install_wp() {

	if [ -d ${WP_CI_DIR} ]; then
		return;
	fi

	mkdir -p ${WP_CI_DIR}

	if [[ ${WP_VERSION} == 'nightly' || ${WP_VERSION} == 'trunk' ]]; then
	    #
	    # Installing nightly build
	    #
		mkdir -p /tmp/wordpress-nightly
		download https://wordpress.org/nightly-builds/wordpress-latest.zip  /tmp/wordpress-nightly/wordpress-nightly.zip
		unzip -q /tmp/wordpress-nightly/wordpress-nightly.zip -d /tmp/wordpress-nightly/
		mv /tmp/wordpress-nightly/wordpress/* ${WP_CI_DIR}
	else
    local ARCHIVE_NAME='latest'
		if [ ${WP_VERSION} == 'latest' ]; then
		    #
		    # Installing latest release
		    #
			ARCHIVE_NAME='latest'
		else
		    #
		    # Installing specified version
		    #
			ARCHIVE_NAME="wordpress-$WP_VERSION"
		fi
		#
		# Downloading WordPress
		#
		download https://wordpress.org/${ARCHIVE_NAME}.tar.gz  /tmp/wordpress.tar.gz
		#
		# Unpacking WordPress
		#
		tar --strip-components=1 -zxmf /tmp/wordpress.tar.gz -C ${WP_CI_DIR}
	fi

    #
	# portable in-place argument for both GNU sed and Mac OSX sed
	#
    local sed_option='-i'
	if [ $(uname -s) == 'Darwin' ]; then
		sed_option='-i .bak'
	fi
	if [ ! -f ${WP_CI_DIR}wp-config.php ]; then
    	cp ${WP_CI_DIR}wp-config-sample.php ${WP_CI_DIR}wp-config.php
		sed ${sed_option} "s:database_name_here:${DB_NAME}:" ${WP_TESTS_DIR}wp-tests-config.php
		sed ${sed_option} "s:username_here:$DB_USER:" ${WP_TESTS_DIR}wp-tests-config.php
		sed ${sed_option} "s:password_here/$DB_PASS:" ${WP_TESTS_DIR}wp-tests-config.php
		sed ${sed_option} "s:localhost:${DB_HOST}:" ${WP_TESTS_DIR}wp-tests-config.php
	fi


    #
    # Downloading mysqli driver for wordpress
    #
	#download https://raw.github.com/markoheijnen/wp-mysqli/master/db.php $WP_CI_DIR/wp-content/db.php
}

#
# Install test suite
#
install_test_suite() {
    #
	# portable in-place argument for both GNU sed and Mac OSX sed
	#
    local sed_option='-i'
	if [ $(uname -s) == 'Darwin' ]; then
		sed_option='-i .bak'
	fi

	#
	# Acquiring actual WP version to get correct test suite
	#
    WP_VERSION=$(cat readme.html | grep Version | sed "s/^\s*<br\s*\/>\s*Version\s*//")
    WP_TESTS_TAG="tags/$WP_VERSION"

    #
	# set up testing suite if it doesn't yet exist
	#
	if [ ! -d ${WP_TESTS_DIR} ]; then
	    #
		# set up testing suite
		#
		mkdir -p ${WP_TESTS_DIR}

		#
		# check out from svn repository wp testing suite
		#
		svn co --quiet https://develop.svn.wordpress.org/${WP_TESTS_TAG}/tests/phpunit/includes/ ${WP_TESTS_DIR}includes
	fi

    #
    # Creating alternative bootstrap, that does not flush database
    # and does not check for WordPress specific test groups
    #
	if [ ! -d ${WP_TESTS_DIR}includes/bootstrap.chayka.php ]; then
	    cp ${WP_TESTS_DIR}includes/bootstrap.php ${WP_TESTS_DIR}includes/bootstrap.chayka.php
		sed ${sed_option} "s:system://system:" ${WP_TESTS_DIR}includes/bootstrap.chayka.php
		sed ${sed_option} "s:_delete_all_posts://_delete_all_posts:" ${WP_TESTS_DIR}includes/bootstrap.chayka.php
		sed ${sed_option} "s:new WP_PHPUnit_Util_Getopt://new WP_PHPUnit_Util_Getopt:" ${WP_TESTS_DIR}includes/bootstrap.chayka.php
    fi

    #
    # setup wp-tests-config.php with db credentials
    #
	if [ ! -f wp-tests-config.php ]; then
		download https://develop.svn.wordpress.org/${WP_TESTS_TAG}/wp-tests-config-sample.php ${WP_TESTS_DIR}wp-tests-config.php
		sed ${sed_option} "s:dirname( __FILE__ ) . '/src/':'${WP_CI_DIR}':" ${WP_TESTS_DIR}wp-tests-config.php
		sed ${sed_option} "s:youremptytestdbnamehere:${DB_NAME}:" ${WP_TESTS_DIR}wp-tests-config.php
		sed ${sed_option} "s:yourusernamehere:$DB_USER:" ${WP_TESTS_DIR}wp-tests-config.php
		sed ${sed_option} "s:yourpasswordhere/$DB_PASS:" ${WP_TESTS_DIR}wp-tests-config.php
		sed ${sed_option} "s:localhost:${DB_HOST}:" ${WP_TESTS_DIR}wp-tests-config.php
	fi

}

#
# Install composer
#
install_composer() {
    if [ ! -f /usr/local/bin/composer ]; then
        download https://getcomposer.org/installer composer-setup.php
        php composer-setup.php
        rm composer-setup.php
        chmod +x composer.phar
        sudo mv composer.phar /usr/local/bin/composer
    fi
    composer --version
}

#
# Install phpunit
#
install_phpunit() {
    if [ ! -f /usr/local/bin/phpunit ]; then
        download https://phar.phpunit.de/phpunit.phar phpunit.phar
        chmod +x phpunit.phar
        sudo mv phpunit.phar /usr/local/bin/phpunit
    fi
    phpunit --version
}

#
# Install Chayka.Core.wpp plugin
#
install_chayka_core() {
    git clone git@github.com:chayka/Chayka.Core.wpp.git ${WP_CI_DIR}wp-content/plugins/Chayka.Core.wpp
    cd $_ && composer install
}


install_composer
install_phpunit

install_wp
install_test_suite
install_db

install_chayka_core
