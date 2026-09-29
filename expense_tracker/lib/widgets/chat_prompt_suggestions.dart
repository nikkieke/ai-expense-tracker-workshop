import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ChatPromptSuggestions extends StatelessWidget {
  final List<String> prompts;
  final ValueChanged<String> onPromptSelected;

  const ChatPromptSuggestions({
    super.key,
    required this.prompts,
    required this.onPromptSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 42,
      margin: const EdgeInsets.only(bottom: 8),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: prompts.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final prompt = prompts[index];
          return ActionChip(
            onPressed: () => onPromptSelected(prompt),
            backgroundColor: Colors.white,
            elevation: 0,
            side: const BorderSide(color: Color(0xFFFFDBC2)),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            avatar: const Icon(
              Icons.chat_bubble_outline_rounded,
              size: 14,
              color: Color(0xFFF37D22),
            ),
            label: Text(
              prompt,
              style: GoogleFonts.outfit(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF2D1E16),
              ),
            ),
          );
        },
      ),
    );
  }
}
