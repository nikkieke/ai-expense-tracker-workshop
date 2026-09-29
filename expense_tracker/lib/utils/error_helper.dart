class ErrorHelper {
  /// Converts any technical exception or error into a user-friendly, understandable message.
  static String getUserFriendlyMessage(dynamic error, {String defaultAction = 'Please try again.'}) {
    if (error == null) return 'An unexpected error occurred. $defaultAction';

    final message = error.toString().toLowerCase();

    if (message.contains('socketexception') ||
        message.contains('connection refused') ||
        message.contains('failed host lookup') ||
        message.contains('network is unreachable') ||
        message.contains('clientexception')) {
      return 'Unable to connect to the server. Please check your internet connection or make sure the backend is running.';
    }

    if (message.contains('timeoutexception') || message.contains('timed out')) {
      return 'The request took too long to complete. Please check your connection and try again.';
    }

    if (message.contains('400') || message.contains('bad request')) {
      return 'The request could not be processed. Please check your inputs and try again.';
    }

    if (message.contains('404') || message.contains('not found')) {
      return 'The requested resource was not found. Please try again later.';
    }

    if (message.contains('429') || message.contains('rate limit') || message.contains('quota')) {
      return 'We are receiving too many requests right now. Please wait a moment and try again.';
    }

    if (message.contains('500') ||
        message.contains('502') ||
        message.contains('503') ||
        message.contains('504') ||
        message.contains('internal server error')) {
      return 'The server encountered an issue while processing your request. Please try again shortly.';
    }

    if (message.contains('invalid image') ||
        message.contains('failed to extract') ||
        message.contains('unprocessed receipt')) {
      return 'We could not clearly read the details from this receipt. Please upload a brighter, clearer photo or enter details manually.';
    }

    // Clean up generic Exception: prefix if present without exposing raw traces
    final cleanMsg = error.toString().replaceAll(RegExp(r'^Exception:\s*'), '').trim();
    if (cleanMsg.isNotEmpty && !cleanMsg.contains('at ') && !cleanMsg.contains('{') && cleanMsg.length < 120) {
      return cleanMsg;
    }

    return 'Something went wrong while processing your request. $defaultAction';
  }
}
