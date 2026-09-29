import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../config/api_config.dart';
import '../models/expense.dart';
import '../models/chat_message.dart';

class ApiService {
  static const Map<String, String> _defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  /// Scans a receipt image file by sending it to the backend extraction endpoint.
  static Future<ExpenseOutput> scanReceipt(
    XFile imageFile, {
    String preferredCurrency = 'USD',
  }) async {
    try {
      final bytes = await imageFile.readAsBytes();
      final base64Image = base64Encode(bytes);

      // Determine appropriate mime-type prefix
      final extension = imageFile.name.split('.').last.toLowerCase();
      final mimeType = extension == 'png'
          ? 'image/png'
          : extension == 'webp'
              ? 'image/webp'
              : 'image/jpeg';
      final dataUri = 'data:$mimeType;base64,$base64Image';

      final response = await http
          .post(
            Uri.parse(ApiConfig.scanReceiptUrl),
            headers: _defaultHeaders,
            body: jsonEncode({
              'imageUrl': dataUri,
              'preferredCurrency': preferredCurrency,
            }),
          )
          .timeout(const Duration(seconds: 35));

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode >= 200 && response.statusCode < 300 && data['success'] == true) {
        return ExpenseOutput.fromJson(data['data'] as Map<String, dynamic>);
      } else {
        throw Exception(data['error'] ?? 'Failed to extract receipt data');
      }
    } catch (e) {
      rethrow;
    }
  }

  /// Sends a natural language query to the AI Expense Assistant with optional history.
  static Future<String> askAssistant(
    String message, {
    List<ChatMessage> history = const [],
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse(ApiConfig.chatUrl),
            headers: _defaultHeaders,
            body: jsonEncode({
              'message': message,
              'history': history.map((m) => m.toJson()).toList(),
            }),
          )
          .timeout(const Duration(seconds: 30));

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode >= 200 && response.statusCode < 300 && data['success'] == true) {
        return (data['data']['reply'] as String?) ?? 'No response received from assistant.';
      } else {
        throw Exception(data['error'] ?? 'Failed to get a response from assistant');
      }
    } catch (e) {
      rethrow;
    }
  }

  /// Retrieves past transactions and pre-computed financial breakdowns.
  static Future<ExpensesSummary> fetchExpenses({
    String? category,
    String? merchantName,
    String? startDate,
    String? endDate,
    double? minAmount,
    double? maxAmount,
    int? limit,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (category != null && category != 'All Categories') queryParams['category'] = category;
      if (merchantName != null) queryParams['merchantName'] = merchantName;
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;
      if (minAmount != null) queryParams['minAmount'] = minAmount.toString();
      if (maxAmount != null) queryParams['maxAmount'] = maxAmount.toString();
      if (limit != null) queryParams['limit'] = limit.toString();

      final uri = Uri.parse(ApiConfig.expensesUrl).replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);

      final response = await http.get(uri, headers: _defaultHeaders).timeout(const Duration(seconds: 15));
      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode >= 200 && response.statusCode < 300 && data['success'] == true) {
        return ExpensesSummary.fromJson(data['data'] as Map<String, dynamic>);
      } else {
        throw Exception(data['error'] ?? 'Failed to retrieve expenses');
      }
    } catch (e) {
      rethrow;
    }
  }
}
