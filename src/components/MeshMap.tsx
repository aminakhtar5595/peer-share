import React, { useMemo } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { inRange, RADIO_RANGE } from '@/mesh/range';
import type { MeshPeer } from '@/mesh/types';
import { colors, radii, spacing } from '@/theme';

type Props = {
  self: { x: number; y: number; callsign: string };
  peers: MeshPeer[];
  onMoveSelf?: (x: number, y: number) => void;
};

export function MeshMap({ self, peers, onMoveSelf }: Props) {
  const [size, setSize] = React.useState({ w: 1, h: 1 });

  const links = useMemo(() => {
    const nodes = [{ id: 'self', x: self.x, y: self.y }, ...peers];
    const edges: { key: string; x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        if (inRange(a, b, RADIO_RANGE)) {
          edges.push({
            key: `${a.id}-${b.id}`,
            x1: a.x,
            y1: a.y,
            x2: b.x,
            y2: b.y,
          });
        }
      }
    }
    return edges;
  }, [peers, self.x, self.y]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  const place = (x: number, y: number) => ({
    left: (x / 100) * size.w - 10,
    top: (y / 100) * size.h - 10,
  });

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <View style={styles.grid} pointerEvents="none">
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 16}%` }]} />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 16}%` }]} />
        ))}
      </View>

      {links.map((link) => {
        const x1 = (link.x1 / 100) * size.w;
        const y1 = (link.y1 / 100) * size.h;
        const x2 = (link.x2 / 100) * size.w;
        const y2 = (link.y2 / 100) * size.h;
        const length = Math.hypot(x2 - x1, y2 - y1);
        const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
        return (
          <View
            key={link.key}
            pointerEvents="none"
            style={[
              styles.link,
              {
                width: length,
                left: x1,
                top: y1,
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        );
      })}

      {peers.map((peer) => (
        <View key={peer.id} style={[styles.node, styles.peerNode, place(peer.x, peer.y)]}>
          <View style={[styles.dot, peer.online ? styles.dotOnline : styles.dotOffline]} />
          <Text style={styles.nodeLabel} numberOfLines={1}>
            {peer.callsign}
          </Text>
        </View>
      ))}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Move your node on the mesh map"
        onPress={(event) => {
          if (!onMoveSelf) return;
          const { locationX, locationY } = event.nativeEvent;
          onMoveSelf((locationX / size.w) * 100, (locationY / size.h) * 100);
        }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.node, styles.selfNode, place(self.x, self.y)]} pointerEvents="none">
        <View style={[styles.dot, styles.dotSelf]} />
        <Text style={[styles.nodeLabel, styles.selfLabel]} numberOfLines={1}>
          {self.callsign}
        </Text>
      </View>

      <Text style={styles.hint}>Tap map to reposition · links = radio range</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 220,
    borderRadius: radii.lg,
    backgroundColor: colors.mist,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  grid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.45,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.teal,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.teal,
  },
  link: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'rgba(15, 118, 110, 0.35)',
    transformOrigin: 'left center',
  },
  node: {
    position: 'absolute',
    width: 20,
    alignItems: 'center',
  },
  peerNode: {
    zIndex: 2,
  },
  selfNode: {
    zIndex: 3,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.paper,
  },
  dotOnline: {
    backgroundColor: colors.tealBright,
  },
  dotOffline: {
    backgroundColor: colors.mute,
  },
  dotSelf: {
    backgroundColor: colors.amber,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  nodeLabel: {
    marginTop: 2,
    fontSize: 9,
    fontFamily: 'IBMPlexMono_500Medium',
    color: colors.inkSoft,
    maxWidth: 72,
    textAlign: 'center',
  },
  selfLabel: {
    color: colors.ink,
    fontFamily: 'IBMPlexMono_600SemiBold',
  },
  hint: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    fontSize: 10,
    color: colors.mute,
    fontFamily: 'IBMPlexMono_400Regular',
  },
});
