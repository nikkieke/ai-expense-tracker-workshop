# Checkpoint 04: Production Resilience & Multi-Model Fallbacks

Welcome to **Checkpoint 04** of the AI Expense Tracker Workshop!

## 🎯 Goal
Build enterprise-grade resilience to protect against rate limits (HTTP 429), API timeouts, and transient service outages using exponential backoff, jitter, and multi-model failover.

---

## 🔍 What this Checkpoint Demonstrates
1. **Exponential Backoff & Full Jitter**: Intelligently delays retry attempts to prevent thundering herd problems.
2. **Deterministic Timeouts**: Aborts stalled model requests before clients disconnect.
3. **Multi-Model Redundancy**: If the primary model encounters repeated failures or 503 high-demand spikes, automatically falls back to `gemini-3.1-flash-lite`.
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

### 2. Run this Checkpoint

From the repository root:
```bash
# Run unit tests:
npm test

# Start the development server:
npm run dev:cp4

# Or test fallback failover:
npm run dev:cp4:fallback
```

---

### 🧪 Testing Model Failover & Retries

The server defaults to `gemini-3.5-flash-lite`. To test exponential backoff, retry logging, and automatic failover in action:

1. Start the server with fallback simulation:
   ```bash
   npm run dev:cp4:fallback
   ```
2. Send receipt scan requests from the app or curl: observe the server logs retry attempts with exponential backoff and jitter, then gracefully fail over to `gemini-3.1-flash-lite` without failing the client request.

---

## 💡 Next Step
Proceed to **`solutions/checkpoint-05-tool-calling`** to implement Genkit Tool Calling (`ai.defineTool`) and build an interactive natural language financial assistant.
