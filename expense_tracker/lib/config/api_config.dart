import 'dart:io';
import 'package:flutter/foundation.dart';

class ApiConfig {
  /// Resolves the base URL depending on the platform (Web, Android emulator, iOS simulator, or desktop).
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:3000';
    }
    if (Platform.isAndroid) {
      // 10.0.2.2 is the special IP alias to host loopback in Android emulator
      return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
  }

  static String get scanReceiptUrl => '$baseUrl/api/expenses/scan-receipt';
  static String get chatUrl => '$baseUrl/api/chat';
  static String get expensesUrl => '$baseUrl/api/expenses';
}
