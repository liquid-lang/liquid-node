#!/bin/bash

set -euo pipefail

npm test

if [ "${TRAVIS_NODE_VERSION}" = "4" ] then
  npm run coverage
  npm run lint
else
  echo "Not running coverage and linting..."
fi
