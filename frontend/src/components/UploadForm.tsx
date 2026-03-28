import React, { useRef, useState } from "react";

export interface AnalysisResult {
  optimized_resume: string;
  cover_letter: string;
  keywords_used: string[];
  improvements: string[];
}

interface UploadFormProps {
  onResult: (result: AnalysisResult) => void;
  onError: (message: string) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
}

export default function UploadForm({
  onResult,
  onError,
  isLoading,
  setIsLoading,
}: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      onError("Please upload your resume (PDF or DOCX).");
      return;
    }

    if (!jobDescription.trim()) {
      onError("Please paste the job description.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job_description", jobDescription);

    setIsLoading(true);
    onError("");

    try {
      const endpoint = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/analyze`
        : "/api/analyze";

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        onError(data.error ?? `Server error (${response.status}). Please try again.`);
        return;
      }

      onResult(data as AnalysisResult);
    } catch {
      onError("Could not reach the server. Check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="upload-form-section">
      {/* File Upload */}
      <div className="card">
        <h2>1. Upload Your Resume</h2>
        <div
          className={`drop-zone${dragOver ? " drag-over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            aria-label="Upload resume"
            tabIndex={-1}
          />
          <span className="drop-icon">📄</span>
          <span className="drop-label">
            Drag and drop your resume here, or click to browse
            <br />
            <small>PDF or DOCX — max 5 MB</small>
          </span>
          {file && <p className="drop-filename">Selected: {file.name}</p>}
        </div>
      </div>

      {/* Job Description */}
      <div className="card">
        <h2>2. Paste the Job Description</h2>
        <label htmlFor="job-description">
          Copy and paste the full job posting
        </label>
        <textarea
          id="job-description"
          rows={10}
          placeholder="Paste the complete job description here, including required skills, responsibilities, and qualifications..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          maxLength={8000}
          required
        />
        <p
          style={{
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            marginTop: "0.35rem",
          }}
        >
          {jobDescription.length} / 8,000 characters
        </p>
      </div>

      {/* Submit */}
      <button type="submit" className="btn btn-primary" disabled={isLoading}>
        {isLoading ? (
          <>
            <span className="spinner" />
            Analyzing with AI...
          </>
        ) : (
          "Optimize My Resume"
        )}
      </button>
    </form>
  );
}
