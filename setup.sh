#!/bin/bash
# Run this after cloning to decompress the large dist files
set -e
echo "Setting up FFX Platform..."

# Decompress server bundle
if [ -f dist/index.cjs.gz ]; then
  gunzip -f dist/index.cjs.gz
  echo "  ✓ dist/index.cjs restored"
fi

# Decompress frontend bundle
if [ -f dist/public/assets/index-BpzWBTTq.js.gz ]; then
  gunzip -f dist/public/assets/index-BpzWBTTq.js.gz
  echo "  ✓ dist/public/assets/index-BpzWBTTq.js restored"
fi

echo ""
echo "Done! Install deps with: npm install"
echo "Start server with: NODE_ENV=production node dist/index.cjs"
