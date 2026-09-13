# Explain Mode — Google Flow scripts

One **30–45 second** film per nav pill. People who do not yet understand the site tap **Need extra understanding**, then the little play badge beside a tab.

## How to produce

1. Open Google Flow (Veo). Aspect **16:9**. Quiet educational motion.
2. Generate **four shots** per tab (Flow still likes ~8–10 seconds each).
3. Stitch them in numbered order to the listed target length.
4. Record the **continuous narration** once over the stitch. Calm adult voice. About 130–140 words per minute.
5. Export H.264 MP4 at 1280×720 or 1920×1080.
6. Drop the file at `public/explain-videos/{id}.mp4`. Optional poster `{id}.jpg`. Captions `{id}.vtt` (this script can write them).

**Look:** ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens.

**Never on screen:** No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.

These films are extra explanation, not trading advice. ClearPath is not a broker.

---

## CEO — CEO dashboard

| | |
|---|---|
| Slot / filename | `ceo.mp4` |
| Accent | `#FF2E9A` |
| Length | **40 seconds** |
| Logline | Founder-only ops — Daily Ops, backups, members. Not on your chart. |
| Music | Very low analog pad, no beat drop. Room tone. Leave space after each sentence. |
| Captions | Burn-in optional. Prefer a matching .vtt so reduced-motion users can read. |

### Continuous narration (record once)

> This tab is CEO — the founder console. Only the person who runs ClearPath sees it. Daily Ops is a calm checklist for the site, marketing, and the end of the day. Site Doctor shows whether the platform is healthy. Members holds invites, account lists, and a disaster backup download, because Cloud Run forgets files when a container restarts. Choose Your Path still opens the four study desks. Nothing here changes anyone else’s charts, and nothing here is a trade. If you do not see CEO, you are not supposed to.

_91 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 40-second quiet tour of a magenta founder console labeled CEO Dashboard. Camera glides from the glowing header, across a Daily Ops checklist and a calm Site Doctor pulse, then a Members table with a disaster-backup download, then four Choose Your Path study-desk cards. Educational, private, never a trading floor. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-console · 0–10s · Founder console

On-screen super (optional, ≤6 words): **Founder console**

**VO on this shot:** This tab is CEO — the founder console. Only the person who runs ClearPath sees it.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Opening shot: dark #09090b terminal. Magenta #FF00FF header reads “CEO Dashboard — Founder Console” with a soft glow, not a rave. Slow push-in past glass panels. No other people. Private ops room energy. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-daily-ops · 10–20s · Daily Ops and Site Doctor


**VO on this shot:** Daily Ops is a calm checklist for the site, marketing, and the end of the day. Site Doctor shows whether the platform is healthy.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Daily Ops desk: checklist groups labeled Site, Marketing, Outreach, Business, Personal, End of day — human checkboxes, no gamified streaks. Cut to Site Doctor — Hourly Pulse with calm green / amber / red dots. Serious, slow, readable type. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-members-backup · 20–30s · Members and backup


**VO on this shot:** Members holds invites, account lists, and a disaster backup download, because Cloud Run forgets files when a container restarts.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Members / All Users table on glass: email column, display name, joined date — no password strings visible. Soft highlight on a teal button “Download disaster backup”. Tiny readable note: Cloud Run disk is ephemeral. Trust-first, never panic red. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-desks-close · 30–40s · Study desks, then still

On-screen super (optional, ≤6 words): **Not a trading desk**

**VO on this shot:** Choose Your Path still opens the four study desks. Nothing here changes anyone else’s charts, and nothing here is a trade. If you do not see CEO, you are not supposed to.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Choose Your Path row: Institutional, Fundamental, Retail, Neurodivergent — study-desk cards, not brokerage tickets. Pull back to the full CEO console. End on stillness. Soft caption energy: Founder ops. Not a trading desk. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

## HOME — Home

| | |
|---|---|
| Slot / filename | `home.mp4` |
| Accent | `#6C5CE7` |
| Length | **40 seconds** |
| Logline | The front door. Every glowing card is a real door. |
| Music | Warm low drone, faint vinyl air. No percussion hits on card highlights. |
| Captions | Keep supers to the card names already on screen. Do not add slogan bursts. |

### Continuous narration (record once)

> This is Home — the front door of ClearPath Trader. The greeting is just a map. Every glowing card is a real door: Charts, INDACREATOR, Y.W.C., News, Education, Memberships, and C.P.T. Buddy. Choose Your Path opens four study desks — Institutional, Fundamental, Retail, and Neurodivergent. Those desks show information. They do not place trades. Read the line under a card, then tap when you are ready. You can always come back here from the top nav. Home is a map, not a to-do list, and not a broker.

_88 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 40-second walk through ClearPath Home: lava-soft dark hub, a quiet greeting, Choose Your Path desk cards, then a grid of doors labeled Charts, INDACREATOR, Y.W.C., News, Education, Memberships, C.P.T. Buddy. One card highlights. Nothing feels like a to-do list or a store. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-hub · 0–10s · What Home is

On-screen super (optional, ≤6 words): **Every card is a door**

**VO on this shot:** This is Home — the front door of ClearPath Trader. The greeting is just a map.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. HOME / Discovery hub fills the frame — dark glass, pink/orange/cyan lava blurs in the corners, a badge “ClearPath Home”, a short greeting. Uncluttered. Slow establishing move, no text overload. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-choose-path · 10–20s · Choose Your Path


**VO on this shot:** Choose Your Path opens four study desks — Institutional, Fundamental, Retail, and Neurodivergent. Those desks show information. They do not place trades.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Choose Your Path row: three path cards plus a Neurodivergent banner. Labels: Institutional Trader, Fundamental Trader, Retail Trader, Neurodivergent Traders. Soft cyan outlines. Educational study energy — no order tickets, no “start trading now”. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-grid · 20–30s · Nav cards


**VO on this shot:** Every glowing card is a real door: Charts, INDACREATOR, Y.W.C., News, Education, Memberships, and C.P.T. Buddy.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Camera glides across hub tiles: Charts, INDACREATOR, Y.W.C., News, Board, ClearPath Education, Memberships, C.P.T. Personal Buddy. Each tile has a one-line subtitle. Soft accent glows. One tile gently highlights. Calm click, no urgency. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-choose · 30–40s · Read, then choose

On-screen super (optional, ≤6 words): **Take your time**

**VO on this shot:** Read the line under a card, then tap when you are ready. You can always come back here from the top nav. Home is a map, not a to-do list, and not a broker.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Soft focus ring on the line under the Charts card, then a gentle tap hint. Brief peek toward the Charts workspace, then a reversible return to the Home grid. End still. Quiet. Map, not a checklist. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

## Y.W.C. — Y.W.C. — Your World Connected

| | |
|---|---|
| Slot / filename | `ywc.mp4` |
| Accent | `#FF2E9A` |
| Length | **42 seconds** |
| Logline | News, magazines, and a chart on one lava desk — a workspace, not signals. |
| Music | Soft analog warmth, slightly pink. No news-stinger brass. |
| Captions | Do not put “BREAKING” on screen. Section chip names are enough. |

### Continuous narration (record once)

> Y.W.C. means Your World Connected. It is one lava desk for news sections, magazines, and a live chart so you are not jumping between apps. Use the section chips — World, Sports, Finance, Magazines, Relief — one at a time. Expand a story to read it. Your personal chart stays nearby. Media Pantry and social tools are optional. This is a workspace, not a signal service. Some feeds here are editorial. The News tab is the live wire. When the noise rises, leave. The chart will still be here.

_89 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 42-second tour of Your World Connected: warm lava-pink glass desk, section chips, a story reader, a personal chart tucked on the side, optional Media Pantry. Inclusive, calm, never a signal service or panic newsroom. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-desk · 0–10s · What Y.W.C. is

On-screen super (optional, ≤6 words): **Your World Connected**

**VO on this shot:** Y.W.C. means Your World Connected. It is one lava desk for news sections, magazines, and a live chart so you are not jumping between apps.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Y.W.C. lava-styled desk — magenta #FF0080 and orange #FF4500 glass bentos, brand mark “Your World Connected”. Warm community energy without noise. Inclusive, calm. A quiet live chart peeks at the edge. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-filters · 10–21s · Section chips


**VO on this shot:** Use the section chips — World, Sports, Finance, Magazines, Relief — one at a time.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Section filter chips highlight one at a time: ALL NEWS, WORLD SPORTS, WORLD HUB, RELIEF / HUMANITARIAN, GLOBAL FINANCE, CRYPTO, MAGAZINE EDITS. Soft selection. No clutter pile-up. Readable labels on dark glass. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-reader-chart · 21–32s · Story and chart


**VO on this shot:** Expand a story to read it. Your personal chart stays nearby.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A hero story card opens into a calm reader modal. Then focus shifts to YwcPersonalCharts — a live educational chart nestled in the desk, soft cyan crosshair, no trade arrows. Context and price structure share one screen. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-optional · 32–42s · Optional extras, then leave

On-screen super (optional, ≤6 words): **Leave when it is loud**

**VO on this shot:** Media Pantry and social tools are optional. This is a workspace, not a signal service. Some feeds here are editorial. The News tab is the live wire. When the noise rises, leave. The chart will still be here.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Brief, quiet look at CPMS Media Pantry and optional social connect chips — labeled as optional, no notification spam. Pull back to the full lava desk. Soft fade. End on stillness. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

## INDACREATOR — INDACREATOR

| | |
|---|---|
| Slot / filename | `indacreator.mp4` |
| Accent | `#00E5FF` |
| Length | **42 seconds** |
| Logline | A Pine workshop. Compile honestly. Apply when you are ready. |
| Music | Clean digital bed, very quiet. A single soft confirmation tone on compile — not a fanfare. |
| Captions | Show real UI words: Compile, Apply to All Charts, River Genie. No “signals unlocked”. |

### Continuous narration (record once)

> INDACREATOR is the workshop for indicator code — sometimes still called The River. Upload a Pine file, paste code, or start with the Gold Bar example. Press compile. If something cannot run, you will see a real error, not a fake overlay. Read the honest limits and the inputs. River Genie can draft or fix a script, but you still choose when to apply. Apply to All Charts puts the study on your charts. Then open CHARTS to look at it. This studio does not place trades. Compile first. Apply when you are ready.

_94 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 42-second studio tour: code editor and chart side by side on dark glass, an upload zone, a compile glow, honest-limits cards, River Genie on the right, then a calm overlay appearing on charts. Technical and empowering. Not a hacker movie. Not a signal service. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-studio · 0–10s · What it is

On-screen super (optional, ≤6 words): **A studio, not a signal**

**VO on this shot:** INDACREATOR is the workshop for indicator code — sometimes still called The River.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. INDACREATOR workstation establishing shot — code editor and chart side by side on #050505 glass, cyan #00D9FF accents. Technical, empowering, not flashy hacker tropes. Title readable: INDACREATOR. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-upload-compile · 10–21s · Upload and compile


**VO on this shot:** Upload a Pine file, paste code, or start with the Gold Bar example. Press compile. If something cannot run, you will see a real error, not a fake overlay.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Upload / paste / drag-drop zone for a .pine file highlights. A small file icon drops into the editor. Compile button soft-press; cyan success glow; an inputs panel and honest notes appear. No confetti. If showing failure, show a calm line-numbered error — never a fake overlay. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-genie · 21–32s · River Genie


**VO on this shot:** Read the honest limits and the inputs. River Genie can draft or fix a script, but you still choose when to apply.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. River Genie co-pilot panel on the right — a short chat drafting Pine in a code block, then a quiet path back to compile. Helpful, not pushy. Honest-limits bento cards visible: what River can and cannot do. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-apply · 32–42s · Apply, then study

On-screen super (optional, ≤6 words): **Compile first**

**VO on this shot:** Apply to All Charts puts the study on your charts. Then open CHARTS to look at it. This studio does not place trades. Compile first. Apply when you are ready.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Apply to All Charts — gold-quiet CTA, not neon hard-sell. Indicator overlays fade onto a chart. Chart remains the focus. End still on the workstation. Soft line: compile first, apply when ready. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

## CHARTS — Charts

| | |
|---|---|
| Slot / filename | `charts.mp4` |
| Accent | `#FF7B00` |
| Length | **44 seconds** |
| Logline | Live market structure, comfort profiles, study tools — not a broker. |
| Music | Almost silent. A distant room tone. Let candle motion be the only rhythm. |
| Captions | If a candle is labeled, say “one block of time” — never “buy this”. |

### Continuous narration (record once)

> This is Charts — ClearPath’s live market desk. Each candle is one block of time. Search a symbol. Pick a timeframe. Neuro-Adaptive Profiles change colors, spacing, and motion so different brains can read the same data more comfortably. They never change the price. Pattern Scanner and drawing tools are for study. Blackout Mode hides extra chrome when you want a quieter dual-chart view. The footer is clear: visualization, not advice. ClearPath is not a broker. Start with Calm Focus if you are unsure. Take your time.

_86 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 44-second educational tour of the MARKET TERMINAL: multi-slot candlesticks on dark glass, a neuro-profile picker cycling looks while price structure stays identical, a timeframe bar, pattern tools labeled as study, then a quieter Blackout dual-chart. No signal arrows. Footer legal energy without shouting. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-terminal · 0–11s · What Charts is

On-screen super (optional, ≤6 words): **Study, not brokerage**

**VO on this shot:** This is Charts — ClearPath’s live market desk. Each candle is one block of time.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Wide shot of MARKET TERMINAL — multi-slot candlestick charts on dark glass, orange timeframe accents. Educational market structure, no signal arrows, no P&L. Soft establishing push. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-symbol-time · 11–22s · Symbol and timeframe


**VO on this shot:** Search a symbol. Pick a timeframe.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Focus ring on symbol search “Search your chart…”, then on the timeframe bar from 1m toward YTD. Calm pointer. Candles redraw after a timeframe change. Quiet, technical, no flashing CTAs. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-neuro · 22–33s · Neuro-Adaptive Profiles


**VO on this shot:** Neuro-Adaptive Profiles change colors, spacing, and motion so different brains can read the same data more comfortably. They never change the price.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Close on Neuro-Adaptive Chart Profiles picker. Softly cycle three looks — Calm Focus cyan, Low Stimulation muted gray, Standard red/green — while the same price structure stays identical. Presentation-only. No medical imagery. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-tools-blackout · 33–44s · Study tools and Blackout

On-screen super (optional, ≤6 words): **Profiles never change prices**

**VO on this shot:** Pattern Scanner and drawing tools are for study. Blackout Mode hides extra chrome when you want a quieter dual-chart view. The footer is clear: visualization, not advice. ClearPath is not a broker. Start with Calm Focus if you are unsure. Take your time.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Left rail: Pattern Scanner and drawing tools, labeled as study tools not advice. Then UI chrome softens into Blackout Mode — dual charts, quieter chrome, more chart area. End on a still candle silhouette and a tiny legal-footer feel: visualization, not advice. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

## NEWS — News

| | |
|---|---|
| Slot / filename | `news.mp4` |
| Accent | `#4D6FFF` |
| Length | **36 seconds** |
| Logline | The live wire. If the vendor is down, the list stays empty. |
| Music | None, or a faint paper-room tone. No news-music stabs. |
| Captions | Do not invent a real headline on screen. Use generic placeholder titles. |

### Continuous narration (record once)

> News is the live reading wire. The header tells you if it is live, empty, or offline. Honest status beats fake urgency. Each card shows source, category, date, title, and a short description. Refresh when you want a fresh pull. Open a headline to read the publisher. If the vendor is down, ClearPath leaves the list empty. We never invent a story. Headlines are context, not instructions. Skim, then close the tab.

_72 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 36-second walk through a dark-terminal news wire: honest status pill, a Refresh control, readable headline cards with source · category · date, then a brief empty-state that tells the truth. Serious journalism energy, never breaking-news panic. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-wire · 0–9s · What News is

On-screen super (optional, ≤6 words): **Live wire**

**VO on this shot:** News is the live reading wire.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. News feed UI on a dark terminal — clean headlines, timestamps, soft cyan/blue rules. Header: News · Live wire. Serious journalism energy, not panic red or sirens. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-status · 9–18s · Honest status


**VO on this shot:** The header tells you if it is live, empty, or offline. Honest status beats fake urgency. Refresh when you want a fresh pull.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Header status pill shows “12 items”, then calmly “Empty”, then “Offline” — no red sirens. Refresh control highlights; last-updated stamp visible. Soft press animation. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-cards · 18–27s · How to read a card


**VO on this shot:** Each card shows source, category, date, title, and a short description. Open a headline to read the publisher.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Headline list scrolls slowly: source · category · date · title · short description. Readable typography. One headline soft-focuses as if opening externally. Stay calm. No tab-explosion montage. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-empty · 27–36s · Empty is honest

On-screen super (optional, ≤6 words): **Context, not orders**

**VO on this shot:** If the vendor is down, ClearPath leaves the list empty. We never invent a story. Headlines are context, not instructions. Skim, then close the tab.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Honest empty state on glass: “News feed unavailable” / headlines are never fabricated. Return to a still headline list. Soft fade. No crisis colors. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

## MEMBERSHIPS — Memberships

| | |
|---|---|
| Slot / filename | `memberships.mp4` |
| Accent | `#FFE600` |
| Length | **38 seconds** |
| Logline | Read the plan sheet. Checkout is off. This is not a store right now. |
| Music | Soft gold air. No cash-register hits. |
| Captions | Do not put dollar amounts on screen. The live product has billing removed. |

### Continuous narration (record once)

> Memberships is the plan sheet. Public checkout is off, so looking at this tab does not charge a card. Compare what each tier includes — charts, indicators, education, INDACREATOR, blackout, and more. Accuracy dots tell you what is enforced versus still on the sheet. Affiliate rewards, if you have them, show as discount or credit. Upgrade only if a feature clearly helps you learn. This tab is not investment advice, and it is not a store right now. Take your time, then go back to the desk.

_87 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 38-second calm walk across a gold-outlined membership sheet: billing-off banner, a comparison table of feature rows, Basic through Platinum, no prices flashing, no countdown. Decision energy without pressure. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-sheet · 0–9s · What it is

On-screen super (optional, ≤6 words): **Checkout is off**

**VO on this shot:** Memberships is the plan sheet. Public checkout is off, so looking at this tab does not charge a card.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Memberships layout on glass — gold #FFD700 outlines, emerald shield hero. Banner energy that billing is removed / education and charts only. Calm decision room. No flashing timers. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-table · 9–19s · Compare rows


**VO on this shot:** Compare what each tier includes — charts, indicators, education, INDACREATOR, blackout, and more. Accuracy dots tell you what is enforced versus still on the sheet.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Slow pan across a comparison table: charts per window, indicators, drawing tools, neuro layouts, blackout, education, encyclopedia, IndaCreator. Accuracy dots are quiet and readable. No FOMO badges, no “most popular” explosions. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-tiers · 19–29s · Tiers without pressure


**VO on this shot:** Affiliate rewards, if you have them, show as discount or credit. Upgrade only if a feature clearly helps you learn.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Pan across Basic, Silver, Gold, Platinum column headers. Basic highlighted as already useful. No list prices. No checkout button pulsing. Soft gold light only. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-leave · 29–38s · Leave when ready

On-screen super (optional, ≤6 words): **Take your time**

**VO on this shot:** This tab is not investment advice, and it is not a store right now. Take your time, then go back to the desk.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Still comparison layout. Soft “Back to the desk” control. End card energy: not advice, not a store right now. Fade out. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

## Explain on — Need extra understanding

| | |
|---|---|
| Slot / filename | `explain.mp4` |
| Accent | `#00E5FF` |
| Length | **36 seconds** |
| Logline | Turn the play badges on. Short clips, plain words, one quiet question. |
| Music | Soft cyan shimmer, then silence under the overlay shot. |
| Captions | Show the real labels: Need extra understanding / Explain on. |

### Continuous narration (record once)

> This pill says Need extra understanding. Tap it once and it becomes Explain on. Small play badges appear next to every tab. Tap a badge to open a short cinema overlay — a Google Flow clip, plain words, and one quiet quiz question. If a clip is not uploaded yet, you will see a storyboard, not a fake video. This is extra explanation for people who want a slower walkthrough. It is not trading advice. Tap the pill again to hide the badges. You can leave Explain on as long as it helps.

_93 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 36-second how-to for Explain Mode: the top-nav pill “Need extra understanding” becomes “Explain on”, tiny YouTube-style play badges appear beside tab pills, a cinema overlay opens with a 16:9 stage, plain text, and one quiz. Missing clip shows a storyboard frame, never a fake video. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-toggle · 0–9s · The pill

On-screen super (optional, ≤6 words): **Explain on**

**VO on this shot:** This pill says Need extra understanding. Tap it once and it becomes Explain on.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Desktop ClearNav primary row. A cyan-outlined pill with a tiny play-rectangle icon reads “Need extra understanding”. A calm tap. The pill becomes “Explain on” with a soft cyan fill. No other motion. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-badges · 9–18s · Play badges


**VO on this shot:** Small play badges appear next to every tab.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Tiny play-badge icons fade in beside HOME, Y.W.C., INDACREATOR, CHARTS, NEWS, MEMBERSHIPS — matching each pill’s color. Slow pan. Educational, not a row of ads. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-overlay · 18–27s · The cinema overlay


**VO on this shot:** Tap a badge to open a short cinema overlay — a Google Flow clip, plain words, and one quiet quiz question. If a clip is not uploaded yet, you will see a storyboard, not a fake video.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A cinema-style overlay: dark blur backdrop, 16:9 stage with film-corner brackets, title “How Charts works”, a short paragraph, and a Quick check question. Quiet. Then a matching empty stage that says the clip is coming — storyboard, not a fake player. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-off · 27–36s · Leave it on or off

On-screen super (optional, ≤6 words): **Optional, not advice**

**VO on this shot:** This is extra explanation for people who want a slower walkthrough. It is not trading advice. Tap the pill again to hide the badges. You can leave Explain on as long as it helps.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Return to the nav. The pill toggles back toward “Need extra understanding” and badges fade. End still on the cyan play icon. Soft, optional, never required. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

## PROFILE — Profile

| | |
|---|---|
| Slot / filename | `profile.mp4` |
| Accent | `#FF2E9A` |
| Length | **38 seconds** |
| Logline | Your account space. Identity, not an order ticket. |
| Music | Quiet pink pad. Intimate, not glamorous. |
| Captions | Do not show a real email or password field filled in. |

### Continuous narration (record once)

> Profile is your account space — how you appear on ClearPath. Set a display name, a public handle for a /u/ link if you want one, a bio, and an avatar or cover. Social links and password live here too. You can keep the profile private. Saving settings does not place a trade. If you use a broker connect panel, that is your licensed broker — ClearPath does not hold your money. Update only what you want others to see. Then head back to Home or Charts.

_87 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 38-second respectful tour of a private profile control room: avatar sidebar, display name, handle, bio, save confirmation. Pink accents. No public-leaderboard flex. No trade blotter. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-room · 0–9s · What Profile is

On-screen super (optional, ≤6 words): **Your account space**

**VO on this shot:** Profile is your account space — how you appear on ClearPath.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Profile / biography control room — avatar sidebar, calm form fields, pink #FF1493 accents. Private, respectful, simple. Title energy: your account space. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-fields · 9–19s · What you can edit


**VO on this shot:** Set a display name, a public handle for a /u/ link if you want one, a bio, and an avatar or cover. Social links and password live here too.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Fields highlight in turn: display name, profile URL / handle, Instagram type, publish status, bio. Avatar and banner upload controls soft-glow. Gentle file-pick hint. No celebrity montage. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-save · 19–29s · Save and privacy


**VO on this shot:** You can keep the profile private. Saving settings does not place a trade.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Save Profile Settings press; soft confirmation. A short readable compliance note. Publish status sits on Private. Quiet. No confetti. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-broker-leave · 29–38s · Broker note, then leave

On-screen super (optional, ≤6 words): **Not an order ticket**

**VO on this shot:** If you use a broker connect panel, that is your licensed broker — ClearPath does not hold your money. Update only what you want others to see. Then head back to Home or Charts.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A small Broker Connect panel labeled as an external licensed broker — ClearPath is the interface, not the custodian. Then a soft handoff back toward Home / Charts. Still fade. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

## AFFILIATE — Affiliate

| | |
|---|---|
| Slot / filename | `affiliate.mp4` |
| Accent | `#FF2E9A` |
| Length | **40 seconds** |
| Logline | Your /r/ code when you are ready. Referrals, not market payouts. |
| Music | Low lava warmth. No trap beat, no cash sound. |
| Captions | Show /r/CODE as a generic pattern, not a real member code. |

### Continuous narration (record once)

> Affiliate is the referral desk. Private accounts get a personal /r/ code. The link stays dormant until you accept the Affiliate Program Agreement. Then you can copy a share URL. The ledger shows signups, discount or credit, and badge progress in plain numbers. The sidebar cockpit has extra rooms — feeds, guilds, ranks, compliance. Those are extras. This is not a brokerage payout from the market, and it does not place anyone’s trades. Activate only when you are ready to share calmly.

_82 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 40-second trust-first tour of the Affiliate terminal: a dormant then live share URL, an agreement activate control, plain metric numbers, a lava sidebar of extra rooms. No get-rich imagery. No yacht. No “passive income” stamp. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-desk · 0–10s · What it is

On-screen super (optional, ≤6 words): **Referral desk**

**VO on this shot:** Affiliate is the referral desk. Private accounts get a personal /r/ code.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Affiliate Network dashboard — share URL, gentle rewards ladder, lava-orange #ff5a1f and pink glass, dark #0a0c16. Trust-first. No get-rich imagery, no cars, no yachts. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-activate · 10–20s · Agreement, then copy


**VO on this shot:** The link stays dormant until you accept the Affiliate Program Agreement. Then you can copy a share URL.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Affiliate Program Agreement activate control highlights. Link visually “DORMANT” until accepted, then “LIVE”. Copy share link button soft-press; brief “copied” confirmation. No fireworks. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-ledger · 20–30s · Plain numbers


**VO on this shot:** The ledger shows signups, discount or credit, and badge progress in plain numbers.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Metrics row: referral code, share URL, month signups, discount or credit, badge progress — calm numbers, no slot-machine spin. Education-first caption energy. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-cockpit · 30–40s · Extras, then still

On-screen super (optional, ≤6 words): **Share calmly**

**VO on this shot:** The sidebar cockpit has extra rooms — feeds, guilds, ranks, compliance. Those are extras. This is not a brokerage payout from the market, and it does not place anyone’s trades. Activate only when you are ready to share calmly.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Sidebar cockpit chips: Desk Feed, Guilds, Live Rooms, Chart Desks, Ranks, Compliance, Settings — overview only. Pull back to the still affiliate desk. Trust-first end card. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

## CLEARPATH CINEMA — ClearPath cinema

| | |
|---|---|
| Slot / filename | `cinema.mp4` |
| Accent | `#00E5FF` |
| Length | **38 seconds** |
| Logline | In-terminal theater. Direct streams. Not a buy-room. |
| Music | Soft theatre hush. A distant projector air. No trailer-voice boom. |
| Captions | Player chrome only. No fake “live P&L” overlay on the film. |

### Continuous narration (record once)

> ClearPath Cinema is the in-terminal theater. Browse category shelves. Start a featured title or pick a thumbnail. Videos play in ClearPath’s own player — seek, volume, fullscreen — using direct streams, not a YouTube embed. Continue Watching keeps recent titles close. If a live stream is down, the player says so. Founder media tools stay out of the way. Choose one title, watch with full attention, then return to Charts or Education. These are product and education clips, not a room that tells you what to buy.

_87 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 38-second cinema tour: amber italic CLEARPATH CINEMA header, category shelves, a featured play, an in-app player with seek and fullscreen, Continue Watching. Theatre dark. No YouTube chrome. No live trading chat. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-library · 0–9s · What Cinema is

On-screen super (optional, ≤6 words): **In-terminal theater**

**VO on this shot:** ClearPath Cinema is the in-terminal theater. Browse category shelves.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. ClearPath Cinema library — amber italic header, pantry shelf of titles, soft ambient cyan/amber. Large video-stage energy. Dark theatre, not a brokerage. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-pick · 9–19s · Pick a title


**VO on this shot:** Start a featured title or pick a thumbnail.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Featured hero soft-highlights Play. Thumbnail shelves wait below — Finance TV, Indicator TV style rows. A+/A− text scale controls visible. Calm browsing. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-player · 19–29s · The player


**VO on this shot:** Videos play in ClearPath’s own player — seek, volume, fullscreen — using direct streams, not a YouTube embed. If a live stream is down, the player says so.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Full in-app player — seek bar, volume, fullscreen. Direct stream / HLS feel. No YouTube iframe chrome. If showing an error, a calm “Live stream temporarily unavailable” on glass. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-continue · 29–38s · One title, then return

On-screen super (optional, ≤6 words): **Watch, then return**

**VO on this shot:** Continue Watching keeps recent titles close. Founder media tools stay out of the way. Choose one title, watch with full attention, then return to Charts or Education. These are product and education clips, not a room that tells you what to buy.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Continue Watching row. Tiny note that Media Cabinet is founder tooling. Still player fading to black with soft cyan residual. End. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

## CLEARPATH EDUCATION — ClearPath education

| | |
|---|---|
| Slot / filename | `education.mp4` |
| Accent | `#00E5FF` |
| Length | **42 seconds** |
| Logline | Schools, units, lessons, a short quiz — then the libraries if you want depth. |
| Music | Warm educator piano, very low. No level-up chime that sounds like a slot. |
| Captions | School names on cards are enough. No “you are now a trader” stamp. |

### Continuous narration (record once)

> ClearPath Education is structured learning. Pick a school — Crypto, Stocks, Forex, and more. Open an unlocked unit. Read the lessons like a calm textbook. At the end, a short quiz checks understanding. Passing unlocks the next unit. Progress is saved. Passing does not mean you should trade. It means you understood that page. From here you can also open three libraries: Encyclopedia of Finance, Encyclopedia of Indicators, and Literacy OS. One unit at a time. Then come back when you want the next door.

_85 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 42-second educator’s tour: school grid on dark glass, a unit list with lock/unlock, a lesson reader, a gentle quiz pass, then three library doors — Encyclopedia of Finance, Encyclopedia of Indicators, Literacy OS. Warm, academic, no streak pressure. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-schools · 0–10s · What Education is

On-screen super (optional, ≤6 words): **One school at a time**

**VO on this shot:** ClearPath Education is structured learning. Pick a school — Crypto, Stocks, Forex, and more.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. ClearPath Education school grid on dark #0A0E14 glass — Crypto, Stocks, Forex, Futures, Commodities, Bonds, Options, Funds, Indices, Economic Indicators. Cyan headings. Warm educator presence. No gamified streak rings. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-unit · 10–21s · Units and lessons


**VO on this shot:** Open an unlocked unit. Read the lessons like a calm textbook.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Open a school into a unit list with lock/unlock and pass states shown calmly. Then a lesson reader with breadcrumb navigation and comfortable reading typography. Soft page turn. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-quiz · 21–31s · Quiz, not a license


**VO on this shot:** At the end, a short quiz checks understanding. Passing unlocks the next unit. Progress is saved. Passing does not mean you should trade. It means you understood that page.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. QuizEngine — one simple question, a teal check on pass, a gentle unlock glow on the next unit. Not a slot machine. Academic warmth. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-libraries · 31–42s · Three libraries

On-screen super (optional, ≤6 words): **Study, then rest**

**VO on this shot:** From here you can also open three libraries: Encyclopedia of Finance, Encyclopedia of Indicators, and Literacy OS. One unit at a time. Then come back when you want the next door.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Three desk cards: Encyclopedia of Finance, Encyclopedia of Indicators, Literacy OS. Soft cyan outlines. Return to the school grid. Soft fade. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

## EXIT — Exit

| | |
|---|---|
| Slot / filename | `exit.mp4` |
| Accent | `#FF4D4D` |
| Length | **32 seconds** |
| Logline | One tap signs you out of ClearPath. Nothing else. |
| Music | None. A single soft door-close air at the end, not a slam. |
| Captions | Red is the brand of the pill, not an emergency. Keep it quiet. |

### Continuous narration (record once)

> EXIT is the red pill on the second nav row. It signs you out of your ClearPath session. It does not close a broker account you connected elsewhere. It does not delete your profile. It does not place a last trade. Tap it when you are done for now. Next visit, sign in again from the usual door. If you only wanted another tab, use Home or Charts instead. EXIT means leave this session — calmly, completely, and only for this site.

_82 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 32-second calm explanation of the red EXIT pill on the second nav row: it signs out of this session only. It does not close a broker, delete a profile, or place a last trade. End on a still signed-out door, not a slam. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-pill · 0–8s · Find EXIT

On-screen super (optional, ≤6 words): **EXIT**

**VO on this shot:** EXIT is the red pill on the second nav row.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Secondary ClearNav row on black: PROFILE, AFFILIATE, CLEARPATH CINEMA, CLEARPATH EDUCATION, then a red-outlined pill EXIT with a small logout icon. Slow push to the red pill. No alarm strobe. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-what-it-does · 8–16s · What it does


**VO on this shot:** It signs you out of your ClearPath session.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A calm tap on EXIT. The terminal chrome fades toward a signed-out door / login greeting. No data-shred animation. No skull icons. Quiet. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-what-it-does-not · 16–24s · What it does not


**VO on this shot:** It does not close a broker account you connected elsewhere. It does not delete your profile. It does not place a last trade.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Three quiet glass cards fade in: does not close a broker account / does not delete your profile / does not place a last trade. Readable. Then they fade. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-choose · 24–32s · Leave or stay

On-screen super (optional, ≤6 words): **Only this session**

**VO on this shot:** Tap it when you are done for now. Next visit, sign in again from the usual door. If you only wanted another tab, use Home or Charts instead. EXIT means leave this session — calmly, completely, and only for this site.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. If the pointer hesitates, HOME and CHARTS pills glow softly as the alternative. Then EXIT remains. End still. Calm, complete, only this site. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

## Literacy OS — Literacy OS

| | |
|---|---|
| Slot / filename | `literacy.mp4` |
| Accent | `#00E5FF` |
| Length | **40 seconds** |
| Logline | A personal market-science desk. Rooms for notes, sources, and study. |
| Music | Dawn-cyan air. Slow. |
| Captions | Room chip names on screen are the lesson. |

### Continuous narration (record once)

> Literacy OS is your personal market-science desk. Morning Brief is a gentle landing — it shows what you have archived, not what you must do. Use the room chips to move. Thesis Vault holds your theses. Concept Wiki holds ideas in plain language. Source Sentinel helps you notice page changes. Other rooms wait until you need them — media, listening, pins, Pattern Studio. This is education only. Archive what you learn before you chase a new tab.

_77 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 40-second walk through Literacy OS: Morning Brief stats, room chips, Thesis Vault and Concept Wiki, a peek at Source Sentinel. Education lab, not brokerage. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-brief · 0–10s · What it is

On-screen super (optional, ≤6 words): **Learning desk**

**VO on this shot:** Literacy OS is your personal market-science desk. Morning Brief is a gentle landing — it shows what you have archived, not what you must do.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Literacy OS desk establishing shot — “ClearPath Literacy OS / Market science for learners”. Morning Brief with quiet stats for vault, lessons, sentinel, wiki. Soft dawn-cyan light. Education lab, not brokerage. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-rooms · 10–20s · Room chips


**VO on this shot:** Use the room chips to move.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Tab chips highlight: Thesis Vault, Concept Wiki, Source Sentinel, Neuro LMS, Media Pantry, Listen→Learn. Soft selection. Not overwhelming. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-vault-wiki · 20–30s · Vault, Wiki, Sentinel


**VO on this shot:** Thesis Vault holds your theses. Concept Wiki holds ideas in plain language. Source Sentinel helps you notice page changes.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Thesis Vault notes, then Concept Wiki cards, then Source Sentinel page-diff view. Calm archival energy. Lab aesthetic. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-more · 30–40s · More rooms, then still

On-screen super (optional, ≤6 words): **Patience first**

**VO on this shot:** Other rooms wait until you need them — media, listening, pins, Pattern Studio. This is education only. Archive what you learn before you chase a new tab.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Quick calm montage: Media Pantry, Listen→Learn, Idea Pins, Pattern Studio, Encyclopedia bridge. Soft dissolves. Return to Morning Brief. Fade. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

## Encyclopedia of Finance — Encyclopedia of finance

| | |
|---|---|
| Slot / filename | `encyclopedia.mp4` |
| Accent | `#00E5FF` |
| Length | **40 seconds** |
| Logline | A calm file-browser for markets. Teaching pages, not a buy list. |
| Music | Library hush. Distant page air. |
| Captions | Do not stamp “10,000 issuers verified”. Teaching library only. |

### Continuous narration (record once)

> The Encyclopedia of Finance is ClearPath’s deep knowledge library — a calm file-browser for markets. The left sidebar is your index. Pick one topic. Choose a reading level — Beginner through Economist — so the same idea can meet you where you are. You will see an article or a lab in the main stage. Open the Scholar Tutor only when a term still feels foggy. Cards are teaching pages, not a researched list of every company on earth. One topic, one level, then step back.

_86 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 40-second library tour: glass shelves, a left sidebar of topics, Beginner through Economist tabs, a long-form article, a Scholar Tutor corner. Academic, not flashy. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-library · 0–10s · What it is

On-screen super (optional, ≤6 words): **Study library**

**VO on this shot:** The Encyclopedia of Finance is ClearPath’s deep knowledge library — a calm file-browser for markets.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Encyclopedia of Finance — glass library shelves with soft cyan index labels. Academic, cinematic, not flashy. Establishing wide shot. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-sidebar · 10–20s · Index and level


**VO on this shot:** The left sidebar is your index. Pick one topic. Choose a reading level — Beginner through Economist — so the same idea can meet you where you are.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Left sidebar topics: Home, Markets, Stocks, Forex, Crypto, Economy, Labs, Glossary. Then pedagogy tabs: Beginner / Trader / Analyst / Economist — soft underline selection. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-article · 20–30s · Article or lab


**VO on this shot:** You will see an article or a lab in the main stage.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Main article / lab surface with a back/exit HUD. Readable long-form. Brief calm peek at a lab labeled education only. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-tutor · 30–40s · Tutor, then leave

On-screen super (optional, ≤6 words): **Depth without overwhelm**

**VO on this shot:** Open the Scholar Tutor only when a term still feels foggy. Cards are teaching pages, not a researched list of every company on earth. One topic, one level, then step back.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. ClearPath Scholar Tutor slide-out — plain-English Q&A. Quiet helper, not a hype bot. Return to sidebar + article. Soft fade. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

## Encyclopedia of Indicators — Encyclopedia of indicators

| | |
|---|---|
| Slot / filename | `indicators.mp4` |
| Accent | `#00E5FF` |
| Length | **38 seconds** |
| Logline | What a study is, how to read it, what it cannot promise. |
| Music | Quiet teal tone. Technical, not hype. |
| Captions | SVG chart illustrations only — no fake live videos on the cards. |

### Continuous narration (record once)

> The Encyclopedia of Indicators explains chart studies — RSI, moving averages, and more — with a picture, a formula, how to read it, and typical settings. Use the left filters to search or pick a category. Open a card for the study article. A live-overlay badge means that model can sit on Charts. An indicator describes past price. It does not promise the next move. Overlaying a study still does not place a trade. Read the limitations. Then go back to the terminal desktop.

_84 words._

### Master Flow prompt

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. A 38-second directory tour: filter rail, SVG indicator cards, a detail article with formula and limitations, a live-overlay badge that still is not a trade. Teal #00FFD1. Honest. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 01-grid · 0–9s · What it is

On-screen super (optional, ≤6 words): **Studies of past price**

**VO on this shot:** The Encyclopedia of Indicators explains chart studies — RSI, moving averages, and more — with a picture, a formula, how to read it, and typical settings.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Encyclopedia of Indicators card grid on a dark directory — teal #00FFD1 accents, standard SVG chart illustrations, no videos. Establishing shot. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 02-filters · 9–19s · Filters


**VO on this shot:** Use the left filters to search or pick a category.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Left rail: search, category chips, max complexity slider, live-overlay toggle, sort. Soft, readable, not a slot panel. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 03-article · 19–28s · Open a card


**VO on this shot:** Open a card for the study article. A live-overlay badge means that model can sit on Charts. An indicator describes past price. It does not promise the next move.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Detail panel: description, formula, how to read, limitations, typical settings. Live overlay badge if chart-addable. Academic. Honest limitations paragraph in focus. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

### Shot 04-back · 28–38s · Back to the desk

On-screen super (optional, ≤6 words): **Describe, do not order**

**VO on this shot:** Overlaying a study still does not place a trade. Read the limitations. Then go back to the terminal desktop.

```
ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens. Back to Terminal Desktop control. Optional soft handoff toward Charts with an overlay already on — still no order ticket. Fade. Avoid: No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.
```

---

Education-family extras (not top-nav pills, but same player): Literacy OS, Encyclopedia of Finance, Encyclopedia of Indicators.
