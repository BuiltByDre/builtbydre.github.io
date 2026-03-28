import { useState } from "react";
import type { AnalysisResult } from "./UploadForm";

interface ResultsProps {
  result: AnalysisResult;
}

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = getText();
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      onClick={handleCopy}
    >
      {copied ? "✓ Copied!" : "Copy"}
    </button>
  );
}

function DownloadButton({
  getText,
  filename,
}: {
  getText: () => string;
  filename: string;
}) {
  function handleDownload() {
    const blob = new Blob([getText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      onClick={handleDownload}
    >
      Download .txt
    </button>
  );
}

export default function Results({ result }: ResultsProps) {
  const [resume, setResume] = useState(result.optimized_resume);
  const [coverLetter, setCoverLetter] = useState(result.cover_letter);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="results-grid">
      <div className="banner banner-success">
        <span>✓</span>
        <span>
          Your resume has been optimized. Review and edit the results below,
          then copy or download them.
        </span>
      </div>

      {/* Optimized Resume */}
      <div className="card">
        <h2>Optimized Resume</h2>
        <div className="result-block">
          <label htmlFor="optimized-resume">
            Edit directly in the text area below
          </label>
          <textarea
            id="optimized-resume"
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            spellCheck={true}
          />
        </div>
        <div className="result-actions">
          <CopyButton getText={() => resume} />
          <DownloadButton
            getText={() => resume}
            filename="optimized-resume.txt"
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePrint}
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Cover Letter */}
      <div className="card">
        <h2>Cover Letter</h2>
        <div className="result-block">
          <label htmlFor="cover-letter">
            Edit directly in the text area below
          </label>
          <textarea
            id="cover-letter"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            spellCheck={true}
          />
        </div>
        <div className="result-actions">
          <CopyButton getText={() => coverLetter} />
          <DownloadButton
            getText={() => coverLetter}
            filename="cover-letter.txt"
          />
        </div>
      </div>

      {/* ATS Keywords */}
      {result.keywords_used.length > 0 && (
        <div className="card">
          <h2>ATS Keywords Embedded</h2>
          <ul className="keywords-list">
            {result.keywords_used.map((kw, i) => (
              <li key={i} className="keyword-tag">
                {kw}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements Made */}
      {result.improvements.length > 0 && (
        <div className="card">
          <h2>Improvements Made</h2>
          <ul className="improvements-list">
            {result.improvements.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
