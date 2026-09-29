class ReceiptLineItem {
  final String name;
  final double? price;
  final int quantity;

  const ReceiptLineItem({
    required this.name,
    this.price,
    this.quantity = 1,
  });

  factory ReceiptLineItem.fromJson(Map<String, dynamic> json) {
    return ReceiptLineItem(
      name: json['name'] as String? ?? 'Item',
      price: json['price'] != null ? (json['price'] as num).toDouble() : null,
      quantity: json['quantity'] != null ? (json['quantity'] as num).toInt() : 1,
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'price': price,
    'quantity': quantity,
  };
}

class ValidationWarning {
  final String field;
  final String code;
  final String message;

  const ValidationWarning({
    required this.field,
    required this.code,
    required this.message,
  });

  factory ValidationWarning.fromJson(Map<String, dynamic> json) {
    return ValidationWarning(
      field: json['field'] as String? ?? 'general',
      code: json['code'] as String? ?? 'UNKNOWN',
      message: json['message'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'field': field,
    'code': code,
    'message': message,
  };
}

class ExpenseOutput {
  final String merchantName;
  final double totalAmount;
  final String currency;
  final String date;
  final String category;
  final List<ReceiptLineItem> items;
  final double? tax;
  final String confidence; // 'high' | 'medium' | 'low'
  final String summary;
  final bool isMathConsistent;
  final List<ValidationWarning> warnings;

  const ExpenseOutput({
    required this.merchantName,
    required this.totalAmount,
    required this.currency,
    required this.date,
    required this.category,
    this.items = const [],
    this.tax,
    required this.confidence,
    required this.summary,
    this.isMathConsistent = true,
    this.warnings = const [],
  });

  factory ExpenseOutput.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    final rawWarnings = json['warnings'] as List<dynamic>? ?? [];

    return ExpenseOutput(
      merchantName: json['merchantName'] as String? ?? 'Unknown Merchant',
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency'] as String? ?? 'USD',
      date: json['date'] as String? ?? DateTime.now().toIso8601String().split('T')[0],
      category: json['category'] as String? ?? 'Other',
      items: rawItems.map((e) => ReceiptLineItem.fromJson(e as Map<String, dynamic>)).toList(),
      tax: json['tax'] != null ? (json['tax'] as num).toDouble() : null,
      confidence: json['confidence'] as String? ?? 'medium',
      summary: json['summary'] as String? ?? '',
      isMathConsistent: json['isMathConsistent'] as bool? ?? true,
      warnings: rawWarnings.map((e) => ValidationWarning.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'merchantName': merchantName,
    'totalAmount': totalAmount,
    'currency': currency,
    'date': date,
    'category': category,
    'items': items.map((e) => e.toJson()).toList(),
    'tax': tax,
    'confidence': confidence,
    'summary': summary,
    'isMathConsistent': isMathConsistent,
    'warnings': warnings.map((e) => e.toJson()).toList(),
  };
}

class ExpensesSummary {
  final double totalSpent;
  final String currency;
  final int count;
  final Map<String, double> categoryBreakdown;
  final List<ExpenseOutput> transactions;

  const ExpensesSummary({
    required this.totalSpent,
    required this.currency,
    required this.count,
    required this.categoryBreakdown,
    required this.transactions,
  });

  factory ExpensesSummary.fromJson(Map<String, dynamic> json) {
    final rawTransactions = json['transactions'] as List<dynamic>? ?? [];
    final rawBreakdown = json['categoryBreakdown'] as Map<String, dynamic>? ?? {};

    final breakdown = <String, double>{};
    rawBreakdown.forEach((key, value) {
      breakdown[key] = (value as num).toDouble();
    });

    return ExpensesSummary(
      totalSpent: (json['totalSpent'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency'] as String? ?? 'USD',
      count: (json['count'] as num?)?.toInt() ?? 0,
      categoryBreakdown: breakdown,
      transactions: rawTransactions.map((e) => ExpenseOutput.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }
}
