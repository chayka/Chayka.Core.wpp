#!/usr/bin/env bash

wpUrl=${1-${WP_CI_URL}}

if [ ! -z ${wpUrl} ]; then
    casperjs test --includes=bootstrap.js --wpUrl=${wpUrl} test-*.js
else
    echo "please specify WordPress instance url as param, e.g.: test.sh localhost"
fi