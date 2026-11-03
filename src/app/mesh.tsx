import { Link, Redirect, router, Stack } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MeshMap } from '@/components/MeshMap';
import { PeerRow } from '@/components/PeerRow';
import { StatusPill } from '@/components/StatusPill';
import { useMesh } from '@/mesh/MeshProvider';
import { colors, radii, spacing } from '@/theme';

export default function MeshScreen() {
  const {
    ready,
    identity,
    status,
    peers,
    onlineCount,
    logs,
    selfPosition,
    moveSelf,
    resetIdentity,
  } = useMesh();

  if (!ready) return null;
  if (!identity) return <Redirect href="/" />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/about" asChild>
              <Pressable accessibilityRole="button" style={styles.headerBtn}>
                <Text style={styles.headerBtnText}>About</Text>
              </Pressable>
            </Link>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <View style={styles.topText}>
            <Text style={styles.kicker}>You are</Text>
            <Text style={styles.callsign}>{identity.callsign}</Text>
          </View>
          <StatusPill status={status} onlineCount={onlineCount} />
        </View>

        <MeshMap
          self={{ ...selfPosition, callsign: identity.callsign }}
          peers={peers}
          onMoveSelf={moveSelf}
        />

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Nearby & reachable</Text>
          <Text style={styles.sectionSub}>
            {peers.length === 0
              ? 'Waiting for beacons…'
              : `${peers.length} peer${peers.length === 1 ? '' : 's'} in radio memory`}
          </Text>
        </View>

        <View style={styles.peerList}>
          {peers.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No peers yet</Text>
              <Text style={styles.emptyBody}>
                Simulated relays should appear within a few seconds. Or open this app in a second
                tab with another callsign.
              </Text>
            </View>
          ) : (
            peers.map((peer) => (
              <PeerRow key={peer.id} peer={peer} self={selfPosition} />
            ))
          )}
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Radio log</Text>
          <Text style={styles.sectionSub}>TX · RX · RELAY</Text>
        </View>
        <View style={styles.logBox}>
          {logs.length === 0 ? (
            <Text style={styles.logLine}>Listening on the air…</Text>
          ) : (
            logs.slice(0, 8).map((line, idx) => (
              <Text key={`${idx}-${line}`} style={styles.logLine} numberOfLines={1}>
                {line}
              </Text>
            ))
          )}
        </View>

        <Pressable
          onPress={async () => {
            await resetIdentity();
            router.replace('/');
          }}
          style={styles.leave}
        >
          <Text style={styles.leaveText}>Leave mesh / change callsign</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.fog },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  topText: { flex: 1, gap: 2 },
  kicker: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 11,
    color: colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  callsign: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 28,
    color: colors.ink,
  },
  sectionHead: {
    marginTop: spacing.sm,
    gap: 2,
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 18,
    color: colors.ink,
  },
  sectionSub: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 12,
    color: colors.mute,
  },
  peerList: {
    gap: spacing.sm,
  },
  empty: {
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    backgroundColor: colors.paper,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 16,
    color: colors.ink,
  },
  emptyBody: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.mute,
  },
  logBox: {
    backgroundColor: '#12352F',
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 6,
    minHeight: 120,
  },
  logLine: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: '#9BE7C4',
  },
  leave: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  leaveText: {
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.coral,
    fontSize: 14,
  },
  headerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBtnText: {
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.teal,
    fontSize: 15,
  },
});
