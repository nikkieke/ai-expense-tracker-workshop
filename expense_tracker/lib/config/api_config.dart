import 'dart:io';
import 'package:flutter/foundation.dart';

class ApiConfig {
  /// Custom backend URL override provided via:
  /// `flutter run --dart-define=BACKEND_URL=http://<YOUR_IP>:3000`
  static const String _customBackendUrl = String.fromEnvironment('BACKEND_URL');

  /// Resolves the base URL depending on environment override or platform:
  /// - Explicit BACKEND_URL dart-define (for physical devices over Wi-Fi / custom hosts)
  /// - Web / Desktop / iOS Simulator: http://localhost:3000
  /// - Android Emulator: http://10.0.2.2:3000
  static String get baseUrl {
    if (_customBackendUrl.isNotEmpty) {
      return _customBackendUrl.endsWith('/')
          ? _customBackendUrl.substring(0, _customBackendUrl.length - 1)
          : _customBackendUrl;
    }
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
