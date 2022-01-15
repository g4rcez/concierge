yarn build
APP="xpto"
mkdir -p "/tmp/concierge/$APP"
VERSION="$1"
echo "{ \"route\": \"$APP\", \"origin\": \"$APP\", \"version\": \"$VERSION\", \"roles\": [\"\"], \"disabled\": false, \"hotReload\": true, \"type\": \"orchestrator\", \"bundler\": \"viteRollup\" }" >"/tmp/concierge/$APP/config.json"

mv dist "/tmp/concierge/$APP/$VERSION"
