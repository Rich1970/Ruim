#!/usr/bin/env bash
# Bouwt de Android-app (snelbel.apk) zonder Gradle. Nodig: Android SDK (platform 34 + build-tools 35.0.0) en een sleutelbestand.
# Gebruik: SNELBEL_KEYSTORE=/pad/snelbel.jks SNELBEL_KEYPASS=... bash android/build.sh
set -euo pipefail
cd "$(dirname "$0")"
SDK="${ANDROID_HOME:-/opt/android}"; BT="$SDK/build-tools/35.0.0"; JAR="$SDK/platforms/android-34/android.jar"
OUT="$(mktemp -d)"; VC="$(( $(date +%s) / 60 - 29000000 ))"; VN="1.$(date +%y%m%d.%H%M)"
# de pagina van de app: zelfde bron als de website, zonder online lettertypen
mkdir -p "$OUT/assets"
{
  printf '<!doctype html>\n<html lang="nl">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<style>body{margin:0}[hidden]{display:none!important}</style>\n'
  grep -v -e 'claude:viewport-fit-sides' -e 'fonts.googleapis.com' ../snelbel.html | sed '/^<\/style>$/{
a </head>\
<body>
}'
  printf '</body>\n</html>\n'
} > "$OUT/assets/index.html"
"$BT/aapt2" compile --dir res -o "$OUT/res.zip"
"$BT/aapt2" link -o "$OUT/base.apk" -I "$JAR" --manifest AndroidManifest.xml -A "$OUT/assets" --java "$OUT/gen" \
  --min-sdk-version 29 --target-sdk-version 34 --version-code "$VC" --version-name "$VN" "$OUT/res.zip"
mkdir -p "$OUT/classes" "$OUT/dex"
javac -nowarn --release 11 -cp "$JAR" -d "$OUT/classes" $(find src "$OUT/gen" -name '*.java') 2>&1 | grep -v 'JAVA_TOOL_OPTIONS' || true
"$BT/d8" --lib "$JAR" --min-api 29 --output "$OUT/dex" $(find "$OUT/classes" -name '*.class') 2>&1 | grep -v 'JAVA_TOOL_OPTIONS' || true
(cd "$OUT/dex" && zip -q -j "$OUT/base.apk" classes.dex)
"$BT/zipalign" -f -p 4 "$OUT/base.apk" "$OUT/aligned.apk"
"$BT/apksigner" sign --ks "$SNELBEL_KEYSTORE" --ks-pass "pass:$SNELBEL_KEYPASS" --out "${1:-$OUT/snelbel.apk}" "$OUT/aligned.apk" 2>&1 | grep -v 'JAVA_TOOL_OPTIONS' || true
echo "klaar: ${1:-$OUT/snelbel.apk} (versie $VN)"
