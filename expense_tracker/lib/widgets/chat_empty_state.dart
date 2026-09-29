import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ChatEmptyState extends StatelessWidget {
  final String userName;

  const ChatEmptyState({super.key, required this.userName});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: const BoxDecoration(
                color: Color(0xFFFFF1E6),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.auto_awesome_rounded,
                color: Color(0xFFF37D22),
                size: 38,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'How can I help you, $userName?',
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF2D1E16),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Ask any question about your past transactions, compare monthly totals, or explore specific categories.',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 14,
                color: Colors.grey.shade600,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
