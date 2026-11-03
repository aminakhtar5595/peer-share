import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

const SECTIONS = [
  {
    title: 'What Relay is',
    body: 'A portfolio slice of offline mesh chat for React Native. Devices discover each other over a simulated radio, exchange chat packets, and relay messages when the destination is out of direct range.',
  },
  {
    title: 'Store-and-forward',
    body: 'Every chat packet carries a TTL and a hop list. Nodes that are not the destination rebroadcast the packet once, skipping loops. Delivery ACKs travel back the same way.',
  },
  {
    title: 'Radio abstraction',
    body: 'src/mesh/radio.ts is the swap point. Today it uses an in-process bus plus BroadcastChannel (web tabs). The same MeshNode API can sit on BLE or Wi‑Fi Direct without rewriting the chat UI.',
  },
  {
    title: 'Try the demo',
    body: 'Watch simulated relays appear on the map, tap to move your node, and open a chat. For a real second peer, open another browser tab, pick a new callsign, and message across tabs.',
  },
];

export default function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.brand}>Relay</Text>
      <Text style={styles.lede}>Offline mesh messaging, built to show in a portfolio.</Text>
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.card}>
          <Text style={styles.title}>{section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  brand: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 36,
    color: colors.ink,
  },
  lede: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.inkSoft,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 17,
    color: colors.ink,
  },
  body: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: colors.mute,
  },
});
