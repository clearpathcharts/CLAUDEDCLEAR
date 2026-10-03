# Channel API setup — ClearPath Marketing Console

You do **not** need every API before shipping education posts.
ClearPath hosts the video file; **Telegram + Discord** can send it today.

In the live console open **API Keys** for the same checklist.

## Do this order

| # | Channel | Difficulty | Env vars |
|---|---------|------------|----------|
| 1 | Telegram | Easy | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| 2 | Discord | Easy | `DISCORD_WEBHOOK_URL` |
| 3 | YouTube | Medium | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` |
| 4 | Reddit | Medium | `REDDIT_*` |
| 5 | Facebook | Hard (App Review) | `META_APP_ID`, `META_APP_SECRET`, `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN` |
| 6 | Instagram | Hard (Business + Review) | `META_IG_USER_ID` + same page token |
| 7 | LinkedIn | Hard (product approval) | `LINKEDIN_*` |
| 8 | TikTok | Hard (audit) | `TIKTOK_*` when adapter lands |
| — | **MySpace** | **Impossible now** | none — site read-only since 2024, old APIs dead |

## MySpace (important)

There is **no working MySpace posting API** in 2026. The site has been read-only; developer.myspace.com / OpenSocial are gone. Do not pay for fake “MySpace API” packages. If they relaunch a real API later, we add an adapter then.

## Telegram (fastest win)

1. Telegram → `@BotFather` → `/newbot` → copy token  
2. Add bot as admin on your channel/group  
3. Chat id = `@yourchannel` or numeric id  
4. Set on Cloud Run only — if a token was ever pasted in chat, `/revoke` and make a new one  

## YouTube

1. Google Cloud Console → enable **YouTube Data API v3**  
2. Create OAuth client; consent screen; get a **refresh token** with `youtube.upload`  
3. Set the three env vars; ClearPath uploads default to **unlisted**  
4. Optional — file upload already works for Telegram/Discord without YouTube  

## Facebook + Instagram (Meta)

1. [developers.facebook.com](https://developers.facebook.com) → Business app  
2. Facebook Page + Instagram Professional linked  
3. Permissions: `pages_manage_posts`, `instagram_content_publish`  
4. **App Review** before production — until then channel stays “bridge”  
5. Never mark the UI “Connected” until tokens work and review is approved  

## Where to put secrets

Cloud Run → `clearpath-automation-console` → Edit & deploy → Variables & secrets.  
Never commit tokens. Never paste live bot tokens into chat.
