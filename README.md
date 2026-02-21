# Budget Planner

A desktop-first budget planning app built with SvelteKit + Tailwind and packaged with Tauri.

## Quick Start

Prereqs:
- Node.js (LTS recommended)
- Rust toolchain (for Tauri builds)

Install dependencies:
```bash
npm install
```

Run the web UI in dev mode:
```bash
npm run dev
```

Run Tauri (desktop) in dev mode:
```bash
npm run tauri dev
```

Build the web UI:
```bash
npm run build
```

Build the desktop app:
```bash
npm run tauri build
```

## Scripts
- `npm run dev`: Vite dev server
- `npm run build`: Production web build
- `npm run preview`: Preview the production build
- `npm run check`: Type-check + Svelte checks
- `npm run tauri`: Tauri CLI passthrough

## Project Structure
- `src/`: SvelteKit app source
- `src/routes/`: App routes
- `src/lib/`: Shared UI and utilities
- `src-tauri/`: Tauri (Rust) backend + app config

## Notes
- Static adapter is configured for SvelteKit (see `svelte.config.js`).
- Tauri configuration lives in `src-tauri/tauri.conf.json`.

## License
Private repository. All rights reserved.
