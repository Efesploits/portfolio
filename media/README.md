# media/

Drop your video files and thumbnails in here.

```
media/
  combo.mp4
  intro-cutscene.mp4
  hero-loop.mp4
  thumbs/
    combo.jpg
```

Then reference them from `assets/js/data.js`:

```js
src: "media/combo.mp4",
poster: "media/thumbs/combo.jpg"
```

**Keep files small.** GitHub gets unhappy above ~50 MB per file, and big videos make
the page slow. For anything long, upload to YouTube (unlisted is fine) and paste the
link as `src` instead — the site embeds it automatically and pulls the thumbnail.

Recommended export: **H.264 MP4, 1920×1080, 30 or 60 fps, ~5–8 Mbps.**
