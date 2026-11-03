import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { MeshStatus } from '@/mesh/types';
import { colors, radii, spacing } from '@/theme';

const LABEL: Record<MeshStatus, string> = {
  idle: 'Offline',
  scanning: 'Scanning…',
  degraded: 'Thin mesh',
  online: 'Mesh live',
};

const TONE: Record<MeshStatus, { bg: string; fg: string; dot: string }> = {
  idle: { bg: '#E5E7EB', fg: colors.inkSoft, dot: colors.mute },
  scanning: { bg: colors.amberSoft, fg: colors.amber, dot: colors.amber },
  degraded: { bg: '#FFEDD5', fg: colors.coral, dot: colors.coral },
  online: { bg: '#CCFBF1', fg: colors.teal, dot: colors.tealBright },
};

export function StatusPill({ status, onlineCount }: { status: MeshStatus; onlineCount: number }) {
  const tone = TONE[status];
  return (
    <View style={[styles.wrap, { backgroundColor: tone.bg }]}>
      <View style={[styles.dot, { backgroundColor: tone.dot }]} />
      <Text style={[styles.text, { color: tone.fg }]}>
        {LABEL[status]}
        {status !== 'idle' ? ` · ${onlineCount}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.md,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 12,
  },
});
