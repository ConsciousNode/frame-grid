# Frame Grid

**ConsciousNode SoftWorks** · Browser-native video contact-sheet generator with ElasticTOK frame fingerprinting.

[![Live](https://img.shields.io/badge/live-consciousnode.github.io%2Fframe--grid-00e5ff?style=flat-square&logo=github)](https://consciousnode.github.io/frame-grid)
[![Version](https://img.shields.io/badge/version-2.0-00e5ff?style=flat-square)](https://github.com/ConsciousNode/frame-grid)
[![License](https://img.shields.io/badge/license-MIT-4a6070?style=flat-square)](LICENSE)
[![Xinu](https://img.shields.io/badge/xinu-compliant-34d399?style=flat-square)](https://github.com/ConsciousNode)

```
camera feed or uploaded video
  → temporal frame sampling
  → ROSA ElasticTOK fingerprinting
  → labeled contact-sheet grids (PNG)
  → JSON frame manifests (FPSS-compatible)
```

Single HTML file. Zero dependencies. Zero uploads. Runs entirely in your browser.

---

## What it does

Frame Grid samples frames from a video at a configurable FPS, assembles them into labeled contact-sheet grids, and exports them as downloadable PNGs. With ElasticTOK enabled, each frame also gets a ROSA suffix automaton fingerprint — a structural signature that captures how repetitive or complex the frame's content is, independent of pixel-level appearance.

Designed as a proof of concept for the ManosNowAware visual pipeline. Useful standalone as a fast, offline, zero-footprint video analysis tool.

---

## Features

### Core
- **Camera or file source** — live camera capture with recording, or drop any video file
- **Configurable sampling** — FPS, frame dimensions, grid columns/rows, max grids
- **Label styles** — minimal (F##), standard (F## | time), full (F## | time | fps), ROSA (F## | time | ◈CR)
- **Download** — PNG per grid with header bar showing grid number, frame range, and timestamps

### ElasticTOK (v2.0)
ROSA suffix automaton fingerprint per frame. Toggle in sidebar; `◈ ELASTICTOK` chip appears in header when active.

- 16×16 patch grid over the frame → RGB mean per patch → 768 quantized tokens
- Suffix automaton built on token sequence → compression ratio (CR) + state count
- b1.58 ternary packing of Float32[128] transition-density fingerprint → Uint8[32]
- CR displayed in frame label bar (ROSA label style)
- **JSON manifest download** per grid when ElasticTOK is on — FPSS-compatible format:

```json
{
  "tool": "FrameGrid v2.0",
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

1. Select **Camera** or **Upload** a video file
2. Set FPS, frame size, and grid dimensions in Parameters
3. Enable **ElasticTOK** for ROSA fingerprinting (optional)
4. Enable **Dedup** to filter near-identical frames (optional)
5. Hit **Process Video** (or **Capture** → **Stop** for camera)
6. Download grids as PNG. Download JSON manifests if ElasticTOK is on.

Works offline. No data leaves your device.

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
Video source (camera / file)
  └─ resolveDuration()          — WebM Infinity fix (mobile Chrome)
  └─ seekTo() × N               — frame-accurate temporal sampling
  └─ proc-canvas                — single reusable extraction canvas
  └─ frameMad()                 — MAD dedup vs previous kept frame
  └─ elasticTok()               — ROSA fingerprint (if enabled)
       └─ 16×16 patch → tokens
       └─ SuffixAutomaton
       └─ CR + state count
       └─ b1.58 pack → Uint8[32]
  └─ scratch-canvas             — single reusable draw canvas
  └─ Grid assembly              — label bars, header bar, border
  └─ PNG download               — hdrCanvas.toDataURL()
  └─ JSON manifest              — Blob → URL → <a download>
```

---

## Changelog

### v2.1 — 2026-06-07 · Kehai Interim

- **GIF export** — pure JS GIF89a encoder, zero dependencies, Xinu-compliant. Toggle in Analysis panel. After processing, a green download bar appears with the animated GIF ready to grab.
  - LZW compression with numeric-keyed Map (fast — no string allocation per code pair)
  - 8×8×4 uniform 256-color palette (3-bit R, 3-bit G, 2-bit B), O(1) quantization per pixel
  - Frames sub-sampled evenly from full extraction set up to configurable max (default 60)
  - Configurable GIF width (160–480px), frame delay (4–50 centiseconds)
  - NETSCAPE2.0 loop extension for infinite loop
  - File size shown on download bar before saving

### v2.0 — 2026-06-07 · Kehai Interim

- **Xinu compliance** — Google Fonts CDN import removed. System monospace stack: `ui-monospace, 'Cascadia Code', 'Fira Mono', 'Consolas', monospace`. Zero external calls.
- **Viewport** — `user-scalable=no` removed. Browser zoom restored.
- **ElasticTOK** — `SuffixAutomaton` class inline. `elasticTok()` produces ROSA CR + state count + b1.58 packed fingerprint per frame. Toggle in sidebar. ROSA label style. JSON manifest download per grid.
- **Frame deduplication** — `frameMad()` MAD comparison vs previous kept frame. Configurable threshold. Skip or mark mode. Dedup stats panel.
- **Single scratch canvas** — `#scratch-canvas` allocated once, reused for all frame draws. Eliminates N canvas allocations per grid assembly pass.
- **New label style** — ROSA option showing `F## | #.#s | ◈CR` in frame label bars.

### v1.3 — Ed Interim

- Mobile Chrome WebM blob duration=Infinity fix. `resolveDuration()` force-seeks to 1e10 and waits for `durationchange` event before proceeding.

### v1.0–1.2 — Kham / Ed Interim

- Initial implementation. Proof of concept for the ManosNowAware visual pipeline.

---

## License

MIT — ConsciousNode SoftWorks
