import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ExpenseCategoryInsightsSection extends StatelessWidget {
  final List<String> categories;
  final String selectedCategory;
  final bool isLoadingExpenses;
  final double calculatedTotal;
  final int transactionCount;
  final String? summaryText;
  final ValueChanged<String?> onCategoryChanged;

  const ExpenseCategoryInsightsSection({
    super.key,
    required this.categories,
    required this.selectedCategory,
    required this.isLoadingExpenses,
    required this.calculatedTotal,
    required this.transactionCount,
    required this.summaryText,
    required this.onCategoryChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            offset: const Offset(0, 4),
            blurRadius: 16,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Title
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF5EE),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.pie_chart_rounded,
                  color: Color(0xFFF37D22),
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Spending Insights',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1E1E1E),
                      ),
                    ),
                    Text(
                      'Filter transactions to review spending by category',
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Dropdown Category Selector
          Text(
            'Select Category',
            style: GoogleFonts.outfit(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            initialValue: selectedCategory,
            icon: const Icon(
              Icons.keyboard_arrow_down_rounded,
              color: Color(0xFFF37D22),
            ),
            decoration: InputDecoration(
              filled: true,
              fillColor: const Color(0xFFFAFBFD),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade200),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade200),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(
                  color: Color(0xFFF37D22),
                  width: 1.8,
                ),
              ),
            ),
            items: categories.map((String category) {
              return DropdownMenuItem<String>(
                value: category,
                child: Text(
                  category,
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                    color: const Color(0xFF1E1E1E),
                  ),
                ),
              );
            }).toList(),
            onChanged: onCategoryChanged,
          ),

          const SizedBox(height: 16),

          // Live Total & Summary Breakdown Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFFF9F5), Color(0xFFFFF1E6)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFFFDBC2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.insights_rounded,
                          color: Color(0xFFF37D22),
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          selectedCategory,
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                            color: const Color(0xFF2D1E16),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      isLoadingExpenses
                          ? '...'
                          : '\$${calculatedTotal.toStringAsFixed(2)}',
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFFE65D06),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (summaryText != null && summaryText!.isNotEmpty)
                  Text(
                    summaryText!,
                    style: GoogleFonts.outfit(
                      fontSize: 13.5,
                      color: const Color(0xFF374151),
                      height: 1.4,
                    ),
                  )
                else
                  Text(
                    '$transactionCount transaction${transactionCount == 1 ? '' : 's'} recorded in this category.',
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
