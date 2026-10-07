# Checkpoint 06: Automated Evaluations & Quality Benchmarks

Welcome to **Checkpoint 06** of the AI Expense Tracker Workshop!

## 🎯 Goal
Implement automated CI/CD-ready quality evaluations to test accuracy, measure latency, prevent regressions, and evaluate trade-offs between prompt engineering and model selection.

---

## 🔍 What this Checkpoint Demonstrates
1. **Golden Evaluation Dataset (`evaluations/receipts.json`)**:
   - Curated receipt test cases covering clear receipts, complex multi-line items, currency variations, and blurry images.
2. **Deterministic Quality Scoring**:
   - Accuracy criteria: exact merchant matching, total amount numerical tolerance ($\pm 0.05$), currency ISO verification, and anti-hallucination checks on unreadable images.
3. **Side-by-Side Prompt Benchmarking (`npm run eval:compare-prompts`)**:
   - Compares production high-quality prompts (with temperature 0.0 & explicit guardrails) against native low-quality prompts.
4. **Side-by-Side Model Benchmarking (`npm run eval:compare-models`)**:
   - Compares `gemini-3.5-flash-lite` against `gemini-3.1-flash-lite` on accuracy and average latency (ms).

---

## 🚀 Getting Started

### 1. Set Your API Key via CLI (Recommended)
If you haven't already exported your key in this terminal:

* **macOS / Linux (Bash / Zsh):**
  ```bash
  export GEMINI_API_KEY="your_gemini_api_key_here"
  ```
* **Windows (PowerShell):**
  ```powershell
  $env:GEMINI_API_KEY="your_gemini_api_key_here"
  ```
* **Windows (Command Prompt):**
  ```cmd
  set GEMINI_API_KEY=your_gemini_api_key_here
  ```

---

### 2. Run this Checkpoint

From the repository root:
```bash
# Run unit tests:
npm test

# Run evaluations:
npm run eval
npm run eval:compare-prompts
npm run eval:compare-models

# Start the development server:
npm run dev:cp6
```
