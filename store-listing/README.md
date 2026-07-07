# ClearPath CPMS — Google Play store listing kit

Everything needed to publish **com.clearpath.cpms** on Google Play.

| File | Use |
|------|-----|
| [google-play-en-US.txt](./google-play-en-US.txt) | Copy-paste listing text into Play Console |
| [feature-graphic-1024x500.png](./feature-graphic-1024x500.png) | **Feature graphic** upload (1024×500) |
| [feature-graphic.svg](./feature-graphic.svg) | Editable vector source for the banner |
| [SCREENSHOTS.md](./SCREENSHOTS.md) | Which screens to capture and how |
| [INTERNAL_TESTING.md](./INTERNAL_TESTING.md) | Full Internal → Production publish walkthrough |

## Fast path

```bash
npm run cpms:keystore    # once
npm run cpms:aab         # builds app-release.aab
```

Then follow **INTERNAL_TESTING.md** from step 4.
