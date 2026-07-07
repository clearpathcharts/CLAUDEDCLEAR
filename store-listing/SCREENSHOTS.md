# CPMS Play Store screenshots

Capture on a **physical Android device** or emulator after `npm run cpms:apk` (debug) or internal-test AAB install.

## Recommended size

- **Phone:** 1080×1920 (9:16) or higher — Play accepts 320px–3840px on the short edge.
- **Feature graphic:** 1024×500 PNG (not a screenshot).

## Five screens to capture

1. **ClearPath home** — Discovery or main terminal with nav visible.
2. **CPMS Library** — `/#CpmsApk` grid with category rows and hero banner.
3. **CPMS TV directory** — `/tv/index.html` channel list with categories.
4. **Live player** — Full-screen HLS playback on a news channel.
5. **Dual nav** — Header showing **CPMS APK** + **CPMS TV** (or CPMS Library link on TV pages).

## How to capture

### Android Studio emulator

1. Run the app on a Pixel-class AVD (API 34+).
2. **View → Tool Windows → Device Manager** → start device.
3. Use the camera icon in the emulator toolbar, or `adb exec-out screencap -p > shot.png`.

### Physical device

- Power + Volume Down (most devices), or developer **Screenshot** in quick settings.

## Feature graphic (required)

Upload **`store-listing/feature-graphic-1024x500.png`** (1024×500) to the same listing page.

Vector source: `store-listing/feature-graphic.svg` (re-export with any SVG tool if you tweak branding).

## Upload

Play Console → **Grow** → **Store presence** → **Main store listing** → **Phone screenshots** + **Feature graphic**.

Paste listing copy from `google-play-en-US.txt`. Full publish walkthrough: `INTERNAL_TESTING.md`.
