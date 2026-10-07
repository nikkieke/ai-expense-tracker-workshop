# Checkpoint 03: Defensive Validation & Sanitization

Welcome to **Checkpoint 03** of the AI Expense Tracker Workshop!

## 🎯 Goal
Implement defensive programming on LLM outputs to reconcile math errors, normalize currencies, reject future dates, and detect blurry images safely.

---

## 🔍 What this Checkpoint Demonstrates
1. **Mathematical Reconciliation**: Verifies that `sum(line items) + tax == totalAmount` within rounding tolerances.
2. **Currency ISO Normalization**: Normalizes raw symbols (`$`, `€`, `£`, `₦`) to standard ISO codes (`USD`, `EUR`, `GBP`, `NGN`).
3. **Date Bounds Checking**: Fixes future hallucinated dates and flags anomalous dates.
4. **Confidence Calibration**: Automatically downgrades confidence and issues user warnings when validation anomalies are detected.
5. **Unit Testing**: 25 unit tests verifying all validation and sanitization edge cases.

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

# Start the development server:
npm run dev:cp3
```

---

## 💡 Next Step
Proceed to **`solutions/checkpoint-04-resilience`** to introduce exponential backoff retries, timeouts, and automatic failover to `gemini-3.1-flash-lite`.
