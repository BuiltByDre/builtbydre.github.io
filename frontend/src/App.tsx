import { useState } from "react";
import UploadForm, { type AnalysisResult } from "./components/UploadForm";
import Results from "./components/Results";

export default function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  function handleResult(data: AnalysisResult) {
    setResult(data);
    setError("");
    setTimeout(() => {
      document.getElementById("results-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function handleReset() {
    setResult(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <h1>ResumeAI</h1>
        <p className="tagline">
          ATS Resume Optimizer &amp; Cover Letter Generator — powered by Claude AI
        </p>
      </header>

      <main>
        {error && (
          <div className="banner banner-error" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {!result && (
          <UploadForm
            onResult={handleResult}
            onError={setError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}

        {result && (
          <section id="results-section">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <h2 style={{ margin: 0 }}>Your Results</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleReset}
              >
                ← Start Over
              </button>
            </div>
            <Results result={result} />
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Built by{" "}
          <a
            href="https://builtbydre.cloud"
            target="_blank"
            rel="noopener noreferrer"
          >
            BuiltByDre
          </a>{" "}
          · Powered by{" "}
          <a
            href="https://www.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Anthropic Claude
          </a>
        </p>
      </footer>
    </div>
  );
}
