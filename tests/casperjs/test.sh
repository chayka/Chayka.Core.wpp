#!/usr/bin/env bash

wpUrl=${1-${WP_CI_URL}}
wpCiPass=${2-${WP_CI_PASS}}

extra=""
if [ ! -z ${PHPCI} ]; then
    extra=" --no-colors"
fi

if [ ! -z ${wpUrl} ]; then
    casperjs test --includes=bootstrap.js --wpUrl=${wpUrl} --wpCiPass="${wpCiPass}"${extra} test-*.js
else
    echo "usage: ./test.sh WP_INSTANCE_URL [DEFAULT_USER_PASSWORD]"
fi