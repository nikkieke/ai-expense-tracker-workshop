# 🚀 AI Expense Tracker Workshop

Welcome to the **AI Expense Tracker Workshop** repository! This monorepo contains the progressive backend checkpoints and solutions for building an enterprise-grade AI financial assistant and receipt scanner powered by **Google Genkit** and **Gemini 3.5 & 3.1 Flash Lite**.

---

## 🧭 Monorepo Structure

```
ai-expense-tracker-workshop/
├── backend/                              # Full production backend implementation
├── expense_tracker/                      # Flutter client application
├── solutions/
│   ├── checkpoint-01-simple-ai/          # Prompt engineering & unconstrained parsing
│   ├── checkpoint-02-structured-output/  # Zod schema enforcement & deterministic output
│   ├── checkpoint-03-validation/         # Defensive validation & math reconciliation
│   ├── checkpoint-04-resilience/         # Retries, timeouts, and multi-model fallback
│   ├── checkpoint-05-tool-calling/       # Function calling & conversational assistant
│   └── checkpoint-06-evaluation/         # Golden dataset evaluation & quality benchmarks
├── package.json                          # Monorepo root workspace scripts
└── package-lock.json
```

---

## ⚡ Workspace Root Commands

You can run, test, and benchmark any checkpoint directly from the repository root without changing directories:

### 🧪 Run All Tests
```bash
npm test
```

### 🖥️ Run Checkpoint Servers
| Command | Description |
| :--- | :--- |
| `npm run dev:backend` | Start the main production backend |
| `npm run dev:cp1` | Start Checkpoint 01 (Simple AI) |
| `npm run dev:cp2` | Start Checkpoint 02 (Structured Output) |
| `npm run dev:cp3` | Start Checkpoint 03 (Validation & Math Reconciliation) |
| `npm run dev:cp4` | Start Checkpoint 04 (Resilience & Fallbacks) |
| `npm run dev:cp4:fallback` | Test Checkpoint 04 model failover simulation |
| `npm run dev:cp5` | Start Checkpoint 05 (Tool Calling & Chat Assistant) |
| `npm run dev:cp6` | Start Checkpoint 06 (Automated Evaluations) |

### 📊 Run Automated Evaluations & Benchmarks
| Command | Description |
| :--- | :--- |
| `npm run eval` | Run the standard Golden Dataset evaluation suite |
| `npm run eval:compare-prompts` | Side-by-side benchmark: Production Guardrails vs Low-Quality Prompts |
| `npm run eval:compare-models` | Side-by-side benchmark: `gemini-3.5-flash-lite` vs `gemini-3.1-flash-lite` |

---

## 🚀 Quick Start

1. **Install all dependencies once at the root:**
   ```bash
   npm install
   ```

2. **Export your Gemini API Key:**
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
