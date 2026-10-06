# Checkpoint 01: Simple AI

Welcome to **Checkpoint 01** of the AI Expense Tracker Workshop!

## 🎯 Goal
Understand the common pitfalls of simple LLM prompt engineering without structured output schemas or validation.

---

## 🔍 What this Checkpoint Demonstrates
1. **Unconstrained Text Generation**: The prompt asks the model to "extract JSON", leaving formatting up to chance.
2. **Temperature Variance (`temperature: 0.7`)**: Non-deterministic outputs across repeated requests.
3. **No Schema Enforcement**: Relies on string regex and `JSON.parse` to extract fields.
4. **Hallucination Risk**: When given blurry or illegible receipt photos, the model attempts to guess merchant names and amounts instead of returning safe defaults.

---

## 🚀 Getting Started

### 1. Set Your API Key via CLI (Recommended)
Set your `GEMINI_API_KEY` once in your terminal session. Setting it via the CLI applies to **all** checkpoint folders in the same terminal session:

* **macOS / Linux (Bash or Zsh):**
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

> *(Optional Alternative)* You can also copy the `.env.example` file to `.env`:
> ```bash
> cp .env.example .env
> ```

---

### 2. Install & Run

1. **Navigate to this folder:**
   ```bash
   cd solutions/checkpoint-01-simple-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:3000`.


## 💡 Next Step
Proceed to **`solutions/checkpoint-02-structured-output`** to see how Genkit Zod schemas eliminate JSON parsing errors and guarantee typed output structures.
