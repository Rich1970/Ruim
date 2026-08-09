#!/usr/bin/env bash
# Bouwt Ruim en werkt de gh-pages branch bij (voor GitHub Pages op /ruim/).
# Gebruik: bash scripts/publish-ghpages.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "› Build (subpad /ruim/)…"
BASE_PATH=/ruim/ npm run build

TMP="$(mktemp -d)"
cp -r dist/* "$TMP/"
touch "$TMP/.nojekyll"

echo "› gh-pages bijwerken…"
git worktree add -q "$TMP/ghp" --detach || true
cd "$TMP/ghp"
git checkout -q --orphan gh-pages || git checkout -q gh-pages
find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} + 2>/dev/null || true
cp -r "$TMP"/*.html "$TMP"/assets "$TMP"/*.png "$TMP"/*.svg "$TMP"/*.webmanifest "$TMP"/*.js "$TMP"/.nojekyll . 2>/dev/null || true
git add -A
git commit -q -m "Deploy Ruim to GitHub Pages" || echo "geen wijzigingen"
git push -f origin gh-pages
cd - >/dev/null
git worktree remove "$TMP/ghp" --force || true
rm -rf "$TMP"
echo "✓ Gepubliceerd. Live op https://rich1970.github.io/ruim/ (zodra Pages aanstaat)."
