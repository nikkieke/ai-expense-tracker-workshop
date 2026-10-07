import process from 'node:process';
import {
  validateAndSanitizeReceipt,
  normalizeCurrency,
  sanitizeMerchantName,
  validateAndNormalizeDate,
  validateAmountsAndLineItems,
  calibrateConfidence,
} from '../validators/receipt.validator.js';
import type { RawExpenseOutput } from '../schemas/expense.schema.js';

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

console.log('🧪 Starting Receipt Validator Unit Tests...\n');

// 1. Currency Normalization Tests
{
  const r1 = normalizeCurrency('$', 'USD');
  assert(r1.currency === 'USD' && r1.warning?.code === 'CURRENCY_NORMALIZED', 'Normalizes "$" to USD');

  const r2 = normalizeCurrency('€', 'USD');
  assert(r2.currency === 'EUR' && r2.warning?.code === 'CURRENCY_NORMALIZED', 'Normalizes "€" to EUR');

  const r3 = normalizeCurrency('₦', 'USD');
  assert(r3.currency === 'NGN' && r3.warning?.code === 'CURRENCY_NORMALIZED', 'Normalizes "₦" to NGN');

  const r4 = normalizeCurrency('USD', 'USD');
  assert(r4.currency === 'USD' && !r4.warning, 'Keeps clean ISO code "USD" without warnings');

  const r5 = normalizeCurrency('', 'GBP');
  assert(r5.currency === 'GBP' && r5.warning?.code === 'CURRENCY_FALLBACK', 'Fallbacks to preferred currency when empty');
}

// 2. Merchant Name Sanitization Tests
{
  const m1 = sanitizeMerchantName('Chipotle Mexican Grill');
  assert(m1.merchantName === 'Chipotle Mexican Grill' && !m1.warning, 'Valid merchant name preserved');

  const m2 = sanitizeMerchantName('Tax Invoice');
  assert(m2.merchantName === 'Unknown Merchant' && m2.warning?.code === 'MERCHANT_GENERIC', 'Filters generic "Tax Invoice"');

  const m3 = sanitizeMerchantName('RECEIPT');
  assert(m3.merchantName === 'Unknown Merchant' && m3.warning?.code === 'MERCHANT_GENERIC', 'Filters generic "RECEIPT"');

  const m4 = sanitizeMerchantName('A');
  assert(m4.merchantName === 'Unknown Merchant' && m4.warning?.code === 'MERCHANT_GENERIC', 'Filters too-short merchant name');
}

// 3. Date Validation Tests
{
  const todayIso = new Date().toISOString().split('T')[0];
  const d1 = validateAndNormalizeDate('2024-05-15');
  assert(d1.date === '2024-05-15' && !d1.warning, 'Valid past date preserved');

  const d2 = validateAndNormalizeDate('2035-12-31');
  assert(d2.date === todayIso && d2.warning?.code === 'FUTURE_DATE_ADJUSTED', 'Future date adjusted to today');

  const d3 = validateAndNormalizeDate('invalid-date-string');
  assert(d3.date === todayIso && d3.warning?.code === 'INVALID_DATE_FORMAT', 'Invalid date format defaulted to today');

  const d4 = validateAndNormalizeDate('1990-01-01');
  assert(d4.date === '1990-01-01' && d4.warning?.code === 'OLD_DATE_DETECTED', 'Very old date flagged with warning');
}

// 4. Amounts & Line Items Math Reconciliation Tests
{
  const a1 = validateAmountsAndLineItems(
    25.0,
    [
      { name: 'Burrito', price: 12.0, quantity: 1 },
      { name: 'Guacamole', price: 3.0, quantity: 1 },
      { name: 'Drink', price: 5.0, quantity: 1 },
    ],
    5.0
  );
  assert(a1.isMathConsistent === true && a1.warnings.length === 0, 'Matching items + tax (12+3+5+5=25) is consistent');

  const a2 = validateAmountsAndLineItems(
    50.0,
    [
      { name: 'Item A', price: 10.0, quantity: 1 },
      { name: 'Item B', price: 10.0, quantity: 1 },
    ],
    0
  );
  assert(a2.isMathConsistent === false && a2.warnings.some((w) => w.code === 'MATH_DISCREPANCY'), 'Discrepancy (20 vs 50) flags MATH_DISCREPANCY');

  const a3 = validateAmountsAndLineItems(20.0, [], 25.0);
  assert(a3.tax === null && a3.warnings.some((w) => w.code === 'TAX_ANOMALY'), 'Tax greater than total is discarded');

  const a4 = validateAmountsAndLineItems(
    0,
    [
      { name: 'Coffee', price: 4.5, quantity: 2 },
    ],
    1.0
  );
  assert(a4.totalAmount === 10.0 && a4.warnings.some((w) => w.code === 'AMOUNT_NON_POSITIVE'), 'Missing total calculated from line items');

  const a5 = validateAmountsAndLineItems(
    18.50,
    [
      { name: 'ESPRESSO', price: 6.0, quantity: 2 },
      { name: 'CROISSANT', price: 3.5, quantity: 1 },
      { name: 'OMELETTE', price: 9.0, quantity: 1 },
    ],
    1.68
  );
  assert(a5.isMathConsistent === true && a5.warnings.length === 0, 'European VAT-inclusive flat item sum (6+3.5+9=18.50) is consistent');
}

// 5. Full Pipeline & Confidence Calibration Tests
{
  const cleanReceipt: RawExpenseOutput = {
    merchantName: 'Target Store #1024',
    totalAmount: 32.50,
    currency: 'USD',
    date: '2024-06-01',
    category: 'Shopping',
    items: [
      { name: 'Notebook', price: 15.0, quantity: 2 },
    ],
    tax: 2.50,
    confidence: 'high',
    summary: 'Office supplies at Target',
  };

  const res1 = validateAndSanitizeReceipt(cleanReceipt);
  assert(res1.confidence === 'high' && res1.isMathConsistent && res1.warnings.length === 0, 'Clean receipt maintains HIGH confidence');

  const flawedReceipt: RawExpenseOutput = {
    merchantName: 'Tax Invoice',
    totalAmount: 100.0,
    currency: '₦',
    date: '2030-01-01',
    category: 'Food & Dining',
    items: [
      { name: 'Plate', price: 20.0, quantity: 1 },
    ],
    tax: 5.0,
    confidence: 'high',
  };

  const res2 = validateAndSanitizeReceipt(flawedReceipt);
  assert(res2.merchantName === 'Unknown Merchant', 'Flawed receipt sanitized merchant');
  assert(res2.currency === 'NGN', 'Flawed receipt normalized currency to NGN');
  assert(res2.confidence === 'low', 'Flawed receipt degraded confidence to LOW');
  assert(res2.warnings.length >= 3, 'Flawed receipt contains multiple descriptive warnings');
}

console.log(`\n========================================`);
console.log(`Validator Tests: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
