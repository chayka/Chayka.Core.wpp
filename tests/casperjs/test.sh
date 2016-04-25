#!/usr/bin/env bash

wpUrl=${1-${WP_CI_URL}}
wpCiPass=${2-${WP_CI_PASS}}
extra=""
if [ ! -z ${PHPCI} ]; then
    extra=" --no-colors"
fi

if [ ! -z ${wpUrl} ]; then
    casperjs test --includes=bootstrap.js --wpUrl=${wpUrl} --wpCiPass=${wpCiPass}${extra} test-*.js
else
    echo "please specify WordPress instance url as param, e.g.: test.sh localhost"
fi