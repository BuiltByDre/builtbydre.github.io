# ResumeAI — Frontend

React + TypeScript + Vite single-page app for the ATS Resume Optimizer.

**Production URL:** [builtbydre.cloud/umami](https://builtbydre.cloud/umami)

---

## Local Development

**Prerequisites:** Node.js 20+, backend running on `localhost:5000`

```bash
# From repo root
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api/* → localhost:5000 automatically)
npm run dev
# Open http://localhost:5173
```

No `.env` file needed for local dev — the Vite proxy in `vite.config.ts` forwards `/api/*` to the Flask backend.

---

## Production Build

The built output lands in `umami/` at the repo root (configured via `vite.config.ts`), which GitHub Pages serves at `builtbydre.cloud/umami`.

```bash
cd frontend

# Set the production API URL
cp .env.example .env
# .env contains: VITE_API_URL=https://api.builtbydre.cloud
# (this value is baked into the JS bundle at build time)

# Build
npm run build
# Output → ../umami/  (i.e. umami/ at repo root)

# Commit and push to deploy via GitHub Pages
cd ..
git add umami/
git commit -m "Rebuild frontend"
git push
```

---

## Deploy via GitHub Pages

The `umami/` folder is committed to the repo and served by GitHub Pages automatically — no separate hosting service needed.

Once the feature branch is merged to `main`:
- GitHub Pages picks up `umami/index.html`
- App is live at `https://builtbydre.cloud/umami`

---

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx                  # Root component — layout, state, routing between form/results
│   ├── main.tsx                 # React 18 createRoot entry point
│   ├── index.css                # All styles (dark GitHub palette, print stylesheet)
│   ├── vite-env.d.ts            # VITE_API_URL type declaration
│   └── components/
│       ├── UploadForm.tsx       # File drag-drop, job description textarea, submit
│       └── Results.tsx          # Editable resume/cover letter, copy/download/print buttons
├── index.html
├── package.json
├── vite.config.ts               # base: '/umami/', outDir: '../umami'
├── tsconfig.json
└── tsconfig.node.json
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Production only | Full URL of the backend, e.g. `https://api.builtbydre.cloud`. Omit for local dev (Vite proxy handles it). |

> `VITE_` prefix means Vite bakes this into the static JS bundle at build time. It is **not a secret** — it is just the public API URL.

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | DOM renderer |
| vite | ^6.1.0 | Build tool + dev server |
| @vitejs/plugin-react | ^4.3.4 | Vite React plugin (Babel fast refresh) |
| typescript | ^5.7.2 | Type checking |
