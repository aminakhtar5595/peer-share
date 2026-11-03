import { Link } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { distance } from '@/mesh/range';
import type { MeshPeer } from '@/mesh/types';
import { colors, radii, spacing } from '@/theme';

type Props = {
  peer: MeshPeer;
  self: { x: number; y: number };
};

export function PeerRow({ peer, self }: Props) {
  const dist = Math.round(distance(self, peer));
  const hopHint = dist <= 38 ? 'direct' : 'multi-hop';

  return (
    <Link href={`/chat/${peer.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={[styles.avatar, peer.online ? styles.avatarOn : styles.avatarOff]}>
          <Text style={styles.avatarText}>{peer.callsign.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.name}>{peer.callsign}</Text>
          <Text style={styles.sub}>
            {peer.online ? 'In mesh' : 'Fading'} · {hopHint} · ~{dist}u
            {peer.simulated ? ' · relay' : ''}
          </Text>
        </View>
        <Text style={styles.chev}>→</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOn: {
    backgroundColor: colors.teal,
  },
  avatarOff: {
    backgroundColor: colors.mute,
  },
  avatarText: {
    color: colors.white,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 13,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 16,
    color: colors.ink,
  },
  sub: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: colors.mute,
  },
  chev: {
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.teal,
    fontSize: 18,
  },
});
