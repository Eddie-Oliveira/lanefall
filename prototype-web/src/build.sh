set -e
cat engine.js ai.js ui.js > /tmp/lanefall-all.js
node --check /tmp/lanefall-all.js
{ cat shell.html; echo '<script>'; cat engine.js ai.js ui.js; echo '</script>'; } > lanefall.html
wc -c lanefall.html
