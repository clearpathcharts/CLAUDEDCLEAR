# Google Play — Internal Testing walkthrough

Step-by-step guide for publishing **ClearPath CPMS** (`com.clearpath.cpms`) to **Internal testing** before production.

---

## Prerequisites

| Item | Command / value |
|------|-----------------|
| Google Play Developer account | [play.google.com/console](https://play.google.com/console) — one-time $25 fee |
| Release AAB | `npm run cpms:aab` → `android/app/build/outputs/bundle/release/app-release.aab` |
| Keystore | `npm run cpms:keystore` → copy `android/keystore.properties.example` → `keystore.properties` |
| Privacy URL | `https://clearpathtrader.com/privacy.html` |
| Listing copy | `store-listing/google-play-en-US.txt` |
| Feature graphic | `store-listing/feature-graphic-1024x500.png` |
| Screenshots | See `store-listing/SCREENSHOTS.md` |

---

## 1. Create the app (first time only)

1. Open [Google Play Console](https://play.google.com/console).
2. **Create app** → App name: **ClearPath CPMS**.
3. Declarations: app is **not** primarily for children; comply with policies.
4. **Dashboard** → complete required **App content** and **Policy** tasks before you can publish any track.

---

## 2. App content (required before release)

Complete each item under **Policy and programs** → **App content**:

### Privacy policy

- URL: `https://clearpathtrader.com/privacy.html`

### App access

- If all features work without login: **All functionality is available without restrictions**.
- If Firebase cabinet requires founder login: note that **premium publishing** requires sign-in; core TV + library browsing works without account.

### Ads

- Select **No, my app does not contain ads** (unless you add ads later).

### Content rating

- Start **Questionnaire** → category **News** or **Reference**.
- Suggested answers (adjust if your build differs):
  - Violence: None
  - Sexuality: None
  - Language: Infrequent / mild (third-party live streams may vary)
  - Controlled substances: None
  - Gambling: No
  - User interaction: Yes (optional account)
  - Location sharing: No
- Submit → apply rating to all countries.

### Target audience

- **18+** or **not designed for children** (finance/educational news content).

### News app (if prompted)

- Declare as news/media app if Google asks (CPMS TV streams live news).

### Data safety

- **Data collected:** Email, User IDs (only if Firebase Auth is enabled).
- **Purpose:** Account functionality.
- **Encrypted in transit:** Yes.
- **Data not sold.**

### Store listing (minimum for testing)

**Grow** → **Store presence** → **Main store listing**:

| Field | Value |
|-------|-------|
| App name | ClearPath CPMS |
| Short description | From `google-play-en-US.txt` |
| Full description | From `google-play-en-US.txt` |
| App icon | 512×512 PNG — export from `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (upscale if needed) |
| Feature graphic | Upload `store-listing/feature-graphic-1024x500.png` |
| Phone screenshots | 2–8 images per `SCREENSHOTS.md` |

---

## 3. Set up signing in Play Console

**Release** → **Setup** → **App integrity**:

1. **Play App Signing:** Opt in (recommended). Google holds the app signing key; you upload with an upload key.
2. Your local `keystore.properties` upload key must match the certificate of the AAB you upload.

If you lose the upload keystore, you must reset it in Console (painful). Back up `android/cpms-release.keystore` securely.

---

## 4. Create Internal testing release

1. **Release** → **Testing** → **Internal testing**.
2. **Create new release**.
3. **Upload** `app-release.aab`.
4. Release name: e.g. `1.0.0 (10001)` — match `versionName` / `versionCode` in `android/app/build.gradle`.
5. Release notes (testers see this):

   ```
   ClearPath CPMS 1.0.0 — Internal test
   • CPMS Library (HLS video archive)
   • CPMS TV (live news channel directory)
   • Terminal navigation between modes
   ```

6. **Save** → **Review release** → **Start rollout to Internal testing**.

Internal track review is usually **minutes**, not days.

---

## 5. Add testers

1. **Internal testing** → **Testers** tab.
2. **Create email list** → add Gmail addresses (max 100 for internal).
3. Copy the **opt-in link** and send to testers.
4. Each tester must:
   - Open the opt-in link on their Android device (signed into that Google account).
   - Accept testing invitation.
   - Install from Play Store (not sideload the AAB).

---

## 6. Device verification checklist

On a physical phone (recommended):

| # | Test | Pass? |
|---|------|-------|
| 1 | App installs from Play internal link | ☐ |
| 2 | **CPMS APK** nav opens media library | ☐ |
| 3 | Tap a library video → HLS plays | ☐ |
| 4 | **Launch CPMS TV** → channel directory loads | ☐ |
| 5 | Play a live channel → video starts (some URLs may be geo-blocked) | ☐ |
| 6 | **← CLEARPATH TERMINAL** returns to main app | ☐ |
| 7 | **CPMS LIBRARY** link on TV page works | ☐ |
| 8 | Privacy footer link opens `privacy.html` | ☐ |

Capture screenshots during this pass for the store listing.

---

## 7. Promote to Closed / Open / Production

When internal testing passes:

1. **Internal testing** → **Promote release** → **Closed testing** (optional QA group).
2. Then **Open testing** (public beta) or **Production**.
3. Production review can take **1–7 days** (sometimes longer for new developer accounts).

Increment `versionCode` for every new upload:

```gradle
// android/app/build.gradle
versionCode 10002
versionName "1.0.1"
```

---

## 8. CI alternative (GitHub Actions)

Workflow `.github/workflows/cpms-play-release.yml` can build a signed AAB when secrets are set:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Download the artifact from Actions and upload manually to Play Console, or wire **Play Developer API** later for automated upload.

---

## 9. After first production publish

1. Update any “coming soon” copy on `public/tv/download.html` if needed.
2. Play Store URL (live after publish):

   `https://play.google.com/store/apps/details?id=com.clearpath.cpms`

3. Optional: enable **Pre-registration** or **Production** country rollout gradually (staged %).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Upload rejected: version code already used | Bump `versionCode` in `build.gradle`, rebuild AAB |
| Signing certificate mismatch | Same keystore as first upload; check `keystore.properties` |
| “You need to complete app content” | Finish Dashboard checklist (privacy, rating, data safety) |
| Streams won’t play on device | Cleartext + INTERNET in manifest; test URL in Chrome on same network |
| Blank WebView | Run `npm run build && npm run cap:sync` before `cpms:aab` |
| Firebase library empty | Deploy rules + `npm run cpms:seed -- --force` |

---

## Quick command reference

```bash
# One-time signing setup
npm run cpms:keystore
# Edit android/keystore.properties

# Production bundle for Play Console
npm run cpms:aab

# Output path
ls -la android/app/build/outputs/bundle/release/app-release.aab
```
