import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../models/expense.dart';
import '../services/api_service.dart';
import '../utils/error_helper.dart';
import '../widgets/home_top_bar.dart';
import '../widgets/receipt_upload_section.dart';
import '../widgets/expense_category_insights_section.dart';
import '../widgets/ask_ai_banner.dart';
import 'chat_screen.dart';

class HomeScreen extends StatefulWidget {
  final String userName;

  const HomeScreen({super.key, required this.userName});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final List<String> _categories = [
    'All Categories',
    'Food & Dining',
    'Groceries',
    'Transportation',
    'Entertainment',
    'Utilities',
    'Shopping',
    'Travel',
    'Other',
  ];

  late String _selectedCategory;
  final ImagePicker _picker = ImagePicker();

  // State for category spending insights
  String? _categorySummaryText;
  double _calculatedTotal = 0.0;
  int _transactionCount = 0;
  bool _isLoadingExpenses = false;

  // State for Scanned Receipts
  final List<ExpenseOutput> _scannedReceipts = [];
  bool _isUploadingReceipt = false;

  @override
  void initState() {
    super.initState();
    _selectedCategory = _categories[1]; // Default to 'Food & Dining'
    _loadExpensesForCategory(_selectedCategory);
  }

  /// Loads real transaction data and calculates totals from the backend
  Future<void> _loadExpensesForCategory(String category) async {
    setState(() {
      _isLoadingExpenses = true;
    });

    try {
      final summary = await ApiService.fetchExpenses(
        category: category == 'All Categories' ? null : category,
      );

      if (!mounted) return;
      setState(() {
        _calculatedTotal = summary.totalSpent;
        _transactionCount = summary.count;
        _categorySummaryText =
            'You spent \$${summary.totalSpent.toStringAsFixed(2)} on $category across ${summary.count} transaction${summary.count == 1 ? '' : 's'}.';
      });
    } catch (e) {
      if (!mounted) return;
      // Friendly fallback if backend is unreachable
      setState(() {
        _categorySummaryText = 'Connect to the backend server to see live spending analytics.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingExpenses = false;
        });
      }
    }
  }

  /// Handles capturing and scanning a receipt via Camera or Gallery
  Future<void> _handleScanReceipt(ImageSource source) async {
    try {
      final pickedFile = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1920,
      );

      if (pickedFile == null) return;

      setState(() {
        _isUploadingReceipt = true;
      });

      final scannedExpense = await ApiService.scanReceipt(pickedFile);

      if (!mounted) return;
      setState(() {
        _scannedReceipts.insert(0, scannedExpense);
      });

      // Refresh totals
      _loadExpensesForCategory(_selectedCategory);

      final hasWarnings = scannedExpense.warnings.isNotEmpty;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: hasWarnings ? const Color(0xFFD97706) : const Color(0xFF16A34A),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          content: Row(
            children: [
              Icon(
                hasWarnings ? Icons.info_outline : Icons.check_circle_rounded,
                color: Colors.white,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  '${scannedExpense.merchantName}: \$${scannedExpense.totalAmount.toStringAsFixed(2)} extracted (${scannedExpense.confidence} confidence)',
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      final friendlyError = ErrorHelper.getUserFriendlyMessage(
        e,
        defaultAction: 'Please check your connection or try another image.',
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          content: Text(
            friendlyError,
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.w500,
              color: Colors.white,
            ),
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isUploadingReceipt = false;
        });
      }
    }
  }

  void _navigateToChat() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ChatScreen(userName: widget.userName),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(74),
        child: HomeTopBar(
          userName: widget.userName,
          ctaSubText: 'Ready to budget? ✨',
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Receipt Upload & Snap Section
              ReceiptUploadSection(
                isUploading: _isUploadingReceipt,
                scannedReceipts: _scannedReceipts,
                onSnapPhoto: () => _handleScanReceipt(ImageSource.camera),
                onUploadFile: () => _handleScanReceipt(ImageSource.gallery),
              ),

              const SizedBox(height: 24),

              // 2. Dedicated Category Insights Section (Separated from AI chat)
              ExpenseCategoryInsightsSection(
                categories: _categories,
                selectedCategory: _selectedCategory,
                isLoadingExpenses: _isLoadingExpenses,
                calculatedTotal: _calculatedTotal,
                transactionCount: _transactionCount,
                summaryText: _categorySummaryText,
                onCategoryChanged: (val) {
                  if (val != null) {
                    setState(() {
                      _selectedCategory = val;
                    });
                    _loadExpensesForCategory(val);
                  }
                },
              ),

              const SizedBox(height: 24),

              // 3. Dedicated AI Chat Assistant Banner
              AskAiBanner(onOpenChat: _navigateToChat),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
