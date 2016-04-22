#!/usr/bin/env bash

wpUrl=${1-${WP_CI_URL}}
extra=""
if [ ! -z ${PHPCI} ]; then
    extra=" --no-colors"
fi

if [ ! -z ${wpUrl} ]; then
    casperjs test --includes=bootstrap.js --wpUrl=${wpUrl}${extra} test-*.js
else
    echo "please specify WordPress instance url as param, e.g.: test.sh localhost"
fi