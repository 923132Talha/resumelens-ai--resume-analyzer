import { useState, useEffect } from "react";
import constants, { buildPresenceChecklist, METRIC_CONFIG } from "../constants.js";
import * as pdfjslib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";

pdfjslib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function App() {
  const [aiReady, setAiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [presenceChecklist, setPresenceChecklist] = useState([]);
  const [copiedKeyword, setCopiedKeyword] = useState(null);
  const [showTextModal, setShowTextModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.puter?.ai?.chat) {
        setAiReady(true);
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const extractText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjslib.getDocument({ data: arrayBuffer }).promise;
    const pdftext = await Promise.all(
      Array.from({ length: pdf.numPages }, (_, i) =>
        pdf
          .getPage(i + 1)
          .then((page) =>
            page.getTextContent().then((tc) => tc.items.map((item) => item.str).join(" "))
          )
      )
    );
    return pdftext.join("\n").trim();
  };

  const parsejsonResponse = (reply) => {
    try {
      const match = reply.match(/\{[\s\S]*\}/);
      const parsed = match ? JSON.parse(match[0]) : {};

      if (!parsed.overallScore && !parsed.error) {
        throw new Error("Invalid AI response");
      }
      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  };

  const analyzeResume = async (text) => {
    const prompt = constants.ANALYZE_RESUME_PROMPT.replace("{{DOCUMENT_TEXT}}", text);

    const response = await window.puter.ai.chat(
      [
        { role: "system", content: "You are an elite executive resume coach and ATS specialist." },
        { role: "user", content: prompt },
      ],
      { model: "gpt-4o" }
    );
    const result = parsejsonResponse(
      typeof response === "string" ? response : response.message?.content || ""
    );
    if (result.error) throw new Error(result.error);
    return result;
  };

  const processFile = async (file) => {
    if (!file || file.type !== "application/pdf") {
      return alert("Please upload a PDF file only.");
    }
    setUploadedFile(file);
    setIsLoading(true);
    setAnalysis(null);
    setResumeText("");
    setPresenceChecklist([]);

    try {
      const text = await extractText(file);
      setResumeText(text);
      setPresenceChecklist(buildPresenceChecklist(text));
      setAnalysis(await analyzeResume(text));
    } catch (error) {
      alert(`Error: ${error.message}`);
      reset();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!aiReady) return;
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const reset = () => {
    setUploadedFile(null);
    setAnalysis(null);
    setResumeText("");
    setPresenceChecklist([]);
    setShowTextModal(false);
  };

  const copyKeyword = (kw) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 1500);
  };

  const score = parseInt(analysis?.overallScore || 0, 10);
  const scoreStrokeColor =
    score >= 8 ? "#34d399" : score >= 6 ? "#818cf8" : "#fbbf24";

  const scoreBadge =
    score >= 8
      ? { label: "Elite Tier", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/1" }
      : score >= 6
      ? { label: "Competitive", style: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" }
      : { label: "Needs Polish", style: "bg-amber-500/10 text-amber-400 border-amber-500/30" };

  const wordCount = resumeText ? resumeText.split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-[#060609] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200 font-['Calibri',_'Carlito',_'Segoe_UI',_sans-serif] antialiased relative overflow-x-hidden">
      {/* Immersive Background Gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/10 via-purple-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-cyan-600/10 via-emerald-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b15_1px,transparent_1px),linear-gradient(to_bottom,#18181b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Floating Glass Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-[#060609]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5 group cursor-pointer" onClick={reset}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-xl flex items-center gap-1.5">
                Resume<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Lens</span>
              </span>
              <span className="block text-[11px] uppercase tracking-widest text-zinc-500">
                Executive Auditor v2.5
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300 shadow-inner">
              <span className={`w-2 h-2 rounded-full ${aiReady ? "bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" : "bg-amber-400"}`} />
              {aiReady ? "GPT-4o Engine Online" : "Connecting Neural Core..."}
            </div>

            {analysis && uploadedFile && (
              <button
                onClick={reset}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 hover:scale-[1.02] cursor-pointer"
              >
                + Analyze New Resume
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 1. UPLOAD VIEW */}
        {!uploadedFile && (
          <div className="max-w-2xl mx-auto pt-10 sm:pt-16">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-6 text-xs font-semibold tracking-wider uppercase text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                Next-Gen ATS & Recruiter Intelligence
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
                Transform your resume into a{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                  hire magnet.
                </span>
              </h1>
              <p className="text-zinc-400 text-lg sm:text-xl max-w-lg mx-auto leading-relaxed">
                Upload your PDF resume for an instant institutional-grade audit, keyword gap analysis, and bullet point rewrites.
              </p>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative group rounded-3xl border-2 border-dashed transition-all duration-300 p-10 sm:p-16 text-center backdrop-blur-xl ${
                isDragging
                  ? "border-indigo-500 bg-indigo-500/15 scale-[1.01] shadow-2xl shadow-indigo-500/20"
                  : "border-zinc-800/80 bg-zinc-900/40 hover:border-indigo-500/50 hover:bg-zinc-900/60 shadow-xl"
              }`}
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

              <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-zinc-700/80 flex items-center justify-center group-hover:scale-110 group-hover:border-indigo-500/60 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-300">
                <svg className="w-9 h-9 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">
                Drop your PDF resume here
              </h3>
              <p className="text-base text-zinc-400 mb-8 max-w-sm mx-auto">
                Drag and drop your file or click below to browse your system (PDF format only).
              </p>

              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={!aiReady}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`relative z-10 inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-semibold text-base transition-all duration-200 ${
                  !aiReady
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-105 cursor-pointer"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {aiReady ? "Browse PDF Document" : "Connecting to AI..."}
              </label>
            </div>
          </div>
        )}

        {/* 2. LOADING STATE */}
        {isLoading && (
          <div className="max-w-md mx-auto mt-24 p-10 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 text-center backdrop-blur-2xl shadow-2xl">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-indigo-400">
                AI
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Auditing {uploadedFile?.name}
            </h3>
            <p className="text-base text-zinc-400 leading-relaxed">
              Analyzing layout hierarchy, evaluating impact metrics, and calculating ATS compatibility score...
            </p>
          </div>
        )}

        {/* 3. DASHBOARD RESULTS */}
        {analysis && uploadedFile && (
          <div className="space-y-6 animate-fadeIn">
            {/* Context Header Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-bold text-white">Comprehensive Audit Complete</h2>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      SUCCESS
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                    <span className="truncate max-w-[200px] sm:max-w-xs">{uploadedFile.name}</span>
                    <span>•</span>
                    <span>{wordCount} words extracted</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <button
                  onClick={() => setShowTextModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold border border-zinc-700 transition-all cursor-pointer flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Extracted Text
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold border border-zinc-700 transition-all cursor-pointer"
                >
                  New Scan
                </button>
              </div>
            </div>

            {/* BENTO GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Score Card */}
              <div className="lg:col-span-4 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 p-8 flex flex-col items-center justify-between text-center backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />

                <div className="w-full flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Overall Score
                  </span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${scoreBadge.style}`}>
                    {scoreBadge.label}
                  </span>
                </div>

                <div className="relative w-48 h-48 flex items-center justify-center my-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#27272a" strokeWidth="8" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke={scoreStrokeColor}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={326.7}
                      strokeDashoffset={326.7 - (326.7 * score) / 10}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-bold tracking-tight text-white drop-shadow-md">
                      {score}
                    </span>
                    <span className="text-xs font-bold text-zinc-500 mt-1 uppercase tracking-widest">
                      Scale of 10
                    </span>
                  </div>
                </div>

                <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
                  Calculated using AI evaluation of impact phrasing, quantified results, ATS compliance, and structural hierarchy.
                </p>
              </div>

              {/* Executive Summary & Metrics Column */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/80 p-7 backdrop-blur-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Executive Summary
                  </h3>
                  <p className="text-zinc-200 text-base sm:text-lg leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/80 p-7 flex-1 backdrop-blur-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-6">
                    Performance Metrics Breakdown
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    {METRIC_CONFIG.map((cfg, i) => {
                      const value = analysis.performanceMetrics?.[cfg.key] ?? cfg.defaultValue;
                      return (
                        <div key={i} className="group/item">
                          <div className="flex items-center justify-between text-base mb-2">
                            <span className="text-zinc-200 font-medium flex items-center gap-2">
                              <span>{cfg.icon}</span>
                              {cfg.label}
                            </span>
                            <span className="text-xs font-bold text-zinc-200 bg-zinc-800/80 px-2.5 py-0.5 rounded-md border border-zinc-700/50">
                              {value}/10
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-zinc-800/80 overflow-hidden p-0.5">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${cfg.colorClass} transition-all duration-1000`}
                              style={{ width: `${(value / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/80 p-7 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Top Strengths</h3>
                    <p className="text-sm text-zinc-400">What your resume does exceptionally well</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {analysis.strengths?.slice(0, 3).map((strength, index) => (
                    <li
                      key={index}
                      className="p-4 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/15 text-base text-zinc-200 leading-relaxed flex items-start gap-3.5 hover:bg-emerald-500/[0.06] transition-colors"
                    >
                      <span className="text-emerald-400 font-bold text-base mt-0.5">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/80 p-7 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Key Areas for Improvement</h3>
                    <p className="text-sm text-zinc-400">Critical items to fix before applying</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {analysis.improvements?.slice(0, 3).map((improvement, index) => (
                    <li
                      key={index}
                      className="p-4 rounded-2xl bg-amber-500/[0.03] border border-amber-500/15 text-base text-zinc-200 leading-relaxed flex items-start gap-3.5 hover:bg-amber-500/[0.06] transition-colors"
                    >
                      <span className="text-amber-400 font-bold text-base mt-0.5">!</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Items & Pro Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/80 p-7 backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50" />
                  Recommended Action Plan
                </h3>
                <div className="space-y-3.5">
                  {(
                    analysis.actionItems || [
                      "Optimize keyword placement for better ATS ranking",
                      "Enhance experience bullets with quantifiable metrics",
                      "Align section headers with standard industry terminology",
                    ]
                  ).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3.5 text-base text-zinc-200 p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/80"
                    >
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 mt-0.5">
                        0{index + 1}
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/80 p-7 backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400/50" />
                  Recruiter Pro Tips
                </h3>
                <div className="space-y-3.5">
                  {(
                    analysis.proTips || [
                      "Lead every bullet point with a strong, past-tense action verb",
                      "Keep descriptions concise (1-2 lines per bullet) for 6-second scans",
                      "Mirror exact phrasing from your target job description",
                    ]
                  ).map((tip, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3.5 text-base text-zinc-200 p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/80"
                    >
                      <svg className="w-4 h-4 text-violet-400 shrink-0 mt-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ATS Checklist & Keywords */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 p-7 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">ATS Compatibility Audit</h3>
                  <span className="text-xs text-zinc-500 font-semibold">PARSER CHECK</span>
                </div>
                <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
                  Automated tracking systems screen out unformatted sections. Verify your resume contains these machine-readable elements:
                </p>
                <div className="space-y-3">
                  {(presenceChecklist || []).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-base"
                    >
                      <span className="text-zinc-200">{item.label}</span>
                      {item.present ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                          ✓ Detected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20">
                          ✕ Missing
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 p-7 backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white">Recommended Keywords</h3>
                    <span className="text-xs text-zinc-500">Click tag to copy to clipboard</span>
                  </div>
                  <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                    Integrate these high-impact industry keywords naturally into your technical skills and project descriptions to increase recruiter match rate.
                  </p>

                  <div className="flex flex-wrap gap-2.5">
                    {analysis.keywords?.map((k, i) => (
                      <button
                        key={i}
                        onClick={() => copyKeyword(k)}
                        className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/70 hover:bg-indigo-600/20 border border-zinc-700/80 hover:border-indigo-500/40 text-base text-zinc-200 hover:text-indigo-300 transition-all cursor-pointer shadow-sm"
                      >
                        <span className="font-medium">{k}</span>
                        <span className="text-[11px] uppercase tracking-wider text-zinc-500 group-hover:text-indigo-400 font-semibold">
                          {copiedKeyword === k ? "Copied!" : "Copy"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-2xl bg-indigo-500/[0.05] border border-indigo-500/20 text-sm text-indigo-200/90 leading-relaxed flex items-start gap-3">
                  <span className="text-base">💡</span>
                  <div>
                    <strong className="text-indigo-300 font-semibold">Recruiter Tip:</strong> Avoid invisible keyword stuffing. Modern parsers flag white text and automatically blacklist candidate profiles.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL FOR EXTRACTED TEXT */}
        {showTextModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-3xl max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
                <div>
                  <h3 className="text-lg font-bold text-white">Extracted Resume Text</h3>
                  <p className="text-sm text-zinc-400">{uploadedFile?.name}</p>
                </div>
                <button
                  onClick={() => setShowTextModal(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-950/30">
                {resumeText}
              </div>
              <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(resumeText);
                    alert("Extracted text copied to clipboard!");
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md transition-all cursor-pointer"
                >
                  Copy All Text
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;