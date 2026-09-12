# wandering-rain (worker-wandering-rain-01aa)

> A minimal, GPU-accelerated WebGL ambient color canvas & flip clock running on Cloudflare Workers.
> 基于 Cloudflare Workers 的极简 WebGL 环境色画布与翻页时钟边缘应用。

[![Live Demo](https://img.shields.io/badge/Live_Demo-worker--wandering--rain--01aa.53.workers.dev-orange?style=flat-square&logo=cloudflare)](https://worker-wandering-rain-01aa.53.workers.dev)
[![Cloudflare Workers](https://img.shields.io/badge/Platform-Cloudflare_Workers-F38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)
[![WebGL 2](https://img.shields.io/badge/Graphics-WebGL_2-990000?style=flat-square&logo=webgl)](https://www.khronos.org/webgl/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

---

## 🌟 Overview / 概览

**worker-wandering-rain-01aa** is a lightweight, edge-native web application deployed on Cloudflare Workers. It delivers an immersive, calming ambient experience that blends generative color transitions, hardware-accelerated WebGL shaders, harmonic Web Audio, and a retro flip-board clock.

Originally designed with database-backed event logging, the project has evolved into a **100% stateless, zero-latency edge display** following architectural decoupling. Database keepalive and metrics collection have been completely migrated to the dedicated `keepalive` infrastructure, making this repository a pure, fast, and dependency-free visual experience.

---

## ✨ Features / 核心特性

- 🎨 **GPU-Accelerated WebGL Shader**: Custom GLSL fragment shader rendering smooth color blends directly on the GPU using a cubic easing interpolation formula.
- 🌈 **Perceptual Color Generation**: Intelligent HSL color distribution algorithm ensures harmonious hue transitions, avoiding murky tones while maintaining balanced brightness and saturation.
- ⏱️ **Split-Flap / Flip Clock**: Retro flip-board clock animation displaying current dynamic HEX color code, counter, and dual timezones (**UTC** & **HKT / UTC+8**).
- 🎵 **Harmonic Web Audio**: Synthesizes soft sine tones on color changes, dynamically tuning frequency (220Hz - 660Hz) relative to the luminance of the color.
- ⚡ **Zero-FOUC Edge Rendering**: Server-side rendered initial HTML with preloaded styles and SVG dynamic favicon prevents Flash of Unstyled Content (FOUC).
- 🖱️ **Interactive & Ambient Modes**: 
  - **Manual trigger**: Click, tap, or press `Space` to transition colors with cooldown protection.
  - **Ambient auto-cycle**: Random intervals (3s - 8s) automatically morph colors, with automatic sleep when the browser tab is hidden (`visibilitychange`).

---

## 🛠️ Architecture & Tech Stack / 技术栈

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | Cloudflare Workers | Edge runtime with sub-millisecond cold starts |
| **Language** | TypeScript | Type-safe edge handlers and router |
| **Graphics** | WebGL 2 / WebGL | Custom GLSL vertex & fragment shaders |
| **Audio** | Web Audio API | Client-side dynamic sine oscillator |
| **Tooling** | Wrangler + pnpm | Edge deployment and bundling |

---

## 🚀 Quick Start / 本地运行

### Prerequisites
- Node.js >= 24.18
- pnpm >= 11.19
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Installation & Development

```bash
# Clone repository
git clone https://github.com/7893/worker-wandering-rain-01aa.git
cd worker-wandering-rain-01aa

# Install dependencies
pnpm install

# Typecheck
pnpm run typecheck

# Start local edge development server
pnpm dev
```

### Deployment

Deploy directly to your Cloudflare Workers account:

```bash
pnpm deploy
```

---

## 📜 Architecture Evolution Note / 演进记录

* **v1.x (Legacy)**: Included Oracle Autonomous Database / REST SQL logging and scheduled cron keepalive tasks.
* **v2.x (Current)**: Architecture decoupled. All database dependencies and keepalive cron triggers removed in favor of a dedicated centralized keepalive worker. This project is now strictly focused on **ultra-fast, stateless WebGL visual and audio edge serving**.

---

## 📄 License

MIT
