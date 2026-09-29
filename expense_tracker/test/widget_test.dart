import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:expense_tracker/main.dart';

void main() {
  testWidgets('Welcome screen renders and transitions to HomeScreen and ChatScreen',
      (WidgetTester tester) async {
    // 1. Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify title is present on WelcomeScreen
    expect(find.text('AI Expense Tracker'), findsOneWidget);

    // Fast-forward animation frames to reveal input form
    await tester.pumpAndSettle();

    // Verify form elements
    expect(find.text("What's your name?"), findsOneWidget);
    expect(find.text('Continue'), findsOneWidget);

    // 2. Enter user name and submit
    await tester.enterText(find.byType(TextFormField), 'Alex');
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    // 3. Verify transition to HomeScreen
    // Verify greeting at top right with CTA subtext
    expect(find.text('Hi Alex'), findsOneWidget);
    expect(find.text('Ready to budget? ✨'), findsOneWidget);

    // Verify Receipt Upload Section
    expect(find.text('Receipt Scanner'), findsOneWidget);
    expect(find.text('Snap Photo'), findsOneWidget);
    expect(find.text('Upload File'), findsOneWidget);

    // Verify Category Spending Insights Section
    expect(find.text('Spending Insights'), findsOneWidget);
    expect(find.text('Select Category'), findsOneWidget);

    // Verify Dedicated Ask AI Banner
    final startAiChatFinder = find.text('Start AI Chat');
    await tester.ensureVisible(startAiChatFinder);
    await tester.pumpAndSettle();

    expect(find.text('AI Financial Assistant'), findsOneWidget);
    expect(startAiChatFinder, findsOneWidget);

    // 4. Tap the Ask AI banner CTA to transition to ChatScreen
    await tester.tap(startAiChatFinder);
    await tester.pumpAndSettle();

    // Verify ChatScreen elements
    expect(find.text('AI Expense Assistant'), findsOneWidget);
    expect(find.text('Ready to answer questions'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
  });
}
