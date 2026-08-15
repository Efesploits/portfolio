/* ════════════════════════════════════════════════════════════════
   M3FXN — SITE CONTENT
   ────────────────────────────────────────────────────────────────
   This is the ONLY file you need to edit to update the site.
   Everything below feeds the page automatically.

   ▸ To add the Discord link  →  set SITE.discord
   ▸ To add a video           →  add an entry to WORK (see guide at
                                 the bottom of this file)
   ════════════════════════════════════════════════════════════════ */

const SITE = {
  name: "M3FXN",
  role: "Roblox Animator",

  /* ── DISCORD ──────────────────────────────────────────────────
     Fills every Discord button on the page. */
  discord: "https://discord.gg/VSzWJwdQX",

  /* Optional hero background video (muted loop behind the title).
     e.g. "media/hero-loop.mp4" — leave "" for the animated canvas only. */
  heroVideo: "",

  /* Rotating words in the hero */
  roles: [
    "R6 combat",
    "cinematic cutscenes",
    "movement kits",
    "weapon sets",
    "emotes & idles",
    "trailer sequences"
  ],

  /* Availability card in the About section */
  availability: {
    open: true,
    title: "Commissions open",
    sub: "Currently taking new projects"
  },

  /* Small stat row under the hero CTAs */
  heroStats: [
    { value: "4+",   label: "Years animating" },
    { value: "200+", label: "Animations delivered" },
    { value: "R6",   label: "Rig specialist" },
    { value: "24H",  label: "Avg. reply time" }
  ],

  /* Big animated counters at the bottom of About.
     `value` counts up; add `suffix` for +, %, K etc. */
  counters: [
    { value: 200, suffix: "+", label: "Animations shipped" },
    { value: 40,  suffix: "+", label: "Games & clients" },
    { value: 4,   suffix: " yrs", label: "In Moon Animator" },
    { value: 100, suffix: "%",  label: "Hand-keyed" }
  ],

  /* Scrolling marquee strip under the hero */
  marquee: [
    "R6 Animation", "Cutscenes", "Moon Animator", "Blender",
    "Combat Systems", "Camera Work", "Roblox Studio", "Trailer Edits"
  ],

  /* About → Specialities panel */
  skills: [
    { title: "R6 combat & impact",  desc: "Swings, parries, hit reactions, ragdoll-ready recoveries." },
    { title: "Movement kits",       desc: "Idle, walk, sprint, crouch, dash, jump — full loop sets." },
    { title: "Cinematic cutscenes", desc: "Camera language, staging, timing and edit-ready sequences." },
    { title: "Weapon & prop work",  desc: "Guns, blades, tools — grip-accurate, recoil that reads." },
    { title: "Emotes & personality",desc: "Dances, taunts, idles with actual character in them." }
  ],

  /* About → Toolkit chips */
  tools: [
    "Moon Animator 2", "Roblox Studio", "Blender", "After Effects",
    "Photoshop", "DaVinci Resolve", "Luau", "R6 / R15 rigs"
  ],

  /* Process section */
  process: [
    { title: "Brief & quote",  text: "You send the rig, references and shot list. I come back with a fixed price, a slot and a delivery date. No surprises later." },
    { title: "Blockout pass",  text: "Key poses and timing first, sent as a preview clip. This is where we lock the feel — changes here are free and fast." },
    { title: "Polish pass",    text: "Spacing, arcs, overlap, follow-through, secondary motion. The part that separates a good animation from a stiff one." },
    { title: "Delivery",       text: "Tested in Studio, clean keyframes, correct hierarchy, uploaded and documented. Revisions included until it's right." }
  ],

  /* Discord section perks */
  perks: [
    "WIP clips before anything goes public",
    "Commission slots announced there first",
    "Animation breakdowns & tips",
    "Free R6 rigs and reference packs"
  ],

  /* Contact buttons — add/remove freely.
     icon: "discord" | "mail" | "link" | "youtube" | "twitter" */
  contacts: [
    { label: "Discord",  value: "Join the server", icon: "discord", href: "" },
    { label: "Email",    value: "Send a brief",    icon: "mail",    href: "" },
    { label: "YouTube",  value: "Full reel",       icon: "youtube", href: "" }
  ]
};


/* ════════════════════════════════════════════════════════════════
   WORK — your videos
   ════════════════════════════════════════════════════════════════
   type:  "r6"  → R6 Anims tab
          "cutscene" → Cutscenes tab

   src:   any ONE of these works, just paste it in —
          • local file ....... "media/fight-combo.mp4"
          • YouTube .......... "https://youtu.be/XXXXXXXXXXX"
          • YouTube ......... "https://www.youtube.com/watch?v=XXXXXXXXXXX"
          • Streamable ....... "https://streamable.com/xxxxxx"
          • Medal ............ "https://medal.tv/games/roblox/clips/xxxxx"
          • Discord CDN mp4 .. "https://cdn.discordapp.com/attachments/.../clip.mp4"
          Leave "" and the card shows a clean "Coming soon" slot.

   poster: thumbnail image ("media/thumbs/x.jpg"). Optional —
           YouTube links auto-pull their thumbnail, and empty
           entries get a generated purple placeholder.

   featured: true → shows a "Featured" badge.
   ──────────────────────────────────────────────────────────────── */

const WORK = [

  /* ─────────────  R6 ANIMATIONS  ───────────── */
  {
    type: "r6",
    title: "Heavy Sword Combo",
    desc: "Four-hit R6 melee chain with weight-shifted wind-ups and a finisher that actually lands.",
    tags: ["Combat", "Moon Animator"],
    duration: "0:12",
    featured: true,
    poster: "",
    src: ""
  },
  {
    type: "r6",
    title: "Movement Kit — Full Set",
    desc: "Idle, walk, run, sprint, crouch and dash. Seamless loops, tested in Studio.",
    tags: ["Movement", "Loops"],
    duration: "0:24",
    poster: "",
    src: ""
  },
  {
    type: "r6",
    title: "Gunplay Set",
    desc: "Draw, aim, fire, reload and holster with recoil that reads at 60 FPS.",
    tags: ["Weapons", "FPS"],
    duration: "0:18",
    poster: "",
    src: ""
  },
  {
    type: "r6",
    title: "Parry & Counter",
    desc: "Reactive defence animation — clash frame, stagger, punish window.",
    tags: ["Combat", "Reactions"],
    duration: "0:09",
    poster: "",
    src: ""
  },
  {
    type: "r6",
    title: "Emote Pack",
    desc: "Six personality emotes built to loop cleanly and read from a distance.",
    tags: ["Emotes", "Personality"],
    duration: "0:30",
    poster: "",
    src: ""
  },
  {
    type: "r6",
    title: "Knockback & Ragdoll Recovery",
    desc: "Impact, air-time, ground contact and a get-up that blends back into idle.",
    tags: ["Impact", "Physics"],
    duration: "0:07",
    poster: "",
    src: ""
  },

  /* ─────────────  CUTSCENES  ───────────── */
  {
    type: "cutscene",
    title: "Game Intro Sequence",
    desc: "Full opening cinematic — camera choreography, staging, lighting and edit.",
    tags: ["Cinematic", "Camera"],
    duration: "1:05",
    featured: true,
    poster: "",
    src: ""
  },
  {
    type: "cutscene",
    title: "Boss Reveal",
    desc: "Slow push-in, silhouette reveal and an impact beat cut on the drop.",
    tags: ["Cinematic", "Trailer"],
    duration: "0:38",
    poster: "",
    src: ""
  },
  {
    type: "cutscene",
    title: "Story Dialogue Scene",
    desc: "Two-character shot-reverse-shot with body acting and lip-sync timing.",
    tags: ["Story", "Acting"],
    duration: "0:52",
    poster: "",
    src: ""
  },
  {
    type: "cutscene",
    title: "Trailer Cut",
    desc: "Beat-matched action edit built from original animation, no stock.",
    tags: ["Trailer", "Edit"],
    duration: "0:44",
    poster: "",
    src: ""
  }
];
