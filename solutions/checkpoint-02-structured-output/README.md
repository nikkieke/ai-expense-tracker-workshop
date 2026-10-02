# Checkpoint 02: Structured Output

Welcome to **Checkpoint 02** of the AI Expense Tracker Workshop!

## 🎯 Goal
Guarantee strongly-typed JSON responses from Gemini using Genkit Zod Schemas and deterministic temperature settings (`0.0`).

---

## 🔍 What this Checkpoint Demonstrates
1. **Schema Enforcement**: Uses `RawExpenseOutputSchema` with `output: { schema: ... }` in Genkit.
2. **Deterministic Sampling (`temperature: 0.0`)**: Greedy decoding ensures reliable, reproducible extractions.
3. **No String Parsing**: Eliminates `JSON.parse` and regex workarounds.
4. **Remaining Challenges**: While the schema is enforced, the LLM may still output logical anomalies (e.g., math discrepancies where `sum(items) != totalAmount`, currency symbols like `$` instead of `USD`, or future dates).

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
   cd solutions/checkpoint-02-structured-output
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

---

## 🧪 Testing the API

```bash
curl -X POST http://localhost:3000/api/expenses/scan-receipt \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://storage.googleapis.com/genai-assets/receipt_starbucks.jpg",
    "preferredCurrency": "USD"
  }'
```

---

## 💡 Next Step
Proceed to **`solutions/checkpoint-03-validation`** to implement post-generation defensive validation, math reconciliation, and currency ISO normalization.
