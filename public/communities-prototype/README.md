# ClearPath Trader Communities - static prototype

Plain HTML/CSS/JS. No build step, no libraries, no network requests (icons are inline SVG, avatars are CSS initials).

Run: `python3 -m http.server 8765` in this folder, then open `http://localhost:8765/`. Opening `index.html` directly from disk also works.

## Pages

- `index.html` - reskinned chat UI (Chats, Updates, Communities, Calls) with the magma "WHATEVER GROUP THERE IN" widget floating over it. Tapping "Open group chat" in the widget opens that group in the chat UI.
- `widget.html` - the widget alone on black, linked to and from the chat page.

## Files

- `css/chat.css`, `js/chat.js` - chat UI skin and behavior.
- `css/widget.css`, `js/widget.js` - draggable widget (pointer events, works with mouse and touch).
- `licenses/` - original MIT license files, unchanged.

## Brand palette

Deep Black `#050505` background, Neon Cyan `#00E5FF` primary, Hot Pink `#FF1493` secondary, Neon Purple `#9D00FF` tertiary, Neon Indigo `#4B0082`, Molten Lava Orange `#FF5A1F`. Gradient: cyan, purple, hot pink. The widget uses magma red `#FF2A00` / `#E8230A` with a red glow.

## Original sources (MIT)

- WhatsApp UI Clone (New UI): Fully Responsive and Interactive, by Kuldeep Rajput - https://codepen.io/Kuldeep-Rajput-the-sasster/pen/azvJMWm - `licenses/LICENSE-whatsapp-ui-clone.txt`
- Facebook Share (Messenger draggable), by zagzter - https://codepen.io/zagzter/pen/ggWmBE - `licenses/LICENSE-messenger-draggable.txt`

## Changes from the originals

- All WhatsApp, Meta and Messenger/Facebook branding, logos, names and remote images removed; ClearPath community wording and sample trader data added.
- Chat UI: Deep Black + brand palette skin, gradient active states and outgoing bubbles, desktop tab bar, empty state, working send box, chat search, Communities list.
- Widget: renamed, oval/pill shapes, magma red with glow, jQuery/jQuery UI/iframe replaced by vanilla pointer-event drag and a local preview panel.
