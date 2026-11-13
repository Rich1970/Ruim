#!/usr/bin/env bash
# Maakt van snelbel.html (de bron) de losse website in snelbel/site/.
set -euo pipefail
cd "$(dirname "$0")"
{
cat <<'H'
<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1257c9">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style>
H
grep -v 'claude:viewport-fit-sides' snelbel.html | sed '/^<\/style>$/{
a </head>\
<body>
}'
cat <<'F'
<script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});</script>
</body>
</html>
F
} > site/index.html
