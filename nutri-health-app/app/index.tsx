import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../constants/Colors';
import { Spacing, ComponentSpacing } from '../constants/Spacing';
import { Card } from '../components/Card';
import { Display } from '../components/Typography/Display';
import { Headline } from '../components/Typography/Headline';
import { Body } from '../components/Typography/Body';

/**
 * Home Page - Daily Tracker
 * 
 * Child-friendly interface with large elements and clear visual hierarchy.
 * Uses surface layering instead of borders for section separation.
 */
export default function Index() {
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Display size="medium" color={Colors.primary}>
            Welcome! 🌟
          </Display>
          <Body size="large" color={Colors.on_surface_variant}>
            {"Let's track your healthy eating today!"}
          </Body>
        </View>

        {/* Daily Goals Card */}
        <Card elevated style={styles.goalCard}>
          <Headline size="small">{"Today's Goals"}</Headline>
          <View style={styles.goalItem}>
            <Body size="large">🍎 Fruits & Veggies</Body>
            <Body size="small" color={Colors.on_surface_variant}>
              0 / 5 servings
            </Body>
          </View>
          <View style={styles.goalItem}>
            <Body size="large">💧 Water Intake</Body>
            <Body size="small" color={Colors.on_surface_variant}>
              0 / 8 glasses
            </Body>
          </View>
          <View style={styles.goalItem}>
            <Body size="large">🥗 Healthy Meals</Body>
            <Body size="small" color={Colors.on_surface_variant}>
              0 / 3 meals
            </Body>
          </View>
        </Card>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Headline size="small">This Week</Headline>
          <Card style={styles.progressCard}>
            <Body size="medium" color={Colors.on_surface_variant}>
              📊 Track your progress throughout the week
            </Body>
            <Body size="small" color={Colors.on_surface_variant} style={styles.placeholderText}>
              [Progress chart placeholder]
            </Body>
          </Card>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.actionsSection}>
          <Headline size="small">Quick Actions</Headline>
          <Card style={styles.actionsCard}>
            <Body size="medium">🔍 Scan your food to learn more!</Body>
            <Body size="small" color={Colors.on_surface_variant}>
              Use the scanner to discover nutritional information
            </Body>
          </Card>
        </View>

        {/* Achievement Section */}
        <View style={styles.achievementSection}>
          <Headline size="small">Recent Achievements</Headline>
          <Card style={styles.achievementCard}>
            <Body size="medium" color={Colors.on_surface_variant}>
              🏆 Complete daily goals to earn badges!
            </Body>
            <Body size="small" color={Colors.on_surface_variant} style={styles.placeholderText}>
              [Achievement badges placeholder]
            </Body>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: ComponentSpacing.screen.horizontal,
    gap: Spacing['2xl'],
  },
  welcomeSection: {
    gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
  goalCard: {
    gap: Spacing.lg,
  },
  goalItem: {
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  progressSection: {
    gap: Spacing.md,
  },
  progressCard: {
    backgroundColor: Colors.surface_container_low,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsSection: {
    gap: Spacing.md,
  },
  actionsCard: {
    backgroundColor: Colors.primary_container,
    gap: Spacing.sm,
  },
  achievementSection: {
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  achievementCard: {
    backgroundColor: Colors.surface_container_low,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontStyle: 'italic',
    marginTop: Spacing.md,
  },
});
