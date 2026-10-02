# Checkpoint 05: Tool Calling & Conversational AI Assistant

Welcome to **Checkpoint 05** of the AI Expense Tracker Workshop!

## 🎯 Goal
Extend the Gemini model with **Genkit Tool Calling (Function Calling)** to query financial transactions, calculate budget totals, and answer natural language expense questions.

---

## 🔍 What this Checkpoint Demonstrates
1. **Genkit Tool Definition (`ai.defineTool`)**:
   - `getExpensesTool` defines typed input & output schemas using Zod.
   - Filters transactions by category, merchant name, date range (`startDate`, `endDate`), and amount limits.
2. **Conversational Multi-Turn Flow (`askExpenseAssistantFlow`)**:
   - Manages message history (`user` and `model` roles).
   - Injects reference dates (e.g. current year and month) to resolve relative timeframes like *"last month"*, *"yesterday"*, or *"this week"*.
3. **Endpoints Added**:
   - `POST /api/chat`: Natural language assistant queries.
   - `GET /api/expenses`: Direct filtered expenses and category spending breakdowns for the Flutter UI dashboard.
4. **Unit Tests**: Full test coverage for tool filtering, multi-category aggregation, and date range arithmetic.

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
   cd solutions/checkpoint-05-tool-calling
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run Unit Tests (Validators + Resilience + Tool Calling):**
   ```bash
   npm test
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

---

## 🧪 Testing the API

### 1. Test Natural Language Chat:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How much did I spend on Groceries in September 2026?"
  }'
```

### 2. Test Expenses Filter:
```bash
curl -X GET "http://localhost:3000/api/expenses?category=Groceries"
```

---

## 💡 Next Step
Proceed to **`solutions/checkpoint-06-evaluation`** to add automated quality scoring, latency benchmarks, and side-by-side prompt & model comparisons.
