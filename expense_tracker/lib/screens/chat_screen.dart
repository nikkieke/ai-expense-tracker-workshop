import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/chat_message.dart';
import '../services/api_service.dart';
import '../utils/error_helper.dart';
import '../widgets/chat_empty_state.dart';
import '../widgets/chat_input_bar.dart';
import '../widgets/chat_message_bubble.dart';
import '../widgets/chat_prompt_suggestions.dart';
import '../widgets/chat_thinking_bubble.dart';

class ChatScreen extends StatefulWidget {
  final String userName;

  const ChatScreen({super.key, required this.userName});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isThinking = false;

  final List<String> _suggestedPrompts = [
    'How much did I spend on Groceries this month?',
    'What was my largest purchase recently?',
    'How much did I spend on Food & Dining?',
    'Summarize my travel and transportation costs',
  ];

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  Future<void> _handleSendMessage([String? prefilledText]) async {
    final queryText = prefilledText ?? _textController.text.trim();
    if (queryText.isEmpty || _isThinking) return;

    if (prefilledText == null) {
      _textController.clear();
    }

    setState(() {
      _messages.add(ChatMessage(role: 'user', content: queryText));
      _isThinking = true;
    });
    _scrollToBottom();

    try {
      final reply = await ApiService.askAssistant(
        queryText,
        history: _messages,
      );

      if (!mounted) return;
      setState(() {
        _messages.add(ChatMessage(role: 'model', content: reply));
      });
    } catch (e) {
      if (!mounted) return;
      final friendlyError = ErrorHelper.getUserFriendlyMessage(
        e,
        defaultAction: 'Please check your connection and try again.',
      );
      setState(() {
        _messages.add(
          ChatMessage(
            role: 'model',
            content: '⚠️ **Unable to complete query**\n\n$friendlyError',
          ),
        );
      });
    } finally {
      if (mounted) {
        setState(() {
          _isThinking = false;
        });
        _scrollToBottom();
      }
    }
  }

  void _clearChat() {
    if (_messages.isEmpty) return;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text(
          'Clear Conversation?',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
        ),
        content: Text(
          'This will clear the current chat history with the assistant.',
          style: GoogleFonts.outfit(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              'Cancel',
              style: GoogleFonts.outfit(color: Colors.grey.shade600),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              setState(() {
                _messages.clear();
              });
            },
            child: Text(
              'Clear',
              style: GoogleFonts.outfit(
                color: const Color(0xFFEF4444),
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        shadowColor: Colors.black.withValues(alpha: 0.04),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          color: const Color(0xFF2D1E16),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFF9E44), Color(0xFFF37D22)],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.auto_awesome_rounded,
                color: Colors.white,
                size: 18,
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'AI Expense Assistant',
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF2D1E16),
                  ),
                ),
                Row(
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        color: Color(0xFF10B981),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'Ready to answer questions',
                      style: GoogleFonts.outfit(
                        fontSize: 11.5,
                        color: Colors.grey.shade500,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
        actions: [
          if (_messages.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep_outlined, size: 22),
              color: Colors.grey.shade600,
              tooltip: 'Clear Chat',
              onPressed: _clearChat,
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Chat Messages List
            Expanded(
              child: _messages.isEmpty
                  ? ChatEmptyState(userName: widget.userName)
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      itemCount: _messages.length + (_isThinking ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index == _messages.length && _isThinking) {
                          return const ChatThinkingBubble();
                        }
                        final msg = _messages[index];
                        return ChatMessageBubble(message: msg);
                      },
                    ),
            ),

            // Prompt Suggestion Chips (shown when few messages)
            if (_messages.length <= 2)
              ChatPromptSuggestions(
                prompts: _suggestedPrompts,
                onPromptSelected: (prompt) => _handleSendMessage(prompt),
              ),

            // Bottom Input Bar
            ChatInputBar(
              controller: _textController,
              isThinking: _isThinking,
              onSend: () => _handleSendMessage(),
            ),
          ],
        ),
      ),
    );
  }
}
