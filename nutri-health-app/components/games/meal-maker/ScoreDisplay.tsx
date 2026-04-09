/**
 * ScoreDisplay — HUD component showing score and timer
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing } from '../../../constants/Spacing';
import { Radius } from '../../../constants/Radius';

interface ScoreDisplayProps {
  score: number;
  timeRemaining: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ScoreDisplay({ score, timeRemaining }: ScoreDisplayProps) {
  const insets = useSafeAreaInsets();
  const isUrgent = timeRemaining <= 10;

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.inner}>
        <View style={styles.item}>
          <Text style={[styles.label]}>⏱</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface_container,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
    justifyContent: 'center',
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
    marginHorizontal: Spacing.md,
  },
});
