# Frame Grid

**ConsciousNode SoftWorks** · Browser-native video and GIF contact-sheet generator with ElasticTOK frame fingerprinting.

[![Live](https://img.shields.io/badge/live-consciousnode.github.io%2Fframe--grid-00e5ff?style=flat-square&logo=github)](https://consciousnode.github.io/frame-grid)
[![Version](https://img.shields.io/badge/version-2.5.1-00e5ff?style=flat-square)](https://github.com/ConsciousNode/frame-grid)
[![License](https://img.shields.io/badge/license-MIT-4a6070?style=flat-square)](LICENSE)
[![Xinu](https://img.shields.io/badge/xinu-compliant-34d399?style=flat-square)](https://github.com/ConsciousNode)

```
camera feed, uploaded video, or GIF
  → temporal frame sampling / GIF frame extraction
  → ROSA ElasticTOK fingerprinting
  → labeled contact-sheet grids (PNG)
  → subtitle transcripts synced to frames (TXT, optional)
  → JSON frame manifests (FPSS-compatible)
```

Single HTML file. Zero dependencies. Zero uploads. Runs entirely in your browser.

**In plain words:** you're talking with your LLM, you want to show it a video or a GIF, and you can't. Frame Grid turns the video into a numbered grid of its frames, in order, in one PNG (or a batch of them). Your LLM can read the grid and "watch" the video. Record with your camera, or pick a video or GIF. Free, nothing to install, nothing leaves your machine.

**Why it's built this way: the Xinu philosophy** (Unix, inverted). Look at the thing built to do one thing and do it well, and ask: *what else can it do?* In practice that means single file, offline, browser-based, zero external dependencies. The constraint is the source of innovation and invention, not a limitation.

Designed by Kham, coded with Claude, at ConsciousNode SoftWorks.

---

## What it does

Frame Grid samples frames from a video or GIF at a configurable rate, assembles them into labeled contact-sheet grids, and exports them as downloadable PNGs. With ElasticTOK enabled, each frame also gets a ROSA suffix automaton fingerprint — a structural signature that captures how repetitive or complex the frame's content is, independent of pixel-level appearance.

Originally designed as a proof of concept for the ManosNowAware visual pipeline. The GIF ingestion pipeline (v2.2–2.3) extends this to animated GIFs, enabling AI models to "watch" GIFs as a contact-sheet grid.

---

## Features

### Core
- **Camera, video, or GIF source** — live camera capture with recording, uploaded video files, or animated GIFs
- **Configurable sampling** — FPS, frame dimensions, grid columns/rows, max grids (1–100, or **∞** for no limit: slide MAX GRIDS all the way right)
- **Label styles** — minimal (F##), standard (F## | time), full (F## | time | fps), ROSA (F## | time | ◈CR)
- **Download** — PNG per grid with header bar showing grid number, frame range, and timestamps, or **Download all** to get every grid (with its JSON and TXT) in one `.zip`

### Subtitles (v2.4)
Load an `.srt` or `.vtt` file next to a video and the words come along with the pictures.

- **Caption band in the grid** (toggle): each frame shows the line that was on screen at that moment, so the grid reads like the video with subtitles on.
- **TXT transcript per grid**: every line exactly once, tagged with the frame showing when it starts:
  ```
  F02  0:00.5  [0:00.5–0:02.0]  Hello there.
  F05  0:02.0  [0:02.1–0:03.9]  General Kenobi!
  ```
  Paste it next to the PNG. Text costs an LLM far fewer tokens than reading words out of pixels, and it's already in sync.
- Lines that start during skipped duplicate frames carry over to the next kept frame, so nothing is lost.
- With ElasticTOK on, the JSON manifest also gets a `caption` per frame.
- Most video downloaders can save subtitles as `.srt`/`.vtt` alongside the video (subtitles built into a video file can't be read by the browser, so they need to be a separate file).

### GIF Ingestion (v2.2–2.3)
Native animated GIF support. Drop a GIF → get a contact-sheet grid of every frame, timestamped to the GIF's own timing. Designed so AI models can receive the full temporal content of an animated GIF as a single image.

- **Primary decoder**: browser-native `ImageDecoder` API (Chrome 94+, Safari 17+, Firefox 113+) — handles all GIF compositing, disposal methods, interlace, and edge cases natively
- **Fallback decoder**: pure-JS GIF89a parser with LZW decompression, interlace support, and per-frame compositing for older browsers
- Animated preview via `<img>` element while frames are processed
- Frame timing labels use the GIF's native cumulative timestamps
- Dedup and ElasticTOK work identically on GIF frames as on video frames

### ElasticTOK (v2.0)
ROSA suffix automaton fingerprint per frame. Toggle in sidebar; `◈ ELASTICTOK` chip appears in header when active.

- 16×16 patch grid over the frame → RGB mean per patch → 768 quantized tokens
- Suffix automaton built on token sequence → compression ratio (CR) + state count
- b1.58 ternary packing of Float32[128] transition-density fingerprint → Uint8[32]
- CR displayed in frame label bar (ROSA label style)
- **JSON manifest download** per grid when ElasticTOK is on — FPSS-compatible format:

```json
{
  "tool": "FrameGrid v2.3",
  "grid": 1,
  "frames": [
    {
      "index": 0,
      "time": 0.000,
      "isDup": false,
      "cr": 2.34,
      "stateCount": 328,
      "packed": [0, 1, 2, ...]
    }
  ]
}
```

High CR = structurally repetitive frame (static shot, uniform background).
Low CR = structurally complex frame (busy scene, high detail).

### Frame Deduplication (v2.0)
Mean Absolute Difference comparison between consecutive kept frames. Configurable threshold (MAD 1–30, default 8).

- **Skip mode** — duplicate frames are dropped entirely; grid is denser with unique content
- **Mark mode** — duplicates kept but highlighted with red label bar and `[DUP]` tag
- Session panel shows kept / duped / dup% stats

---

## Usage

**[Open Frame Grid →](https://consciousnode.github.io/frame-grid)**

1. Select **Camera**, **Upload** (video), or **GIF**. For a video, optionally add **💬 Subtitles** (.srt / .vtt)
2. Set FPS, frame size, and grid dimensions in Parameters
3. Enable **ElasticTOK** for ROSA fingerprinting (optional)
4. Enable **Dedup** to filter near-identical frames (optional)
5. Hit **Process** (or **Capture** → **Stop** for camera)
6. Download grids as PNG, plus a TXT transcript per grid if subtitles are loaded and a JSON manifest if ElasticTOK is on.

Works offline. No data leaves your device.

---

## Related tools

Frame Grid isn't the only way to do this, and you might prefer another:

- **[ffmpeg](https://ffmpeg.org)** can build a frame grid from the command line with its `tile` filter, e.g. `ffmpeg -i video.mp4 -vf "fps=2,scale=256:-1,tile=5x4" grid%02d.png`. Powerful, scriptable, needs installing.
- **cdaf**, a similar project a Reddit commenter pointed us to.
- You can also ask your LLM to write you a script for it.

Frame Grid is for people who'd rather click: open a page, drop a video, get grids. Nothing to install, nothing uploaded.

---

## Roadmap

- **On-screen text (OCR):** read text visible in frames (slides, signs, code) into the transcript. Candidate engine: Saccade, ConsciousNode's own zero-dependency OCR, currently stalled.
- **Transcripts from audio:** for videos without subtitle files. Needs an offline speech model to stay Xinu-compliant (the browser's built-in speech recognition may send audio to a server), so it's a research item, not a promise.

Both suggestions came from the Reddit thread. Thanks, commenters.

---

## Stack integration

Frame Grid's JSON manifests are designed to flow into the ConsciousNode stack:

| Manifest field | Destination |
|---|---|
| `packed` (Uint8[32] fingerprint) | FPSS `.cns` image entry · SheafMemory ingestion |
| `cr` (ROSA compression ratio) | RAG Time corpus-driven embedding signal |
| `isDup`, `time` | ManosNowAware visual pipeline metadata |

---

## Architecture

```
Source (camera / video file / GIF)
  ├─ Video path
  │    └─ resolveDuration()          — WebM Infinity fix (mobile Chrome)
  │    └─ seekTo() × N               — frame-accurate temporal sampling
  │    └─ proc-canvas                — single reusable extraction canvas
  └─ GIF path
       └─ gifDecode()                — routes to native or pure-JS
            ├─ gifDecodeNative()     — ImageDecoder API (primary)
            └─ gifDecodePureJS()     — GIF89a parser + LZW (fallback)
                 └─ gifLZW()         — variable-width LZW decompressor
  └─ frameMad()                      — MAD dedup vs previous kept frame
  └─ elasticTok()                    — ROSA fingerprint (if enabled)
       └─ 16×16 patch → tokens
       └─ SuffixAutomaton
       └─ CR + state count
       └─ b1.58 pack → Uint8[32]
  └─ scratch-canvas                  — single reusable draw canvas
  └─ Grid assembly                   — label bars, header bar, border
  └─ PNG download                    — hdrCanvas.toDataURL()
  └─ JSON manifest                   — Blob → URL → <a download>
```

---

## Changelog

### v2.5.1 — 2026-10-12 · Kehai Interim

Found on the first real long run (a 4h23m film, 247 grids on a phone): from 2:16:32 on, every frame came out black, and the last 103 grids were the same image saved under different names. Nothing in the log said so. The same settings on a 4-hour test video in desktop Chromium were clean (235 unique grids), so it was the device's limits; the tool's problem was failing silently.
- **Seek timeouts get one decoder reset and a retry.** 20 failures in a row stop the run with a message naming the time.
- **30 s of solid black right after real picture** triggers a decoder reset; if the picture doesn't come back, the log says when the black started (real black stretches still pass through).
- **Out of canvas memory** (a grid identical to the one before, or one that can't be encoded) stops the run and says so; everything before it is kept.
- Tested by forcing each failure: seek failure stops at the right time, a black tail warns once, a canvas fault stops after one bad grid, and a normal run logs nothing new. Subtitle tests 15/15.

### v2.5 — 2026-10-12 · Kehai Interim

Requested on Reddit: long videos without the 20-grid ceiling.
- **MAX GRIDS goes to ∞.** The slider runs 1–100, and its far right means no limit: a video is sampled to its last frame. Default is still 20.
- **Finished grids are held as PNG images, not canvases**, so a long run doesn't keep hundreds of full-size bitmaps in memory.
- **Download all**: every grid's PNG, JSON manifest and TXT transcript in one `.zip`, written in plain JS (stored, since PNGs are already compressed). Still zero dependencies.
- Runs over 60 grids log a rough size estimate. Practical limit is now your browser tab's memory; lower FPS or frame size for very long videos.
- Tested: a 40 s clip at 3 fps on 2×2 grids gave 30 grids past the old cap; the .zip opens and verifies (CRC) with Python's `zipfile`; with MAX GRIDS at 5 the cap still holds; subtitle tests 15/15.

### v2.4 — 2026-10-11 · Kehai Interim

- **Subtitle import** (`.srt` / `.vtt`) for video sources: caption band drawn into each frame (toggle), TXT transcript per grid with each line tagged to its frame, `caption` field in the JSON manifest.
- Parser handles BOM, CRLF, SRT and VTT timestamps, cue settings, NOTE/STYLE blocks, inline tags (`<i>`, `<v Speaker>`, `<c.class>`), `{\an8}` overrides and overlapping cues.
- `tests/subtitles.js`: zero-dependency checks of the parser and the frame sync (`node tests/subtitles.js`).
- README: Related tools and Roadmap sections.

### v2.3 — 2026-10-11 · Komorebi Interim

- **LZW bug fixed.** `dict.length > codeMask + 1` → `dict.length > codeMask`. The code-size growth check was off by one: the decoder read 9-bit codes when the bitstream had already switched to 10-bit codes, producing garbage indices that all failed the color table bounds check and silently rendered every frame black. Root cause of all-black output in v2.2.x.
- **`ImageDecoder` API as primary GIF decoder.** Native browser GIF decoding (Chrome 94+, Safari 17+, Firefox 113+). Handles compositing, disposal methods, interlace, and all edge cases automatically. Pure-JS decoder retained as fallback for older browsers.
- `gifDecode()` is now async and routes to native or fallback automatically. Log reports which path was taken.
- `index.html` updated to v2.3.
- Version string updated throughout.

### v2.2 — 2026-10-11 · Komorebi Interim

- **GIF ingestion pipeline.** Animated GIFs can be loaded as a source alongside camera and video upload. Pure-JS GIF89a decoder with full LZW decompression, interlace support, and per-frame compositing respecting all three disposal methods (leave, restore-background, restore-previous).
- GIF source button (🌀) added to source panel.
- Animated preview via `<img>` element while frames are decoded and processed.
- Frame timing labels use GIF's native cumulative timestamps.
- `processSource()` router added — PROCESS button works for both video and GIF.
- Note: v2.2.x builds produced all-black GIF grids due to the LZW bug fixed in v2.3.

### v2.1 — 2026-06-07 · Kehai Interim

- **GIF export** — pure JS GIF89a encoder, zero dependencies, Xinu-compliant. Toggle in Analysis panel.
  - LZW compression with numeric-keyed Map
  - 8×8×4 uniform 256-color palette, O(1) quantization per pixel
  - Frames sub-sampled evenly up to configurable max (default 60)
  - Configurable GIF width (160–480px), frame delay (4–50 centiseconds)
  - NETSCAPE2.0 loop extension for infinite loop
- Mobile Chrome WebM blob duration=Infinity splice fix (Kehai Interim, 2026-10-11).

### v2.0 — 2026-06-07 · Kehai Interim

- **Xinu compliance** — Google Fonts CDN import removed. System monospace stack. Zero external calls.
- **Viewport** — `user-scalable=no` removed. Browser zoom restored.
- **ElasticTOK** — `SuffixAutomaton` class inline. ROSA CR + state count + b1.58 packed fingerprint per frame.
- **Frame deduplication** — `frameMad()` MAD comparison. Configurable threshold. Skip or mark mode.
- **Single scratch canvas** — eliminates N canvas allocations per grid assembly pass.

### v1.3 — Ed Interim

- Mobile Chrome WebM blob duration=Infinity fix. `resolveDuration()` force-seeks to 1e10 and waits for `durationchange` event.

### v1.0–1.2 — Kham / Ed Interim

- Initial implementation. Proof of concept for the ManosNowAware visual pipeline.

---

## License

MIT — ConsciousNode SoftWorks
