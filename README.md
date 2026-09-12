# worker-wandering-rain-01aa

A minimal, GPU-accelerated WebGL ambient color canvas and flip clock running on Cloudflare Workers.

**Live Demo:** [https://worker-wandering-rain-01aa.53.workers.dev](https://worker-wandering-rain-01aa.53.workers.dev)

---

## Features

- **WebGL Shader Transitions**: Custom GLSL fragment shader rendering smooth color blending on the GPU.
- **Perceptual Color Engine**: Generates harmonious HSL palettes with balanced luminance and saturation.
- **Flip Clock**: Retro split-flap display showing current hex code, color counter, and dual timezones (UTC & HKT).
- **Harmonic Web Audio**: Synthesizes soft sine tones tuned to color brightness.
- **Edge Native**: Zero frontend dependencies, sub-millisecond cold starts on Cloudflare Workers.

## Controls

- **Click / Tap / Space**: Morph to a new color.
- **Auto Cycle**: Automatically cycles colors at random intervals (pauses when the tab is inactive).

## Development

```bash
# Install dependencies
pnpm install

# Type check
pnpm run typecheck

# Start local dev server
pnpm dev

# Deploy to Cloudflare Workers
pnpm deploy
```

## License

MIT

