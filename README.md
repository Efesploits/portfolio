# M3FXN — Portfolio

Roblox animator portfolio. Black + purple, fully animated, zero dependencies, zero build step.
Open `index.html` in a browser and it runs.

---

## Auto-sync from Discord

Post a clip in **#past-works** and it shows up on the site — no editing anything.

A GitHub Action runs every 3 hours, reads that channel, and writes what it finds
into `assets/data/work.json`, which the site loads on page load. Videos posted
there become cards automatically: the thumbnail is the clip's own first frame and
the duration badge is read off the file.

### One-time setup (about 5 minutes)

**1 — Make a bot.** Go to [discord.com/developers/applications](https://discord.com/developers/applications)
→ **New Application** → name it anything → **Bot** tab → **Reset Token** → copy it.

> Keep that token private. Don't paste it into chat, a file, or this repo — it goes
> straight into GitHub Secrets in step 3.

**2 — Turn on Message Content Intent.** Still on the **Bot** tab, scroll to
*Privileged Gateway Intents* and switch on **Message Content Intent**.
Without this Discord returns empty messages and the sync finds nothing.

**3 — Store the token.** In this repo: **Settings → Secrets and variables → Actions
→ New repository secret**. Name it exactly `DISCORD_BOT_TOKEN` and paste the token
as the value.

**4 — Invite the bot.** In the Developer Portal: **OAuth2 → URL Generator** →
tick scope **`bot`** → tick permissions **View Channels** and **Read Message History**
→ open the generated URL → add it to your server. Make sure it can actually see
#past-works.

**5 — Point it at the channel.** In Discord: **Settings → Advanced → Developer Mode**
on. Right-click **#past-works → Copy Channel ID**, then paste it into
[`scripts/sync-config.json`](scripts/sync-config.json):

```json
"channelId": "1234567890123456789"
```

That's it. Pushing that change kicks off the first sync. You can also force one
anytime from the **Actions** tab → *Sync Discord clips* → **Run workflow**.

### Sorting clips into the right tab

The sync reads hashtags in your message:

| You post | Where it lands |
|---|---|
| `#cutscene` (or `#cinematic`, `#trailer`, `#intro`) | **Cutscenes** tab |
| `#r6`, `#combat`, `#movement`, `#emote`, `#weapon` | **R6 Anims** tab |
| no hashtag | R6 Anims (change `defaultType` in the config) |

Anything else you tag — `#sword`, `#parry` — becomes a filter chip on the card.
Add `#featured` for the purple Featured badge.

The **first line** of your message becomes the card title, and any following lines
become the description. Post nothing but the video and it falls back to a tidied-up
version of the filename.

```
Heavy Sword Combo #r6 #combat #featured
Four-hit chain with weight-shifted wind-ups.
```

YouTube, Streamable and Medal links pasted into the channel get picked up too.

### One thing to know about Discord links

Discord attachment URLs are signed and expire after about 24 hours. That's fine —
the sync runs every 3 hours and rewrites them with fresh ones, so they never go
stale. If a link does die between runs, the card falls back to a placeholder
instead of showing a broken player.

If you'd rather the videos live permanently in the repo, set `"mode": "download"`
in `scripts/sync-config.json`. The Action then downloads each clip into
`media/discord/` and commits it, so nothing ever expires. Tradeoff: repo size.
Clips over `downloadMaxMB` (default 40) stay hotlinked.

> GitHub disables scheduled Actions on repos with no activity for 60 days. The sync
> commits regularly so this shouldn't trigger, but if the clips ever stop updating,
> check the **Actions** tab for a "re-enable workflow" button.

The sync also publishes to GitHub Pages itself once it has committed. That's
deliberate: a push made by an Action doesn't trigger other workflows, so
`static.yml` would never see the sync commit and the live site would fall behind
the repo.

---

## Editing by hand

**Everything else lives in one file: [`assets/js/data.js`](assets/js/data.js).**
You never need to touch the HTML or CSS.

Synced Discord clips and manual entries coexist: manual entries with a real `src`
stay pinned at the front of the grid, and the placeholder slots disappear once real
clips arrive.

### 1. Discord link

```js
const SITE = {
  discord: "https://discord.gg/VSzWJwdQX",
```

That single line fills in every Discord button on the page (hero, Discord section,
contact row, mobile menu).

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
  css/style.css       — design system, all styling
  js/data.js          — ← YOUR CONTENT
  js/main.js          — animation + interaction engine
  data/work.json      — generated by the Discord sync, don't edit
scripts/
  sync-discord.mjs    — the sync itself
  sync-config.json    — ← channel ID goes here
.github/workflows/
  sync-discord.yml    — runs the sync every 3 hours
media/                — manual videos and thumbnails
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
