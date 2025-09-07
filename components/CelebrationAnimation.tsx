import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, useColorScheme } from 'react-native';
import { PartyPopper, Sparkles } from 'lucide-react-native';

interface CelebrationAnimationProps {
  visible: boolean;
  onAnimationComplete?: () => void;
}

const { width, height } = Dimensions.get('window');

export default function CelebrationAnimation({ visible, onAnimationComplete }: CelebrationAnimationProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const theme = {
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
  };

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      startCelebration();
    } else {
      resetAnimations();
    }
  }, [visible]);

  const startCelebration = () => {
    // Reset all animations
    scaleAnim.setValue(0);
    fadeAnim.setValue(0);
    confettiAnim.setValue(0);
    sparkleAnim.setValue(0);

    // Main celebration sequence
    Animated.sequence([
      // Initial scale and fade in
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      
      // Confetti burst
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      
      // Sparkles animation
      Animated.timing(sparkleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after 3 seconds
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationComplete?.();
      });
    }, 3000);
  };

  const resetAnimations = () => {
    scaleAnim.setValue(0);
    fadeAnim.setValue(0);
    confettiAnim.setValue(0);
    sparkleAnim.setValue(0);
  };


  const confettiScale = confettiAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0.8],
  });

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: theme.backgroundColor }]}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* Confetti animation */}
        <Animated.View
          style={[
            styles.confettiContainer,
            {
              opacity: confettiAnim,
              transform: [{ scale: confettiScale }],
            },
          ]}
        >
          <PartyPopper size={80} color="#FFD700" />
        </Animated.View>

        {/* Main celebration text */}
        <Text style={[styles.celebrationText, { color: theme.textColor }]}>
          🎉 Wow! Great Job! 🎉
        </Text>

        {/* Sparkles animation */}
        <Animated.View
          style={[
            styles.sparklesContainer,
            {
              opacity: sparkleOpacity,
            },
          ]}
        >
          <Sparkles size={40} color="#FFD700" style={styles.sparkle1} />
          <Sparkles size={30} color="#FF6B6B" style={styles.sparkle2} />
          <Sparkles size={35} color="#4ECDC4" style={styles.sparkle3} />
          <Sparkles size={25} color="#45B7D1" style={styles.sparkle4} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationText: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  confettiContainer: {
    position: 'absolute',
    top: -100,
    zIndex: 10,
  },
  sparklesContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  sparkle1: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  sparkle2: {
    position: 'absolute',
    top: 40,
    right: 30,
  },
  sparkle3: {
    position: 'absolute',
    bottom: 30,
    left: 40,
  },
  sparkle4: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});
