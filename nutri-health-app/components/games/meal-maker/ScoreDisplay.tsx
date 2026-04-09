/**
 * ScoreDisplay — HUD component showing score, timer, and back button.
 * During a round, shows a back arrow instead of the drawer toggle.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing } from '../../../constants/Spacing';
import { Radius } from '../../../constants/Radius';

interface ScoreDisplayProps {
  score: number;
  timeRemaining: number;
  onBack: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ScoreDisplay({ score, timeRemaining, onBack }: ScoreDisplayProps) {
  const insets = useSafeAreaInsets();
  const isUrgent = timeRemaining <= 10;

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.inner}>
        {/* Back arrow — replaces drawer toggle during a round */}
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.hudItems}>
          <View style={styles.item}>
            <Text style={styles.label}>⏱</Text>
            <Text style={[styles.value, isUrgent && styles.urgentValue]}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.item}>
            <Text style={styles.label}>⭐</Text>
            <Text style={styles.value}>{score}</Text>
          </View>
        </View>

        {/* Spacer to balance the back button */}
        <View style={styles.backButtonSpacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface_container,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 26,
    color: Colors.on_surface,
    lineHeight: 30,
  },
  backButtonSpacer: {
    width: 40,
  },
  hudItems: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  label: {
    fontSize: 22,
  },
  value: {
    ...Typography.headlineMedium,
    color: Colors.on_surface,
  },
  urgentValue: {
    color: Colors.tertiary,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.outline_variant,
    opacity: 0.4,
    marginHorizontal: Spacing.sm,
  },
});
