/* ═══════════════════════════════════════════════════════════
   M3FXN — main.js
   Vanilla JS. No dependencies. No build step.
   ═══════════════════════════════════════════════════════════ */

(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);


/* ══════════════ 1. VIDEO SOURCE RESOLVER ══════════════ */

const YT_RE  = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/;
const STR_RE = /streamable\.com\/(?:e\/)?([A-Za-z0-9]+)/;
const MED_RE = /medal\.tv\/(?:games\/[^/]+\/)?clips\/([A-Za-z0-9_-]+)/;

function resolveSource(src) {
  if (!src) return { kind: 'empty' };
  const s = String(src).trim();

  const yt = s.match(YT_RE);
  if (yt) return {
    kind: 'iframe',
    embed: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
    thumb: `https://i.ytimg.com/vi/${yt[1]}/maxresdefault.jpg`
  };

  const st = s.match(STR_RE);
  if (st) return { kind: 'iframe', embed: `https://streamable.com/e/${st[1]}?autoplay=1`, thumb: '' };

  const md = s.match(MED_RE);
  if (md) return { kind: 'iframe', embed: `https://medal.tv/clip/${md[1]}/embed?autoplay=1`, thumb: '' };

  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(s)) return { kind: 'video', file: s, thumb: '' };
  if (/^https?:\/\//i.test(s))               return { kind: 'iframe', embed: s, thumb: '' };
  return { kind: 'video', file: s, thumb: '' };
}


/* ══════════════ 2. PRELOADER ══════════════ */

const loader   = $('#loader');
const loaderNum = $('#loaderNum');
const loaderFill = $('#loaderFill');

function runLoader() {
  if (!loader) return;
  document.documentElement.classList.add('is-locked');
  let pct = 0;
  const tick = setInterval(() => {
    pct += Math.random() * 16 + 5;
    if (pct >= 100) { pct = 100; clearInterval(tick); setTimeout(finish, 320); }
    loaderNum.textContent = Math.floor(pct);
    loaderFill.style.width = pct + '%';
  }, REDUCED ? 30 : 110);

  function finish() {
    loader.classList.add('is-done');
    document.documentElement.classList.remove('is-locked');
    document.body.classList.add('is-ready');
    startHero();
    setTimeout(() => loader.remove(), 1400);
  }
}


/* ══════════════ 3. TEXT SPLITTING + REVEALS ══════════════ */

function splitChars(el) {
  const text = el.textContent.trim();
  el.textContent = '';
  [...text].forEach((c, i) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.textContent = c === ' ' ? ' ' : c;
    s.style.transform = 'translateY(115%) rotate(6deg)';
    s.style.opacity = '0';
    s.style.transition = `transform 1s cubic-bezier(.16,1,.3,1) ${i * 55}ms, opacity .8s ${i * 55}ms`;
    el.appendChild(s);
  });
}

function splitLines(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  const line = document.createElement('span');
  line.className = 'line';
  const inner = document.createElement('span');
  inner.textContent = words.join(' ');
  line.appendChild(inner);
  el.appendChild(line);
}

function startHero() {
  $$('[data-split]').forEach(el => {
    $$('.ch', el).forEach(ch => { ch.style.transform = 'none'; ch.style.opacity = '1'; });
  });
  // kick off first-screen reveals
  $$('.hero [data-reveal]').forEach(el => {
    const d = +(el.dataset.delay || 0) + 350;
    setTimeout(() => el.classList.add('is-in'), d);
  });
}

const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const d = +(el.dataset.delay || 0);
    setTimeout(() => el.classList.add('is-in'), d);
    io.unobserve(el);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

function observeReveals(root = document) {
  $$('[data-reveal]:not(.is-in)', root).forEach(el => { if (!el.closest('.hero')) io.observe(el); });
  $$('[data-split-lines]:not(.is-in)', root).forEach(el => io.observe(el));
  $$('.card:not(.is-in), .clink:not(.is-in)', root).forEach(el => io.observe(el));
}


/* ══════════════ 4. HERO CANVAS ══════════════ */

function heroCanvas() {
  const cv = $('#fx');
  if (!cv || REDUCED) return;
  const ctx = cv.getContext('2d');
  let w, h, dpr, dots = [], raf, mouse = { x: -999, y: -999 };

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect();
    w = r.width; h = r.height;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = clamp(Math.round((w * h) / 16000), 30, 110);
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - .5) * .28,
      vy: (Math.random() - .5) * .28,
      r: Math.random() * 1.7 + .5
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < dots.length; i++) {
      const p = dots[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      const lit = dm < 160;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + (lit ? 1 : 0), 0, Math.PI * 2);
      ctx.fillStyle = lit ? 'rgba(196,181,253,.85)' : 'rgba(167,139,250,.42)';
      ctx.fill();

      for (let j = i + 1; j < dots.length; j++) {
        const q = dots[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 128) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(139,92,246,${(1 - d / 128) * .22})`;
          ctx.lineWidth = .7;
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(draw);
  }

  size(); draw();
  addEventListener('resize', size, { passive: true });
  addEventListener('mousemove', e => {
    const r = cv.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  }, { passive: true });

  // stop painting when the hero is off-screen
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(draw); }
    else { cancelAnimationFrame(raf); raf = null; }
  }, { threshold: 0 }).observe(cv);
}


/* ══════════════ 5. CURSOR ══════════════ */

function cursor() {
  const c = $('.cursor');
  if (!c || matchMedia('(hover:none)').matches) return;
  const dot = $('.cursor__dot', c), ring = $('.cursor__ring', c), label = $('.cursor__label', c);
  let mx = 0, my = 0, rx = 0, ry = 0;

  addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    c.classList.add('is-on');
    dot.style.transform = `translate(${mx}px,${my}px)`;
  }, { passive: true });

  (function loop() {
    rx += (mx - rx) * .16; ry += (my - ry) * .16;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    label.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(loop);
  })();

  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-cursor], a, button');
    if (!t) { c.classList.remove('is-hover', 'is-label'); label.textContent = ''; return; }
    const mode = t.dataset.cursor;
    if (mode && mode !== 'link') { c.classList.add('is-label'); c.classList.remove('is-hover'); label.textContent = mode; }
    else { c.classList.add('is-hover'); c.classList.remove('is-label'); label.textContent = ''; }
  });
  addEventListener('mouseleave', () => c.classList.remove('is-on'));
}


/* ══════════════ 6. NAV ══════════════ */

function nav() {
  const bar = $('#nav'), burger = $('#burger'), menu = $('#mobileMenu');
  let last = 0;

  addEventListener('scroll', () => {
    const y = scrollY;
    bar.classList.toggle('is-stuck', y > 30);
    if (y > last && y > 400 && !menu.classList.contains('is-open')) bar.classList.add('is-hidden');
    else bar.classList.remove('is-hidden');
    last = y;

    const p = (y / (document.documentElement.scrollHeight - innerHeight)) * 100;
    $('.progress__bar').style.width = clamp(p, 0, 100) + '%';
  }, { passive: true });

  // mobile menu
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('is-locked', open);
    $$('.mobile__inner a').forEach((a, i) => { a.style.transitionDelay = open ? `${120 + i * 60}ms` : '0ms'; });
  });
  $$('.mobile__inner a').forEach(a => a.addEventListener('click', () => burger.click()));

  // scroll-spy
  const sections = ['hero', 'about', 'work', 'process', 'discord', 'contact']
    .map(id => $('#' + id)).filter(Boolean);
  const links = $$('.nav__links a');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.toggle('is-current', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { threshold: .35 });
  sections.forEach(s => spy.observe(s));

  // nav links that also switch a work tab
  $$('[data-nav-tab]').forEach(a => {
    a.addEventListener('click', () => setTimeout(() => switchTab(a.dataset.navTab), 260));
  });
}


/* ══════════════ 7. MAGNETIC BUTTONS ══════════════ */

function magnetic() {
  if (REDUCED || matchMedia('(hover:none)').matches) return;
  $$('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * .28;
      const y = (e.clientY - r.top - r.height / 2) * .38;
      el.style.transform = `translate(${x}px,${y}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}


/* ══════════════ 8. CONTENT RENDERING ══════════════ */

const ICONS = {
  discord: '<path d="M19.3 5.3A16 16 0 0 0 15.4 4l-.2.4a12 12 0 0 1 3.4 1.7 11 11 0 0 0-9.3 0A12 12 0 0 1 12.8 4.4L12.6 4a16 16 0 0 0-3.9 1.3C6 9.4 5.3 13.4 5.6 17.4a16 16 0 0 0 4.8 2.4l1-1.6a10 10 0 0 1-1.6-.8l.4-.3a11 11 0 0 0 9.6 0l.4.3a10 10 0 0 1-1.6.8l1 1.6a16 16 0 0 0 4.8-2.4c.4-4.6-.6-8.6-3.1-12.1ZM10.3 15c-.9 0-1.7-.9-1.7-2s.8-2 1.7-2 1.7.9 1.7 2-.8 2-1.7 2Zm5.4 0c-.9 0-1.7-.9-1.7-2s.8-2 1.7-2 1.7.9 1.7 2-.8 2-1.7 2Z" fill="currentColor" stroke="none"/>',
  mail:    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
  twitter: '<path d="M4 4l16 16M20 4 4 20"/>',
  link:    '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>'
};
const CHECK = '<svg viewBox="0 0 24 24"><path d="m4 12 5 5L20 6"/></svg>';

function renderStatic() {
  // hero stats
  $('#heroStats').innerHTML = SITE.heroStats
    .map(s => `<li><strong>${s.value}</strong><span>${s.label}</span></li>`).join('');

  // marquee (doubled for seamless loop)
  const items = SITE.marquee.map(t => `<span class="marquee__item">${t}<i></i></span>`).join('');
  $('#marquee').innerHTML = items + items;

  // skills
  $('#skillsList').innerHTML = SITE.skills
    .map(s => `<li><i></i><span><b>${s.title}</b><small>${s.desc}</small></span></li>`).join('');

  // tools
  $('#toolsList').innerHTML = SITE.tools.map(t => `<span class="chip">${t}</span>`).join('');

  // availability
  const av = SITE.availability;
  $('#availTitle').textContent = av.title;
  $('#availSub').textContent = av.sub;
  if (!av.open) {
    $('.panel--status').style.borderColor = 'rgba(251,191,36,.3)';
    $('.panel--status .dot-live').style.background = '#FBBF24';
  }

  // counters
  $('#counters').innerHTML = SITE.counters
    .map(c => `<div class="counter" data-reveal><b data-count="${c.value}" data-suffix="${c.suffix || ''}">0</b><span>${c.label}</span></div>`).join('');

  // process
  $('#steps').innerHTML = SITE.process
    .map((s, i) => `<article class="step" data-reveal data-delay="${i * 90}">
        <div class="step__num">0${i + 1}</div>
        <h3>${s.title}</h3><p>${s.text}</p></article>`).join('');

  // perks
  $('#perks').innerHTML = SITE.perks.map(p => `<li>${CHECK}<span>${p}</span></li>`).join('');

  // contacts
  $('#contactLinks').innerHTML = SITE.contacts.map((c, i) => {
    const href = c.icon === 'discord' ? (SITE.discord || c.href || '') : (c.href || '');
    const isMail = c.icon === 'mail' && href && !/^https?:|^mailto:/i.test(href);
    const real = isMail ? 'mailto:' + href : href;
    const tag = real ? 'a' : 'button';
    const attrs = real ? `href="${real}" target="_blank" rel="noopener"` : 'type="button" disabled style="opacity:.5;cursor:not-allowed"';
    return `<${tag} class="clink" ${attrs} data-delay="${i * 80}" data-cursor="link">
      <svg viewBox="0 0 24 24">${ICONS[c.icon] || ICONS.link}</svg>
      <span><b>${c.label}</b><small>${real ? c.value : 'Coming soon'}</small></span>
    </${tag}>`;
  }).join('');

  // year
  $('#year').textContent = new Date().getFullYear();

  // hero video
  if (SITE.heroVideo) {
    const v = $('#heroVideo');
    v.src = SITE.heroVideo;
    v.addEventListener('loadeddata', () => v.classList.add('is-on'));
    v.play().catch(() => {});
  }

  // discord links everywhere
  const url = (SITE.discord || '').trim();
  $$('[data-discord-link]').forEach(el => {
    if (url) {
      if (el.tagName === 'A' && el.hasAttribute('href') && el.getAttribute('href') === '#') {
        el.href = url; el.target = '_blank'; el.rel = 'noopener';
      }
    }
  });
  const dBtn = $('.btn--discord');
  if (url) {
    dBtn.href = url;
    $('#discordBtnLabel').textContent = 'Open invite';
    $('#discordHint').textContent = url.replace(/^https?:\/\//, '');
    $('#mobileDiscord').textContent = 'Discord →';
    $('#mobileDiscord').style.cursor = 'pointer';
    $('#mobileDiscord').onclick = () => open(url, '_blank');
  } else {
    dBtn.classList.add('is-disabled');
    dBtn.removeAttribute('href');
    $('#discordBtnLabel').textContent = 'Invite coming soon';
    $('#discordHint').textContent = 'Add your link in assets/js/data.js → SITE.discord';
  }
}


/* ══════════════ 9. COUNTERS ══════════════ */

function counters() {
  const els = $$('[data-count]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count, suffix = el.dataset.suffix || '';
      const dur = 1600, t0 = performance.now();
      (function step(now) {
        const p = clamp((now - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
      obs.unobserve(el);
    });
  }, { threshold: .5 });
  els.forEach(el => obs.observe(el));
}


/* ══════════════ 10. ROLE ROTATOR ══════════════ */

function rotator() {
  const box = $('#rotator');
  if (!box || !SITE.roles.length) return;
  let i = 0;
  setInterval(() => {
    const old = box.querySelector('span:not(.out)');
    if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 460); }
    i = (i + 1) % SITE.roles.length;
    const next = document.createElement('span');
    next.textContent = SITE.roles[i];
    box.appendChild(next);
  }, 2600);
}


/* ══════════════ 11. WORK GRID ══════════════ */

let ACTIVE = [];      // items currently in the open tab (for lightbox nav)
let CURRENT_TAB = 'r6';

function cardHTML(item, i) {
  const res = resolveSource(item.src);
  const poster = item.poster || res.thumb || '';
  const badges = [
    item.featured ? '<span class="badge badge--accent">Featured</span>' : '',
    res.kind === 'empty' ? '<span class="badge badge--soon">Coming soon</span>' : ''
  ].join('');

  // YouTube maxres doesn't exist for every upload — fall back to hqdefault, then to
  // the generated placeholder.
  const fallback = res.thumb && res.thumb.includes('maxresdefault')
    ? ` onerror="this.onerror=null;this.src='${res.thumb.replace('maxresdefault', 'hqdefault')}'"` : '';

  const media = poster
    ? `<img src="${poster}" alt="${item.title}" loading="lazy" decoding="async"${fallback}>`
    : `<div class="card__ph"><span>${res.kind === 'empty' ? 'Video slot' : 'Preview'}</span></div>`;

  const hoverVid = res.kind === 'video'
    ? `<video src="${res.file}" muted loop playsinline preload="none"></video>` : '';

  return `<article class="card" data-idx="${i}" data-tags="${(item.tags || []).join('|')}" data-delay="${(i % 3) * 90}" data-cursor="play">
    <span class="card__line"></span>
    <div class="card__media">
      ${media}${hoverVid}
      <div class="card__badges">${badges}</div>
      ${item.duration ? `<span class="card__dur">${item.duration}</span>` : ''}
      <span class="card__play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
    </div>
    <div class="card__body">
      <h3 class="card__title">${item.title}</h3>
      <p class="card__desc">${item.desc || ''}</p>
      <div class="card__foot">
        <div class="card__tags">${(item.tags || []).map(t => `<span>${t}</span>`).join('')}</div>
        <span class="card__go">Watch <svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg></span>
      </div>
    </div>
  </article>`;
}

function renderWork() {
  ['r6', 'cutscene'].forEach(type => {
    const items = WORK.filter(w => w.type === type);
    const grid = $('#grid-' + type);
    grid.innerHTML = items.length
      ? items.map(cardHTML).join('')
      : `<div class="empty">Nothing here yet — add entries to <code>assets/js/data.js</code>.</div>`;
    $(`[data-count-for="${type}"]`).textContent = String(items.length).padStart(2, '0');

    grid.addEventListener('click', e => {
      const card = e.target.closest('.card');
      if (card) openLightbox(type, +card.dataset.idx);
    });

    // hover preview
    grid.addEventListener('mouseover', e => {
      const card = e.target.closest('.card'); if (!card) return;
      const v = $('video', card); if (!v) return;
      card.classList.add('is-playing');
      v.play().catch(() => {});
    });
    grid.addEventListener('mouseout', e => {
      const card = e.target.closest('.card'); if (!card) return;
      const v = $('video', card); if (!v) return;
      if (card.contains(e.relatedTarget)) return;
      card.classList.remove('is-playing');
      v.pause(); v.currentTime = 0;
    });
  });

  buildFilters('r6');
  moveInk($('.tab.is-active'));
}

function buildFilters(type) {
  const tags = [...new Set(WORK.filter(w => w.type === type).flatMap(w => w.tags || []))];
  $('#filters').innerHTML = tags.length
    ? `<button class="filter is-on" data-tag="*">All</button>` +
      tags.map(t => `<button class="filter" data-tag="${t}">${t}</button>`).join('')
    : '';
}

document.addEventListener('click', e => {
  const f = e.target.closest('.filter');
  if (!f) return;
  $$('.filter').forEach(b => b.classList.toggle('is-on', b === f));
  const tag = f.dataset.tag;
  $$(`#grid-${CURRENT_TAB} .card`).forEach(c => {
    const has = tag === '*' || (c.dataset.tags || '').split('|').includes(tag);
    c.classList.toggle('is-out', !has);
  });
});


/* ══════════════ 12. TABS ══════════════ */

function moveInk(tab) {
  const ink = $('#tabsInk');
  if (!tab || !ink) return;
  ink.style.width = tab.offsetWidth + 'px';
  ink.style.transform = `translateX(${tab.offsetLeft - 5}px)`;
}

function switchTab(type) {
  if (!type || type === CURRENT_TAB) { CURRENT_TAB = type || CURRENT_TAB; return; }
  CURRENT_TAB = type;
  $$('.tab').forEach(t => {
    const on = t.dataset.tab === type;
    t.classList.toggle('is-active', on);
    t.setAttribute('aria-selected', on);
    if (on) moveInk(t);
  });
  $$('.work__panel').forEach(p => {
    const on = p.id === 'panel-' + type;
    p.classList.toggle('is-hidden', !on);
    p.toggleAttribute('hidden', !on);
  });
  buildFilters(type);
  $$(`#grid-${type} .card`).forEach((c, i) => {
    c.classList.remove('is-out');
    if (!c.classList.contains('is-in')) setTimeout(() => c.classList.add('is-in'), i * 70);
  });
}

function tabs() {
  $$('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  addEventListener('resize', () => moveInk($('.tab.is-active')), { passive: true });
}


/* ══════════════ 13. LIGHTBOX ══════════════ */

const lb = $('#lightbox');
let lbIndex = 0, lbList = [];

function openLightbox(type, idx) {
  lbList = WORK.filter(w => w.type === type);
  lbIndex = idx;
  paintLightbox();
  lb.classList.add('is-open');
  lb.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.add('is-locked');
}

function paintLightbox() {
  const item = lbList[lbIndex];
  if (!item) return;
  const res = resolveSource(item.src);
  const stage = $('#lbStage');
  stage.innerHTML = '';

  if (res.kind === 'video') {
    const v = document.createElement('video');
    v.src = res.file; v.controls = true; v.autoplay = true; v.playsInline = true; v.loop = true;
    if (item.poster) v.poster = item.poster;
    stage.appendChild(v);
  } else if (res.kind === 'iframe') {
    const f = document.createElement('iframe');
    f.src = res.embed;
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    stage.appendChild(f);
  } else {
    stage.innerHTML = `<div class="lb__missing">
      <strong>Video not added yet</strong>
      <p>Drop the file into <code>media/</code> or paste a YouTube / Streamable link, then set it as the <code>src</code> for “${item.title}”.</p>
      <code>assets/js/data.js</code>
    </div>`;
  }

  $('#lbTitle').textContent = item.title;
  $('#lbDesc').textContent = item.desc || '';
  $('#lbTags').innerHTML = [...(item.tags || []), item.duration].filter(Boolean)
    .map(t => `<span>${t}</span>`).join('');

  const multi = lbList.length > 1;
  $('#lbPrev').style.display = multi ? '' : 'none';
  $('#lbNext').style.display = multi ? '' : 'none';
}

function closeLightbox() {
  lb.classList.remove('is-open');
  lb.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('is-locked');
  setTimeout(() => { $('#lbStage').innerHTML = ''; }, 420);
}

function lightbox() {
  $$('[data-lb-close]').forEach(el => el.addEventListener('click', closeLightbox));
  $('#lbPrev').addEventListener('click', () => { lbIndex = (lbIndex - 1 + lbList.length) % lbList.length; paintLightbox(); });
  $('#lbNext').addEventListener('click', () => { lbIndex = (lbIndex + 1) % lbList.length; paintLightbox(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft')  $('#lbPrev').click();
    if (e.key === 'ArrowRight') $('#lbNext').click();
  });
}


/* ══════════════ 14. WORDMARK AUTO-FIT ══════════════
   The hero name is set in Syne, whose cap widths differ from the fallback font.
   Rather than guess a vw value that overflows on some widths, measure the real
   text and scale it to fill the content column edge-to-edge. */

/* Probe at 100px on the sizing element, measure the inline-block child that
   hugs the text, then scale. Keeps em-based line-height/margins correct. */
function fitText(outer, inner, targetFn, min = 32, max = 340) {
  if (!outer || !inner) return;
  const fit = () => {
    outer.style.fontSize = '100px';
    const textW = inner.getBoundingClientRect().width;
    const target = targetFn();
    if (!textW || !target) return;
    outer.style.fontSize = clamp(100 * (target / textW), min, max) + 'px';
  };
  fit();
  addEventListener('resize', fit, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
}

function fitWordmark() {
  const host = $('.hero__content');
  if (host) fitText($('.hero__title'), $('.hero__line'), () => host.clientWidth * 0.985, 40, 280);

  fitText($('.footer__wordmark'), $('.footer__wordmark span'),
    () => document.documentElement.clientWidth * 0.99, 40, 300);
}


/* ══════════════ 15. HERO PARALLAX ══════════════ */

function parallax() {
  if (REDUCED) return;
  const content = $('.hero__content');
  addEventListener('scroll', () => {
    const y = scrollY;
    if (y > innerHeight) return;
    content.style.transform = `translateY(${y * .18}px)`;
    content.style.opacity = String(clamp(1 - y / (innerHeight * .8), 0, 1));
  }, { passive: true });
}


/* ══════════════ INIT ══════════════ */

function init() {
  renderStatic();
  renderWork();

  $$('[data-split]').forEach(splitChars);
  $$('[data-split-lines]').forEach(splitLines);
  fitWordmark();

  observeReveals();
  counters();
  rotator();
  tabs();
  lightbox();
  nav();
  cursor();
  magnetic();
  heroCanvas();
  parallax();
  runLoader();

  // smooth anchor scroll with nav offset
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    const t = $(id);
    if (!t) return;
    e.preventDefault();
    const top = t.getBoundingClientRect().top + scrollY - (id === '#top' ? 0 : 70);
    scrollTo({ top, behavior: REDUCED ? 'auto' : 'smooth' });
  });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();

})();
