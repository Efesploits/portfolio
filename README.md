# M3FXN — Portfolio

Roblox animator portfolio. Black + purple, fully animated, zero dependencies, zero build step.
Open `index.html` in a browser and it runs.

---

## Adding your stuff

**Everything you edit lives in one file: [`assets/js/data.js`](assets/js/data.js).**
You never need to touch the HTML or CSS.

### 1. Discord link

```js
const SITE = {
  discord: "https://discord.gg/YOURINVITE",   // ← paste it here
```

That single line fills in every Discord button on the page (hero, Discord section,
contact row, mobile menu). Leave it empty and those buttons say "coming soon" instead
of breaking.

### 2. Videos

Each entry in the `WORK` array becomes a card. `type` decides which tab it lands in:

| `type`       | Tab        |
|--------------|------------|
| `"r6"`       | R6 Anims   |
| `"cutscene"` | Cutscenes  |

```js
{
  type: "r6",
  title: "Heavy Sword Combo",
  desc: "Four-hit R6 melee chain with weight-shifted wind-ups.",
  tags: ["Combat", "Moon Animator"],
  duration: "0:12",
  featured: true,           // optional — adds a "Featured" badge
  poster: "media/thumbs/combo.jpg",   // optional
  src: "media/combo.mp4"
}
```

**`src` accepts any of these — just paste the link:**

- Local file — `"media/combo.mp4"` (drop the file in `media/`)
- YouTube — `"https://youtu.be/XXXXXXXXXXX"` or a full `watch?v=` URL
- Streamable — `"https://streamable.com/xxxxxx"`
- Medal — `"https://medal.tv/games/roblox/clips/xxxxx"`
- Any direct `.mp4` / `.webm` URL

Local `.mp4` files also get **hover-to-preview** on the card. YouTube links pull their
thumbnail automatically, so you can skip `poster`.

Leave `src: ""` and the card renders as a clean "Coming soon" slot — the grid still
looks intentional while you're filling it in.

### 3. Text about you

`SITE.roles`, `SITE.skills`, `SITE.tools`, `SITE.counters`, `SITE.process`,
`SITE.perks`, `SITE.contacts` — all plain arrays, all safe to rewrite.

Set `SITE.availability.open = false` when you're booked; the status card turns amber.

### 4. Hero background video (optional)

```js
heroVideo: "media/hero-loop.mp4"
```

Plays muted + looped behind the title at low opacity. Keep it under ~5 MB and
short (5–10 s) so the page still loads fast.

---

## Structure

```
index.html
assets/
  css/style.css     — design system, all styling
  js/data.js        — ← YOUR CONTENT
  js/main.js        — animation + interaction engine
media/              — put videos and thumbnails here
```

---

## Publishing free

**GitHub Pages** — push this repo, then Settings → Pages → Source: `main` / root.
Live at `https://efesploits.github.io/portfolio/` in about a minute.

**Netlify / Vercel** — drag the folder onto the dashboard. No build command, no
output directory. Done.

---

## Notes

- Works offline except for the Google Fonts request; the site falls back to system
  fonts cleanly if it's blocked.
- Respects `prefers-reduced-motion` — all animation is disabled for users who ask for it.
- Keyboard: `Esc` closes the video player, `←` / `→` move between clips.
- Video files over ~25 MB won't fit in a GitHub repo comfortably. For long reels,
  upload to YouTube (unlisted works fine) and paste the link instead.
