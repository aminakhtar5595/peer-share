import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ChatMessage } from '@/mesh/types';
import { colors, radii, spacing } from '@/theme';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.direction === 'out';
  return (
    <View style={[styles.wrap, mine ? styles.mine : styles.theirs]}>
      <Text style={[styles.body, mine && styles.bodyMine]}>{message.body}</Text>
      <Text style={[styles.meta, mine && styles.metaMine]}>
        {formatTime(message.createdAt)}
        {message.hopCount > 1 ? ` · ${message.hopCount} hops` : ' · direct'}
        {mine ? ` · ${message.status}` : ''}
      </Text>
    </View>
  );
}

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.md,
    marginVertical: 4,
    gap: 4,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.teal,
    borderBottomRightRadius: 4,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: 4,
  },
  body: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 15,
    color: colors.ink,
    lineHeight: 21,
  },
  bodyMine: {
    color: colors.white,
  },
  meta: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: colors.mute,
  },
  metaMine: {
    color: 'rgba(255,255,255,0.75)',
  },
});
