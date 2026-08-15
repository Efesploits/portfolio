#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   Discord → site sync
   ───────────────────────────────────────────────────────────────────────
   Reads the #past-works channel and writes every video it finds into
   assets/data/work.json, which the site loads at runtime.

   Run by .github/workflows/sync-discord.yml every few hours.
   No npm dependencies — Node 20's built-in fetch only.

   Needs:  DISCORD_BOT_TOKEN  (GitHub Actions secret)
           channelId          (scripts/sync-config.json)
   ═══════════════════════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';

const ROOT   = process.cwd();
// strip a BOM — Windows editors love adding one, and JSON.parse chokes on it
const CFG    = JSON.parse(readFileSync(path.join(ROOT, 'scripts/sync-config.json'), 'utf8').replace(/^﻿/, ''));
const TOKEN  = process.env.DISCORD_BOT_TOKEN;
const API    = 'https://discord.com/api/v10';
const OUT    = path.join(ROOT, 'assets/data/work.json');

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(?:$|\?)/i;
// hosted players, plus any bare link that points straight at a video file
// (someone pasting a cdn.discordapp.com clip from another channel, say)
const LINK_RE   = /https?:\/\/(?:(?:www\.)?(?:youtu\.be|youtube\.com|streamable\.com|medal\.tv)\/\S+|\S+\.(?:mp4|webm|mov|m4v)(?:\?\S*)?)/gi;
const TAG_RE    = /#([\p{L}\d_-]{2,24})/gu;

const log = (...a) => console.log(...a);

/* Thrown rather than process.exit()'d — bailing out mid-fetch leaves handles
   open and Node aborts noisily on some platforms. */
class SyncError extends Error {}
const die = (m) => { throw new SyncError(m); };

/* ── Not set up yet? Say so and exit clean, so the scheduled run doesn't
      spam failure emails before the token and channel are configured. ── */
if (!TOKEN) {
  log('⚠ DISCORD_BOT_TOKEN is not set. Add it under Settings → Secrets and variables → Actions.');
  log('  Skipping sync (this is not an error).');
  process.exit(0);
}
if (!CFG.channelId) {
  log('⚠ channelId is empty in scripts/sync-config.json.');
  log('  Enable Developer Mode in Discord, right-click #past-works → Copy Channel ID, paste it there.');
  log('  Skipping sync (this is not an error).');
  process.exit(0);
}


/* ══════════════ Discord API ══════════════ */

async function api(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bot ${TOKEN}`, 'User-Agent': 'm3fxn-portfolio-sync/1.0' }
    });

    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      const wait = Math.ceil((body.retry_after ?? 5) * 1000) + 250;
      log(`… rate limited, waiting ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }

    if (res.status === 401) die('Discord rejected the bot token (401). Reset it in the Developer Portal and update the DISCORD_BOT_TOKEN secret.');
    if (res.status === 403) die('The bot cannot see that channel (403). Give it "View Channel" + "Read Message History" on #past-works.');
    if (res.status === 404) die(`Channel ${CFG.channelId} not found (404). Check channelId in scripts/sync-config.json.`);

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      die(`Discord API ${res.status} ${res.statusText} — ${t.slice(0, 300)}`);
    }
    return res.json();
  }
  die('Gave up after repeated rate limits.');
}

async function fetchMessages(channelId, max) {
  const out = [];
  let before = null;

  while (out.length < max) {
    const u = new URL(`${API}/channels/${channelId}/messages`);
    u.searchParams.set('limit', '100');
    if (before) u.searchParams.set('before', before);

    const batch = await api(u.toString());
    if (!Array.isArray(batch) || !batch.length) break;

    out.push(...batch);
    before = batch[batch.length - 1].id;
    if (batch.length < 100) break;
  }
  return out.slice(0, max);
}


/* ══════════════ Message → card ══════════════ */

const titleCase   = s => s.replace(/\b\p{L}/gu, c => c.toUpperCase());
const prettyName  = f => titleCase(String(f).replace(VIDEO_EXT, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim());

const TYPE_TAGS = CFG.typeTags || {};
const RESERVED  = new Set(['featured', ...Object.values(TYPE_TAGS).flat()]);

function detectType(tags, content) {
  // an explicit hashtag always wins
  for (const [type, words] of Object.entries(TYPE_TAGS)) {
    if (tags.some(t => words.includes(t))) return type;
  }
  // otherwise sniff the message text
  const hay = content.toLowerCase();
  for (const [type, words] of Object.entries(TYPE_TAGS)) {
    if (words.some(w => new RegExp(`\\b${w}\\b`).test(hay))) return type;
  }
  return CFG.defaultType || 'r6';
}

function buildEntry(msg, src, fallbackTitle, idx) {
  const content = (msg.content || '').trim();
  const tags    = [...content.matchAll(TAG_RE)].map(m => m[1].toLowerCase());

  const clean = content
    .replace(TAG_RE, '')
    .replace(/https?:\/\/\S+/g, '')
    .trim();

  const lines = clean.split('\n').map(s => s.trim()).filter(Boolean);

  return {
    id:       `${msg.id}-${idx}`,
    type:     detectType(tags, content),
    title:    (lines[0] || fallbackTitle).slice(0, 80),
    desc:     lines.slice(1).join(' ').slice(0, 180),
    tags:     tags.filter(t => !RESERVED.has(t)).slice(0, 3).map(t => titleCase(t.replace(/[-_]/g, ' '))),
    duration: '',                       // the site reads this off the video itself
    featured: tags.includes('featured'),
    poster:   '',
    src,
    postedAt: msg.timestamp,
    source:   'discord'
  };
}


/* ══════════════ Optional: keep a local copy ══════════════ */

async function download(att) {
  const cap = (CFG.downloadMaxMB || 40) * 1024 * 1024;
  if (att.size > cap) {
    log(`  ↷ too big to store (${(att.size / 1e6).toFixed(1)} MB > ${CFG.downloadMaxMB} MB cap), hotlinking instead: ${att.filename}`);
    return null;
  }

  const safe = `${att.id}-${String(att.filename || 'clip').replace(/[^\w.\-]+/g, '_')}`;
  const rel  = `media/discord/${safe}`;
  const abs  = path.join(ROOT, rel);

  if (existsSync(abs) && statSync(abs).size > 0) return rel;   // already have it

  mkdirSync(path.dirname(abs), { recursive: true });
  const res = await fetch(att.url);
  if (!res.ok) {
    log(`  ↷ download failed (${res.status}), hotlinking instead: ${att.filename}`);
    return null;
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(abs));
  log(`  ↓ stored ${rel} (${(att.size / 1e6).toFixed(1)} MB)`);
  return rel;
}


/* ══════════════ Main ══════════════ */

async function main() {
  const messages = await fetchMessages(CFG.channelId, CFG.maxMessages || 300);
  log(`Read ${messages.length} message(s) from channel ${CFG.channelId}.`);

  /* What actually came back. If the Message Content Intent is off, Discord
     blanks content/attachments/embeds, so all three of these read zero even
     though the messages themselves arrive fine. */
  const seenAttachments = new Set();
  const stats = { text: 0, attachments: 0, embeds: 0 };
  for (const m of messages) {
    if ((m.content || '').trim()) stats.text++;
    if ((m.attachments || []).length) stats.attachments++;
    if ((m.embeds || []).length) stats.embeds++;
    for (const a of m.attachments || []) {
      seenAttachments.add(`${a.content_type || 'unknown'} (${a.filename || '?'})`);
    }
  }
  log(`  with text: ${stats.text}   with attachments: ${stats.attachments}   with embeds: ${stats.embeds}`);

  const items = [];

  for (const msg of messages) {
    let idx = 0;

    for (const att of msg.attachments || []) {
      const isVideo = String(att.content_type || '').startsWith('video/') || VIDEO_EXT.test(att.filename || '');
      if (!isVideo) continue;

      let src = att.url;
      if (CFG.mode === 'download') src = (await download(att)) || att.url;

      items.push(buildEntry(msg, src, prettyName(att.filename || 'Clip'), idx++));
    }

    // YouTube / Streamable / Medal links pasted into the channel count too
    for (const link of (msg.content || '').match(LINK_RE) || []) {
      items.push(buildEntry(msg, link, 'Clip', idx++));
    }
  }

  const byType = items.reduce((a, i) => (a[i.type] = (a[i.type] || 0) + 1, a), {});
  log(`Found ${items.length} clip(s): ${JSON.stringify(byType)}`);

  if (!items.length && messages.length) {
    if (!stats.text && !stats.attachments && !stats.embeds) {
      log('');
      log('⚠ Every message came back completely blank — no text, no attachments, no embeds.');
      log('  That is the signature of the Message Content Intent being OFF.');
      log('  Fix: Developer Portal → your app → Bot → Privileged Gateway Intents →');
      log('       switch on MESSAGE CONTENT INTENT → Save Changes, then re-run this.');
    } else {
      log('');
      log(`⚠ Messages are readable (${stats.text} with text, ${stats.attachments} with attachments),`);
      log('  but none of them held a video.');
      if (seenAttachments.size) {
        log('  Attachment types actually seen in this channel:');
        for (const t of [...seenAttachments].slice(0, 15)) log(`    · ${t}`);
      } else {
        log('  No attachments at all — are the clips posted in threads, or in a different channel?');
      }
    }
  }

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({
    syncedAt: new Date().toISOString(),
    channel:  CFG.channelId,
    mode:     CFG.mode || 'link',
    count:    items.length,
    items
  }, null, 2) + '\n');

  log(`✔ Wrote ${path.relative(ROOT, OUT)}`);
}

try {
  await main();
} catch (err) {
  if (err instanceof SyncError) {
    console.error('✖ ' + err.message);
    process.exitCode = 1;
  } else {
    console.error('✖ Sync failed unexpectedly:');
    console.error(err);
    process.exitCode = 1;
  }
}
