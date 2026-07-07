#!/usr/bin/env bash
# Creates a release keystore for Google Play signing (run once, store passwords safely).
set -euo pipefail
KEYSTORE="${1:-android/release.keystore}"
ALIAS="${2:-clearpath_cpms}"

if [[ -f "$KEYSTORE" ]]; then
  echo "Keystore already exists: $KEYSTORE"
  exit 1
fi

keytool -genkeypair -v \
  -keystore "$KEYSTORE" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storetype PKCS12

echo ""
echo "Next steps:"
echo "  1. cp android/keystore.properties.example android/keystore.properties"
echo "  2. Fill storePassword and keyPassword in keystore.properties"
echo "  3. npm run cpms:aab"
echo "  4. Upload android/app/build/outputs/bundle/release/app-release.aab to Google Play Console"
