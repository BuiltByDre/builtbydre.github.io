import json
import os
import re

import anthropic
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from utils.parser import extract_text

load_dotenv()

app = Flask(__name__)

# ---------------------------------------------------------------------------
# CORS — allow the Vite dev server and the production GitHub Pages domain
# ---------------------------------------------------------------------------
CORS(
    app,
    origins=[
        "http://localhost:5173",
        "https://builtbydre.cloud",
    ],
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# ---------------------------------------------------------------------------
# Anthropic client — key loaded from environment, never hard-coded
# ---------------------------------------------------------------------------
_anthropic_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

CLAUDE_MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """You are an expert resume writer and ATS optimization specialist.

Your task is to:

1. Analyze the provided job description.
2. Extract key skills, keywords, and qualifications.
3. Rewrite the candidate's resume to:
   - Match the job description
   - Improve ATS keyword alignment
   - Maintain truthfulness (DO NOT fabricate experience)
   - Use strong action verbs
   - Optimize for clarity and impact

4. Generate a tailored cover letter that:
   - Aligns with the job description
   - Highlights the candidate's most relevant experience
   - Sounds natural and confident (not robotic)
   - Is concise (3-5 paragraphs)

---

OUTPUT FORMAT (STRICT JSON):

{
  "optimized_resume": "Full rewritten resume in clean format",
  "cover_letter": "Full tailored cover letter",
  "keywords_used": ["keyword1", "keyword2"],
  "improvements": ["change 1", "change 2"]
}

---

RULES:
- Do NOT fabricate experience
- Keep resume within 1-2 pages
- Use measurable impact where possible
- Keep formatting clean
- Respond with ONLY the JSON object, no markdown fences, no extra commentary"""

# ---------------------------------------------------------------------------
# MAX upload size: 5 MB
# ---------------------------------------------------------------------------
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024


@app.route("/health", methods=["GET"])
def health():
    """Simple liveness probe used by Render health checks."""
    return jsonify({"status": "ok"}), 200


@app.route("/analyze", methods=["POST"])
def analyze():
    # -----------------------------------------------------------------------
    # 1. Validate inputs
    # -----------------------------------------------------------------------
    if "resume" not in request.files:
        return jsonify({"error": "No resume file attached. Key must be 'resume'."}), 400

    resume_file = request.files["resume"]
    job_description = request.form.get("job_description", "").strip()

    if not resume_file.filename:
        return jsonify({"error": "Resume filename is empty."}), 400

    if not job_description:
        return jsonify({"error": "job_description field is required and cannot be empty."}), 400

    if len(job_description) > 8000:
        return jsonify({"error": "job_description is too long (max 8,000 characters)."}), 400

    # -----------------------------------------------------------------------
    # 2. Parse the uploaded file
    # -----------------------------------------------------------------------
    try:
        file_bytes = resume_file.read()
        resume_text = extract_text(file_bytes, resume_file.filename)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception:
        app.logger.exception("Failed to parse uploaded resume.")
        return jsonify({"error": "Could not read the uploaded file. Ensure it is a valid PDF or DOCX."}), 500

    if not resume_text:
        return jsonify({"error": "The uploaded file appears to be empty or unreadable."}), 400

    # -----------------------------------------------------------------------
    # 3. Build user message
    # -----------------------------------------------------------------------
    user_message = (
        "INPUTS:\n\n"
        "[RESUME]\n"
        f"{resume_text}\n\n"
        "[JOB DESCRIPTION]\n"
        f"{job_description}"
    )

    # -----------------------------------------------------------------------
    # 4. Call Claude
    # -----------------------------------------------------------------------
    try:
        response = _anthropic_client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
    except anthropic.APIConnectionError:
        app.logger.exception("Could not reach Anthropic API.")
        return jsonify({"error": "Could not reach the AI service. Please try again."}), 503
    except anthropic.RateLimitError:
        return jsonify({"error": "Rate limit reached. Please wait a moment and try again."}), 429
    except anthropic.APIStatusError as exc:
        app.logger.exception("Anthropic API returned an error.")
        return jsonify({"error": f"AI service error: {exc.message}"}), 502

    # -----------------------------------------------------------------------
    # 5. Parse response JSON
    # -----------------------------------------------------------------------
    raw_content = response.content[0].text.strip()

    try:
        result = json.loads(raw_content)
    except json.JSONDecodeError:
        # Attempt to salvage JSON from within code fences if the model
        # wrapped it despite instructions.
        fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_content, re.DOTALL)
        if fence_match:
            try:
                result = json.loads(fence_match.group(1))
            except json.JSONDecodeError:
                pass
            else:
                return jsonify(result), 200

        app.logger.error("Claude returned non-JSON response: %s", raw_content[:500])
        return jsonify({"error": "The AI returned an unexpected format. Please try again."}), 500

    # Validate expected keys are present
    required_keys = {"optimized_resume", "cover_letter", "keywords_used", "improvements"}
    if not required_keys.issubset(result.keys()):
        missing = required_keys - result.keys()
        app.logger.error("Claude response missing keys: %s", missing)
        return jsonify({"error": "Incomplete response from AI. Please try again."}), 500

    return jsonify(result), 200


# ---------------------------------------------------------------------------
# Entry point for local development
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
