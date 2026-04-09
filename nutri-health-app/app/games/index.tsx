/**
 * Games Hub — Grid of available games
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Audio } from 'expo-av';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { Radius } from '../../constants/Radius';
import { getHighScore } from '../../services/gameStorage';
import { GAME_ID } from '../../hooks/games/useGameEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = Spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.xl * 2 - CARD_GAP) / 2;

interface GameTile {
  id: string;
  title: string;
  emoji: string;
  description: string;
  route: string;
  available: boolean;
}

const GAMES: GameTile[] = [
  {
    id: GAME_ID,
    title: 'Meal Maker',
    emoji: '🍽️',
    description: 'Catch falling ingredients to build healthy meals!',
    route: '/games/meal-maker',
    available: true,
  },
  {
    id: 'coming-soon-1',
    title: 'Coming Soon',
    emoji: '🔒',
    description: 'More games on the way!',
    route: '',
    available: false,
  },
];

export default function GamesHubScreen() {
  const router = useRouter();
  const [highScores, setHighScores] = useState<Record<string, number>>({});
  const menuSoundRef = useRef<Audio.Sound | null>(null);

  const stopMenuMusic = useCallback(async () => {
    if (menuSoundRef.current) {
      try {
        await menuSoundRef.current.stopAsync();
        await menuSoundRef.current.unloadAsync();
      } catch (_) {}
      menuSoundRef.current = null;
    }
  }, []);

  // Play menu music when this screen is focused, stop when it loses focus
  useFocusEffect(
    useCallback(() => {
      const startMusic = async () => {
        await stopMenuMusic();
        try {
          const { sound } = await Audio.Sound.createAsync(
            require('../../assets/audio/menu-audio.mp3'),
            { isLooping: true, shouldPlay: true }
          );
          menuSoundRef.current = sound;
        } catch (_) {}
      };
      startMusic();

      return () => {
        stopMenuMusic();
      };
    }, [stopMenuMusic])
  );

  useEffect(() => {
    // Load high scores for all available games
    const loadScores = async () => {
      const scores: Record<string, number> = {};
      for (const game of GAMES) {
        if (game.available) {
          scores[game.id] = await getHighScore(game.id);
        }
      }
      setHighScores(scores);
    };
    loadScores();
  }, []);

  const handleGamePress = (game: GameTile) => {
    if (!game.available) return;
    router.push(game.route as any);
  };

  const renderGameTile = ({ item }: { item: GameTile }) => {
    const highScore = highScores[item.id] ?? 0;

    return (
      <TouchableOpacity
        style={[styles.card, !item.available && styles.cardDisabled]}
        onPress={() => handleGamePress(item)}
        activeOpacity={item.available ? 0.8 : 1}
        disabled={!item.available}
      >
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
        <Text style={[styles.cardTitle, !item.available && styles.cardTitleDisabled]}>
          {item.title}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        {item.available && highScore > 0 && (
          <View style={styles.highScoreBadge}>
            <Text style={styles.highScoreText}>⭐ Best: {highScore}</Text>
          </View>
        )}
        {!item.available && (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Games</Text>
        <Text style={styles.headerSubtitle}>Play and learn about healthy eating!</Text>
      </View>

      <FlatList
        data={GAMES}
        renderItem={renderGameTile}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.displayMedium,
    color: Colors.on_surface,
  },
  headerSubtitle: {
    ...Typography.bodyLarge,
    color: Colors.on_surface_variant,
    marginTop: Spacing.xs,
  },
  grid: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  row: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surface_container_lowest,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardDisabled: {
    backgroundColor: Colors.surface_container_high,
    opacity: 0.6,
  },
  cardEmoji: {
    fontSize: 48,
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    ...Typography.titleMedium,
    color: Colors.on_surface,
    textAlign: 'center',
  },
  cardTitleDisabled: {
    color: Colors.on_surface_variant,
  },
  cardDescription: {
    ...Typography.bodySmall,
    color: Colors.on_surface_variant,
    textAlign: 'center',
  },
  highScoreBadge: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.primary_container,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  highScoreText: {
    ...Typography.labelSmall,
    color: Colors.on_primary_container,
  },
  comingSoonBadge: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.surface_container_highest,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  comingSoonText: {
    ...Typography.labelSmall,
    color: Colors.on_surface_variant,
  },
});
