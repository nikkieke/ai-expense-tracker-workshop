import 'package:flutter/material.dart';
import 'package:expense_tracker/screens/home_screen.dart';
import '../widgets/welcome_header.dart';
import '../widgets/animated_wallet_view.dart';
import '../widgets/welcome_input_form.dart';

class WelcomeScreen extends StatefulWidget {
  final void Function(String name)? onContinue;

  const WelcomeScreen({super.key, this.onContinue});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _walletYAnimation;
  late final Animation<double> _walletScaleAnimation;
  late final Animation<double> _formFadeAnimation;
  late final Animation<Offset> _formSlideAnimation;

  final TextEditingController _nameController = TextEditingController();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3800),
    );

    _walletYAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: -24.0)
            .chain(CurveTween(curve: Curves.easeInOutSine)),
        weight: 17.5,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: -24.0, end: 0.0)
            .chain(CurveTween(curve: Curves.easeInOutSine)),
        weight: 17.5,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: -24.0)
            .chain(CurveTween(curve: Curves.easeInOutSine)),
        weight: 17.5,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: -24.0, end: 0.0)
            .chain(CurveTween(curve: Curves.easeInOutSine)),
        weight: 17.5,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: -45.0)
            .chain(CurveTween(curve: Curves.easeInOutCubic)),
        weight: 30.0,
      ),
    ]).animate(_controller);

    _walletScaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 1.05)
            .chain(CurveTween(curve: Curves.easeInOutSine)),
        weight: 17.5,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.05, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOutSine)),
        weight: 17.5,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 1.05)
            .chain(CurveTween(curve: Curves.easeInOutSine)),
        weight: 17.5,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.05, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOutSine)),
        weight: 17.5,
      ),
      TweenSequenceItem(
        tween: ConstantTween<double>(1.0),
        weight: 30.0,
      ),
    ]).animate(_controller);

    _formFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.70, 1.0, curve: Curves.easeOut),
      ),
    );

    _formSlideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 0.35),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.70, 1.0, curve: Curves.easeOutCubic),
      ),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    _nameController.dispose();
    super.dispose();
  }

  void _handleContinue() {
    if (_formKey.currentState?.validate() ?? false) {
      final name = _nameController.text.trim();
      if (widget.onContinue != null) {
        widget.onContinue!(name);
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => HomeScreen(userName: name)),
        );
      }
    }
  }

  void _handleScreenTap() {
    if (_controller.value < 0.70) {
      _controller.animateTo(
        1.0,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeOutCubic,
      );
    } else {
      FocusScope.of(context).unfocus();
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;

    return Scaffold(
      body: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onTap: _handleScreenTap,
        child: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xFFFF9E44),
                Color(0xFFF37D22),
                Color(0xFFE65D06),
              ],
              stops: [0.0, 0.55, 1.0],
            ),
          ),
          child: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              physics: const BouncingScrollPhysics(),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: screenSize.height -
                      MediaQuery.of(context).padding.top -
                      MediaQuery.of(context).padding.bottom,
                ),
                child: IntrinsicHeight(
                  child: Column(
                    children: [
                      const SizedBox(height: 24),
                      const WelcomeHeader(),
                      const Spacer(),
                      AnimatedBuilder(
                        animation: _controller,
                        builder: (context, child) {
                          return AnimatedWalletView(
                            offsetY: _walletYAnimation.value,
                            scale: _walletScaleAnimation.value,
                          );
                        },
                      ),
                      const SizedBox(height: 16),
                      AnimatedBuilder(
                        animation: _controller,
                        builder: (context, child) {
                          if (_formFadeAnimation.value == 0.0) {
                            return const SizedBox(height: 180);
                          }
                          return FadeTransition(
                            opacity: _formFadeAnimation,
                            child: SlideTransition(
                              position: _formSlideAnimation,
                              child: WelcomeInputForm(
                                formKey: _formKey,
                                nameController: _nameController,
                                onContinue: _handleContinue,
                              ),
                            ),
                          );
                        },
                      ),
                      const Spacer(),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

