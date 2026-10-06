# Checkpoint 04: Production Resilience & Multi-Model Fallbacks

Welcome to **Checkpoint 04** of the AI Expense Tracker Workshop!

## 🎯 Goal
Build enterprise-grade resilience to protect against rate limits (HTTP 429), API timeouts, and transient service outages using exponential backoff, jitter, and multi-model failover.

---

## 🔍 What this Checkpoint Demonstrates
1. **Exponential Backoff & Full Jitter**: Intelligently delays retry attempts to prevent thundering herd problems.
2. **Deterministic Timeouts**: Aborts stalled model requests before clients disconnect.
3. **Multi-Model Redundancy**: If the primary model encounters repeated failures or 503 high-demand spikes, automatically falls back to `gemini-3.5-flash-lite`.
4. **Graceful Degradation**: Returns a structured fallback skeleton if all AI providers are down, keeping the client app functional.
5. **Unit Tests**: Full test suite verifying retries, jitter intervals, non-retryable 4xx rejection, and timeouts.

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

### 2. Install & Run

1. **Navigate to this folder:**
   ```bash
   cd solutions/checkpoint-04-resilience
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the Test Suite (Validators + Resilience):**
   ```bash
   npm test
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

---

### 🧪 Testing Model Failover & Retries

The server defaults to `gemini-3.6-flash`. To test exponential backoff, retry logging, and automatic failover in action:

1. Start the server with `PRIMARY_MODEL=gemini-3.8-flash` (which experiences `503 Service Unavailable` high-demand spikes after a few requests):
   ```bash
   PRIMARY_MODEL=gemini-3.8-flash npm run dev
   ```
2. Send receipt scan requests from the app or curl: observe the server logs retry attempts with exponential backoff and jitter, then gracefully fail over to `gemini-3.5-flash-lite` without failing the client request.

---

## 💡 Next Step
Proceed to **`solutions/checkpoint-05-tool-calling`** to implement Genkit Tool Calling (`ai.defineTool`) and build an interactive natural language financial assistant.
