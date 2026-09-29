import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/expense.dart';
import 'receipt_detail_dialog.dart';

class ReceiptUploadSection extends StatelessWidget {
  final bool isUploading;
  final List<ExpenseOutput> scannedReceipts;
  final VoidCallback onSnapPhoto;
  final VoidCallback onUploadFile;

  const ReceiptUploadSection({
    super.key,
    required this.isUploading,
    required this.scannedReceipts,
    required this.onSnapPhoto,
    required this.onUploadFile,
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF5EE),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.receipt_long_rounded,
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
                      'Receipt Scanner',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1E1E1E),
                      ),
                    ),
                    Text(
                      'Snap or upload receipts for real-time AI extraction',
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

          // Upload Action Buttons Box
          Container(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            decoration: BoxDecoration(
              color: const Color(0xFFFAFBFD),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFFE5E9F0),
                style: BorderStyle.solid,
                width: 1.5,
              ),
            ),
            child: isUploading
                ? Column(
                    children: [
                      const SizedBox(
                        height: 28,
                        width: 28,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Color(0xFFF37D22),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'AI is analyzing receipt...',
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFFF37D22),
                        ),
                      ),
                    ],
                  )
                : Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: onSnapPhoto,
                          icon: const Icon(Icons.camera_alt_rounded, size: 18),
                          label: Text(
                            'Snap Photo',
                            style: GoogleFonts.outfit(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFF37D22),
                            side: const BorderSide(color: Color(0xFFF37D22)),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: onUploadFile,
                          icon: const Icon(
                            Icons.cloud_upload_rounded,
                            size: 18,
                          ),
                          label: Text(
                            'Upload File',
                            style: GoogleFonts.outfit(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFF37D22),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
          ),

          if (scannedReceipts.isNotEmpty) ...[
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recently Scanned Receipts',
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF2D1E16),
                  ),
                ),
                Text(
                  'Tap item for details',
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    color: const Color(0xFFF37D22),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...scannedReceipts.map((receipt) => _buildReceiptRow(context, receipt)),
          ],
        ],
      ),
    );
  }

  Widget _buildReceiptRow(BuildContext context, ExpenseOutput receipt) {
    final isHigh = receipt.confidence == 'high';
    final isMedium = receipt.confidence == 'medium';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: const Color(0xFFF8F9FA),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: () => ReceiptDetailDialog.show(context, receipt),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isHigh
                        ? const Color(0xFFECFDF5)
                        : isMedium
                            ? const Color(0xFFFFFBEB)
                            : const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    isHigh
                        ? Icons.verified_rounded
                        : isMedium
                            ? Icons.warning_amber_rounded
                            : Icons.error_outline_rounded,
                    size: 18,
                    color: isHigh
                        ? const Color(0xFF10B981)
                        : isMedium
                            ? const Color(0xFFD97706)
                            : const Color(0xFFEF4444),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        receipt.merchantName,
                        style: GoogleFonts.outfit(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: const Color(0xFF1E1E1E),
                        ),
                      ),
                      Text(
                        '${receipt.category} • ${receipt.date} (${receipt.confidence} confidence)',
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                        ),
                      ),
                      if (receipt.warnings.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(
                            receipt.warnings.first.message,
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              color: const Color(0xFFD97706),
                              fontWeight: FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '\$${receipt.totalAmount.toStringAsFixed(2)}',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                        color: const Color(0xFF2D1E16),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Icon(
                      Icons.chevron_right_rounded,
                      size: 16,
                      color: Colors.grey.shade400,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
