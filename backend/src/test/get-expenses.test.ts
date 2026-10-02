import process from 'node:process';
import { loadTransactions, filterExpenses } from '../tools/get-expenses.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

console.log('🧪 Starting Get-Expenses Tool & Filtering Unit Tests...\n');

const allTransactions = loadTransactions();

// 1. Data Loading Test
{
  assert(allTransactions.length >= 16, 'Successfully loaded transactions from transactions.json', `Loaded ${allTransactions.length} records`);
}

// 2. Category Filter Test (Groceries)
{
  const result = filterExpenses(allTransactions, { category: 'Groceries' });
  assert(result.count === 5, 'Found 5 total grocery transactions');
  assert(result.totalSpent === 582.45, `Total grocery spent is 582.45 (got ${result.totalSpent})`);
  assert(result.categoryBreakdown['Groceries'] === 582.45, 'Category breakdown contains Groceries sum');
}

// 3. Date Range + Category Query ("Groceries this month - Sept 2026")
{
  const result = filterExpenses(allTransactions, {
    category: 'Groceries',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
  });
  assert(result.count === 3, 'Found 3 grocery transactions in September 2026');
  assert(result.totalSpent === 418.55, `September groceries total is $418.55 (got ${result.totalSpent})`);
  assert(
    result.transactions.some((t) => t.merchantName === 'Costco Wholesale') &&
    result.transactions.some((t) => t.merchantName === 'Whole Foods Market') &&
    result.transactions.some((t) => t.merchantName === "Trader Joe's"),
    'Matches Costco, Whole Foods, and Trader Joe\'s in September'
  );
}

// 4. Merchant Substring Filter (Case-insensitive)
{
  const uberResult = filterExpenses(allTransactions, { merchantName: 'uber' });
  assert(uberResult.count === 1 && uberResult.totalSpent === 34.20, 'Found Uber rideshare transaction ($34.20)');

  const wfResult = filterExpenses(allTransactions, { merchantName: 'Whole Foods' });
  assert(wfResult.count === 2, 'Found 2 Whole Foods transactions across months');
}

// 5. Amount Range Filter
{
  const bigExpenses = filterExpenses(allTransactions, { minAmount: 100.0 });
  assert(bigExpenses.count === 3, 'Found 3 expenses >= $100 (Delta $340, Costco $215.80, Whole Foods $128.45)');
  assert(bigExpenses.totalSpent === 684.25, `Sum of large expenses is $684.25 (got ${bigExpenses.totalSpent})`);
}

// 6. Multi-Category Aggregation (August 2026)
{
  const augustExpenses = filterExpenses(allTransactions, {
    startDate: '2026-08-01',
    endDate: '2026-08-31',
  });
  assert(augustExpenses.count === 4, 'Found 4 transactions in August 2026');
  assert(augustExpenses.totalSpent === 542.40, `August total is $542.40 (got ${augustExpenses.totalSpent})`);
  assert(augustExpenses.categoryBreakdown['Travel'] === 340.00, 'August travel breakdown is $340.00');
  assert(augustExpenses.categoryBreakdown['Entertainment'] === 38.50, 'August entertainment breakdown is $38.50');
}

// 7. Multi-Category Aggregation (October 2026)
{
  const octoberExpenses = filterExpenses(allTransactions, {
    startDate: '2026-10-01',
    endDate: '2026-10-31',
  });
  assert(octoberExpenses.count === 5, 'Found 5 transactions in October 2026');
  assert(octoberExpenses.totalSpent === 148.04, `October total is $148.04 (got ${octoberExpenses.totalSpent})`);
  assert(octoberExpenses.categoryBreakdown['Utilities'] === 88.30, 'October utilities breakdown is $88.30');
  assert(octoberExpenses.categoryBreakdown['Food & Dining'] === 22.95, 'October food & dining breakdown is $22.95');
}

console.log(`\n========================================`);
console.log(`Get-Expenses Tests: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
