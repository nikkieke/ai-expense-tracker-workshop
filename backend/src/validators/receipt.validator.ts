import {
  ExpenseCategoryEnum,
  type ExpenseOutput,
  type RawExpenseOutput,
  type ReceiptLineItem,
  type ValidationWarning,
} from '../schemas/expense.schema.js';

const GENERIC_MERCHANT_PATTERNS = [
  /^receipt$/i,
  /^tax\s*invoice$/i,
  /^invoice$/i,
  /^customer\s*receipt$/i,
  /^sales\s*receipt$/i,
  /^cash\s*sale$/i,
  /^store$/i,
  /^merchant$/i,
  /^pos(\s*terminal)?$/i,
  /^payment\s*receipt$/i,
  /^welcome$/i,
  /^thank\s*you$/i,
  /^total$/i,
  /^unknown(\s*merchant)?$/i,
  /^n\/a$/i,
  /^null$/i,
  /^undefined$/i,
  /^bill$/i,
  /^slip$/i,
];

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '₦': 'NGN',
  '¥': 'JPY',
  '₹': 'INR',
  'R$': 'BRL',
  'CHF': 'CHF',
  'KR': 'SEK',
  'AED': 'AED',
  'SAR': 'SAR',
  'R': 'ZAR',
  'ZAR': 'ZAR',
  'KSH': 'KES',
  'KES': 'KES',
  'GHS': 'GHS',
  'GH¢': 'GHS',
  'C$': 'CAD',
  'A$': 'AUD',
  'NZ$': 'NZD',
  'S$': 'SGD',
  'HK$': 'HKD',
};

/**
 * Normalizes raw currency symbols or strings into ISO 4217 standard codes.
 */
export function normalizeCurrency(
  rawCurrency: string | undefined | null,
  preferredCurrency: string = 'USD'
): { currency: string; warning?: ValidationWarning } {
  const preferred = preferredCurrency.toUpperCase().trim();

  if (!rawCurrency || typeof rawCurrency !== 'string' || !rawCurrency.trim()) {
    return {
      currency: preferred,
      warning: {
        field: 'currency',
        code: 'CURRENCY_FALLBACK',
        message: `Currency was not identified on the receipt; defaulted to preferred currency "${preferred}".`,
      },
    };
  }

  const trimmed = rawCurrency.trim();
  const upper = trimmed.toUpperCase();

  // Direct ISO 3-letter currency match
  if (/^[A-Z]{3}$/.test(upper)) {
    return { currency: upper };
  }

  // Symbol mapping
  if (CURRENCY_SYMBOL_MAP[trimmed] || CURRENCY_SYMBOL_MAP[upper]) {
    let mapped = CURRENCY_SYMBOL_MAP[trimmed] || CURRENCY_SYMBOL_MAP[upper];

    // Handle generic '$' when preferredCurrency is a dollar variant (e.g. CAD, AUD, SGD)
    if (trimmed === '$' && ['CAD', 'AUD', 'SGD', 'NZD', 'HKD'].includes(preferred)) {
      mapped = preferred;
    }

    return {
      currency: mapped,
      warning: {
        field: 'currency',
        code: 'CURRENCY_NORMALIZED',
        message: `Currency symbol "${trimmed}" was normalized to ISO standard code "${mapped}".`,
      },
    };
  }

  // Strip common noisy characters and retry ISO match
  const stripped = upper.replace(/[^A-Z]/g, '');
  if (/^[A-Z]{3}$/.test(stripped)) {
    return {
      currency: stripped,
      warning: {
        field: 'currency',
        code: 'CURRENCY_NORMALIZED',
        message: `Currency "${rawCurrency}" was normalized to ISO standard code "${stripped}".`,
      },
    };
  }

  // Fallback if unrecognized
  return {
    currency: preferred,
    warning: {
      field: 'currency',
      code: 'CURRENCY_FALLBACK',
      message: `Unrecognized currency "${rawCurrency}" on receipt; defaulted to "${preferred}".`,
    },
  };
}

/**
 * Sanitizes merchant name by removing filler words and detecting generic placeholders.
 */
export function sanitizeMerchantName(rawMerchant: string | undefined | null): {
  merchantName: string;
  warning?: ValidationWarning;
} {
  const trimmed = (rawMerchant || '').trim();

  const isGeneric =
    trimmed.length < 2 ||
    GENERIC_MERCHANT_PATTERNS.some((pattern) => pattern.test(trimmed));

  if (isGeneric) {
    return {
      merchantName: 'Unknown Merchant',
      warning: {
        field: 'merchantName',
        code: 'MERCHANT_GENERIC',
        message: `Merchant name "${trimmed || 'empty'}" appeared generic or unclear and was set to "Unknown Merchant".`,
      },
    };
  }

  return { merchantName: trimmed };
}

/**
 * Validates transaction date format, prevents future dates, and checks for reasonable bounds.
 */
export function validateAndNormalizeDate(rawDate: string | undefined | null): {
  date: string;
  warning?: ValidationWarning;
} {
  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];

  if (!rawDate || typeof rawDate !== 'string' || !rawDate.trim()) {
    return {
      date: todayIso,
      warning: {
        field: 'date',
        code: 'INVALID_DATE_FORMAT',
        message: `Receipt date was missing and was defaulted to today (${todayIso}).`,
      },
    };
  }

  const trimmed = rawDate.trim();
  let parsedDate = new Date(trimmed);

  // If standard parse failed, try extracting YYYY-MM-DD regex pattern
  if (isNaN(parsedDate.getTime())) {
    const isoMatch = trimmed.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      parsedDate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    }
  }

  if (isNaN(parsedDate.getTime())) {
    return {
      date: todayIso,
      warning: {
        field: 'date',
        code: 'INVALID_DATE_FORMAT',
        message: `Date "${trimmed}" could not be parsed and was defaulted to today (${todayIso}).`,
      },
    };
  }

  const formattedDate = parsedDate.toISOString().split('T')[0];

  // Check future date with 24-hour buffer for timezones
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (parsedDate > tomorrow) {
    return {
      date: todayIso,
      warning: {
        field: 'date',
        code: 'FUTURE_DATE_ADJUSTED',
        message: `Date "${formattedDate}" was in the future and has been adjusted to today (${todayIso}).`,
      },
    };
  }

  // Check if date is unusually old (older than 10 years)
  const minDate = new Date(now.getFullYear() - 10, 0, 1);
  if (parsedDate < minDate) {
    return {
      date: formattedDate,
      warning: {
        field: 'date',
        code: 'OLD_DATE_DETECTED',
        message: `Date "${formattedDate}" is more than 10 years old. Please verify.`,
      },
    };
  }

  return { date: formattedDate };
}

/**
 * Validates total amount, sanitizes line items, and cross-reconciles totals with itemized sums.
 */
export function validateAmountsAndLineItems(
  totalAmount: number,
  items: ReceiptLineItem[] = [],
  tax?: number | null
): {
  totalAmount: number;
  items: ReceiptLineItem[];
  tax: number | null;
  isMathConsistent: boolean;
  warnings: ValidationWarning[];
} {
  const warnings: ValidationWarning[] = [];
  let sanitizedTotal = Number(totalAmount);
  let sanitizedTax = tax !== undefined && tax !== null ? Number(tax) : null;

  // Sanitize line items
  const sanitizedItems: ReceiptLineItem[] = (items || []).map((item) => ({
    name: (item.name || 'Item').trim() || 'Item',
    price: item.price !== null && item.price !== undefined ? Number(item.price) : null,
    quantity:
      item.quantity !== null && item.quantity !== undefined && item.quantity > 0
        ? Number(item.quantity)
        : 1,
  }));

  // Calculate sum of valid line items
  const calculatedItemsSum = sanitizedItems.reduce((acc, item) => {
    if (typeof item.price === 'number' && !isNaN(item.price)) {
      return acc + item.price * (item.quantity || 1);
    }
    return acc;
  }, 0);

  // Validate Total Amount
  if (isNaN(sanitizedTotal) || sanitizedTotal <= 0) {
    if (calculatedItemsSum > 0) {
      sanitizedTotal = Number((calculatedItemsSum + (sanitizedTax || 0)).toFixed(2));
      warnings.push({
        field: 'totalAmount',
        code: 'AMOUNT_NON_POSITIVE',
        message: `Total amount was missing or invalid; calculated ${sanitizedTotal} from line items.`,
      });
    } else {
      sanitizedTotal = 0;
      warnings.push({
        field: 'totalAmount',
        code: 'AMOUNT_NON_POSITIVE',
        message: 'Total amount is zero or negative and could not be determined from line items.',
      });
    }
  }

  // Validate Tax Amount
  if (sanitizedTax !== null) {
    if (isNaN(sanitizedTax) || sanitizedTax < 0) {
      sanitizedTax = null;
      warnings.push({
        field: 'tax',
        code: 'TAX_ANOMALY',
        message: 'Tax amount was negative or invalid and was removed.',
      });
    } else if (sanitizedTotal > 0 && sanitizedTax >= sanitizedTotal) {
      sanitizedTax = null;
      warnings.push({
        field: 'tax',
        code: 'TAX_ANOMALY',
        message: `Tax amount (${tax}) was greater than or equal to total amount (${sanitizedTotal}) and was discarded.`,
      });
    }
  }

  // Cross-Reconcile Line Items + Tax against Total Amount
  let isMathConsistent = true;
  if (sanitizedItems.length > 0 && calculatedItemsSum > 0 && sanitizedTotal > 0) {
    const expectedTotal = calculatedItemsSum + (sanitizedTax || 0);
    const diff = Math.abs(expectedTotal - sanitizedTotal);

    // Tolerance of 0.10 for rounding differences
    if (diff > 0.1) {
      isMathConsistent = false;
      warnings.push({
        field: 'items',
        code: 'MATH_DISCREPANCY',
        message: `Item sum + tax (${expectedTotal.toFixed(2)}) does not match the total amount (${sanitizedTotal.toFixed(2)}). Discrepancy: ${diff.toFixed(2)}.`,
      });
    }
  }

  return {
    totalAmount: Number(sanitizedTotal.toFixed(2)),
    items: sanitizedItems,
    tax: sanitizedTax !== null ? Number(sanitizedTax.toFixed(2)) : null,
    isMathConsistent,
    warnings,
  };
}

/**
 * Calibrates confidence based on AI self-assessment and backend validation penalties.
 */
export function calibrateConfidence(
  aiConfidence: 'high' | 'medium' | 'low',
  warnings: ValidationWarning[]
): 'high' | 'medium' | 'low' {
  let penaltyPoints = 0;

  for (const warning of warnings) {
    switch (warning.code) {
      case 'MATH_DISCREPANCY':
      case 'AMOUNT_NON_POSITIVE':
        penaltyPoints += 3;
        break;
      case 'MERCHANT_GENERIC':
        penaltyPoints += 2;
        break;
      case 'FUTURE_DATE_ADJUSTED':
      case 'INVALID_DATE_FORMAT':
      case 'CURRENCY_FALLBACK':
      case 'TAX_ANOMALY':
      case 'OLD_DATE_DETECTED':
        penaltyPoints += 1;
        break;
      default:
        penaltyPoints += 0.5;
    }
  }

  if (penaltyPoints >= 3) {
    return 'low';
  }

  if (penaltyPoints >= 1) {
    return aiConfidence === 'high' ? 'medium' : 'low';
  }

  return aiConfidence;
}

/**
 * Main validation pipeline for raw AI receipt extraction output.
 */
export function validateAndSanitizeReceipt(
  raw: RawExpenseOutput,
  options: { preferredCurrency?: string } = {}
): ExpenseOutput {
  const warnings: ValidationWarning[] = [];

  // 1. Merchant sanitization
  const merchantResult = sanitizeMerchantName(raw.merchantName);
  if (merchantResult.warning) {
    warnings.push(merchantResult.warning);
  }

  // 2. Currency normalization
  const currencyResult = normalizeCurrency(raw.currency, options.preferredCurrency);
  if (currencyResult.warning) {
    warnings.push(currencyResult.warning);
  }

  // 3. Date validation
  const dateResult = validateAndNormalizeDate(raw.date);
  if (dateResult.warning) {
    warnings.push(dateResult.warning);
  }

  // 4. Amount, tax, and line items cross-reconciliation
  const amountsResult = validateAmountsAndLineItems(raw.totalAmount, raw.items, raw.tax);
  warnings.push(...amountsResult.warnings);

  // 5. Category validation & fallback
  const categoryParsed = ExpenseCategoryEnum.safeParse(raw.category);
  const sanitizedCategory = categoryParsed.success ? categoryParsed.data : 'Other';

  // 6. Calibrate confidence
  const calibratedConfidence = calibrateConfidence(
    raw.confidence || 'medium',
    warnings
  );

  // If extraction confidence is low, append an explicit user-facing warning
  if (calibratedConfidence === 'low' && !warnings.some((w) => w.code === 'LOW_CONFIDENCE_EXTRACTION')) {
    warnings.push({
      field: 'confidence',
      code: 'LOW_CONFIDENCE_EXTRACTION',
      message: 'Receipt image appears blurry, unclear, or low resolution. Please review and verify details.',
    });
  }

  return {
    merchantName: merchantResult.merchantName,
    totalAmount: amountsResult.totalAmount,
    currency: currencyResult.currency,
    date: dateResult.date,
    category: sanitizedCategory,
    items: amountsResult.items,
    tax: amountsResult.tax,
    confidence: calibratedConfidence,
    summary: raw.summary?.trim() || `${sanitizedCategory} at ${merchantResult.merchantName}`,
    isMathConsistent: amountsResult.isMathConsistent,
    warnings,
  };
}
