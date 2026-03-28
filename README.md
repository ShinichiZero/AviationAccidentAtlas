# ✈ Aviation Accident Atlas

An interactive 4D globe visualising NTSB aviation accident data from 1982 to the present.

**Live:** https://aviationaccidentatlas.shinichizero.github.io/

---

## Features

| Feature | Detail |
|---|---|
| 🌍 **Globe projection** | MapTiler SDK globe mode with atmosphere & star-field |
| ⏱ **4D time slider** | Thumb-friendly slider with haptic feedback on major milestones |
| 🔴 **Severity colouring** | Red (fatal) · Orange (serious) · Blue (minor) |
| 🔵 **Smart clustering** | Supercluster — explodes to individual points on pinch-zoom |
| 📊 **D3 insight panel** | Reactive frequency chart auto-triggered by aircraft + cause filters |
| 📱 **Mobile-first UI** | Touch inertia, haptics, safe-area padding, 48 px touch targets |
| ⚡ **Static deploy** | SvelteKit + adapter-static → GitHub Pages (zero server cost) |
| 🔄 **Monthly refresh** | GitHub Action fetches latest NTSB data on the 1st of each month |

---

## Tech Stack

- **Framework**: [SvelteKit 2](https://kit.svelte.dev/) + [Vite 8](https://vite.dev/)
- **Globe**: [MapTiler SDK JS 3](https://docs.maptiler.com/sdk-js/) (globe projection, OpenStreetMap tiles)
- **Charts**: [D3.js 7](https://d3js.org/)
- **Clustering**: [Supercluster 8](https://github.com/mapbox/supercluster)
- **Hosting**: GitHub Pages via `@sveltejs/adapter-static`

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- A free [MapTiler API key](https://cloud.maptiler.com/) (100 k requests/month free)
  - Restrict the key origin to `https://aviationaccidentatlas.shinichizero.github.io`

### Local Development

```bash
# 1. Clone
git clone https://github.com/ShinichiZero/AviationAccidentAtlas.git
cd AviationAccidentAtlas

# 2. Install
npm install

# 3. Configure API key
cp .env.example .env
# Edit .env and add VITE_MAPTILER_API_KEY=<your_key>

# 4. (Optional) refresh NTSB data
node scripts/process-data.js

# 5. Start dev server
npm run dev
```

### Production Build

```bash
npm run build
# Output → build/
```

---

## Deployment (GitHub Pages)

1. Go to **Settings → Secrets → Actions** and add:
   - `MAPTILER_API_KEY` — your MapTiler API key
2. Go to **Settings → Pages** and set source to **GitHub Actions**
3. Push to `main` — the `deploy.yml` workflow builds and deploys automatically

---

## Data

Accident data is sourced from the **NTSB CAROL (Crash Analyzable Reporting On-Line) database**.  
The `scripts/process-data.js` script fetches from the NTSB Query API and outputs
a quantized GeoJSON to `static/data/accidents.geojson`.

A **GitHub Action** runs on the 1st of each month to pull the latest monthly updates.

---

## Security

- MapTiler API key is restricted to the production domain via the MapTiler dashboard
- Environment variables are never committed (`.env` is gitignored)
- Content Security Policy headers are set via `static/_headers` (Cloudflare / GitHub Pages)
- `npm audit` shows 0 vulnerabilities (`cookie` CVE mitigated via `overrides`)
