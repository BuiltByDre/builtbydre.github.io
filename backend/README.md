# ResumeAI — Backend

Flask API that accepts a resume file and job description, then uses the Anthropic Claude API to return an ATS-optimized resume, cover letter, keywords, and improvement summary.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe — returns `{"status":"ok"}` |
| POST | `/analyze` | Main analysis endpoint |

### POST /analyze

**Form fields:**
- `resume` — file (PDF or DOCX, max 5 MB)
- `job_description` — string (max 8,000 chars)

**Response (200):**
```json
{
  "optimized_resume": "...",
  "cover_letter": "...",
  "keywords_used": ["keyword1", "keyword2"],
  "improvements": ["change 1", "change 2"]
}
```

---

## Local Setup

**Prerequisites:** Python 3.11+, an [Anthropic API key](https://console.anthropic.com)

```bash
# From repo root
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and paste your Anthropic API key

# Run development server
python app.py
# Listening on http://localhost:5000
```

Verify: `curl http://localhost:5000/health` → `{"status":"ok"}`

---

## Deploy to Render

A `render.yaml` is included at the repo root for one-click deployment.

### Option A — Blueprint (recommended)

1. Push this repo to GitHub (already done).
2. Go to [render.com/dashboard](https://dashboard.render.com) → **New → Blueprint**.
3. Connect the `builtbydre/builtbydre.github.io` repo.
4. Render reads `render.yaml` and pre-fills all settings.
5. When prompted, set the `ANTHROPIC_API_KEY` secret.
6. Click **Apply** — deployment starts automatically.

### Option B — Manual Web Service

1. **New → Web Service** → connect the repo.
2. **Root Directory:** `backend`
3. **Runtime:** Python 3
4. **Build Command:** `pip install -r requirements.txt`
5. **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
6. **Environment Variables:** `ANTHROPIC_API_KEY` = your key
7. **Health Check Path:** `/health`

### Custom Domain

After the service is live on Render:

1. In Render → **Settings → Custom Domains** → add `api.builtbydre.cloud`.
2. Copy the `.onrender.com` hostname Render shows.
3. In your DNS provider, add:
   ```
   Type: CNAME
   Name: api
   Value: <your-service>.onrender.com
   ```

> **Note:** Free-tier Render instances spin down after 15 min of inactivity. The first request after a cold start takes ~30 s. Upgrade to the $7/mo Starter plan for always-on behavior.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key — never committed to git |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| flask | 3.1.0 | Web framework |
| flask-cors | 5.0.0 | CORS headers for frontend |
| anthropic | 0.49.0 | Claude API client |
| pdfplumber | 0.11.4 | PDF text extraction |
| python-docx | 1.1.2 | DOCX text extraction |
| python-dotenv | 1.0.1 | `.env` file loading |
| gunicorn | 23.0.0 | Production WSGI server |
