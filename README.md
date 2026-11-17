# ResumeLens — AI Executive Resume Auditor

**ResumeLens** is an AI-driven resume analysis and ATS compliance platform powered by **OpenAI GPT-4o**. Designed to simulate an executive technical recruiter, it parses uploaded PDF resumes, evaluates structural and content quality across five weighted metrics, and delivers an actionable roadmap to improve interview conversion rates.

## ✨ Key Features

- **Automated PDF Parsing:** Extracts and analyzes raw text from uploaded resumes (`PDF`) while checking machine-readability for Applicant Tracking Systems (ATS).
- **Multi-Dimensional Scoring Engine:** Generates an overall tier rating alongside a 5-point metric breakdown:
  - 🎨 **Formatting & Hierarchy**
  - 📝 **Content Quality & Impact Phrasing**
  - 🤖 **ATS Compatibility**
  - 🔍 **Industry Keyword Usage**
  - 📊 **Quantified Results**
- **ATS Parser Audit:** Automatically verifies standard section headings, contact info, quantified achievements, and action verb density.
- **Keyword Optimization:** Recommends high-impact, role-specific industry keywords with one-click copy functionality.
- **Actionable Recruiter Insights:** Highlights top strengths, critical areas for improvement, and a prioritized 3-step action plan.

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, Framer Motion
- **AI & NLP Engine:** OpenAI GPT-4o API
- **Document Processing:** PDF Text Extraction (`pdf-parse` / server-side parser)
- **Deployment:** Vercel