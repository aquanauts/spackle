#!/usr/bin/env bash

set -euo pipefail

timestamp=$(date +%s)
APP_DIR=deploy/$timestamp/spackle

if [[ -d "$APP_DIR" ]]; then
    echo "$APP_DIR should not exist! I give up."
    exit 1
fi

mkdir -p "$APP_DIR"

git clone https://github.com/aquanauts/spackle.git "$APP_DIR"

cd "$APP_DIR"

make test

# Start the new instance, which will stop the old instance
./run
