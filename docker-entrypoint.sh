#!/usr/bin/env sh

set -eu

echo "Object.defineProperty(exports, '__esModule', { value: true });" >/rerum-imperium/dist/config.js
echo "exports.config = {" >>/rerum-imperium/dist/config.js
echo "    version: '$(cat /version.txt)'," >>/rerum-imperium/dist/config.js

env | while IFS= read -r line; do
  name=${line%%=*}
  value=${line#*=}
  case $name in CFG_*)
    echo "  \"$(echo "$name" | cut -c5-)\": $value," >>/rerum-imperium/dist/config.js
    ;;
  esac
done

echo "};" >>/rerum-imperium/dist/config.js

exec "$@"
