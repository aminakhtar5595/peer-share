import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MessageBubble } from '@/components/MessageBubble';
import { useMesh } from '@/mesh/MeshProvider';
import { distance } from '@/mesh/range';
import { colors, radii, spacing } from '@/theme';

export default function ChatScreen() {
  const { peerId } = useLocalSearchParams<{ peerId: string }>();
  const { ready, identity, peerById, messagesWith, sendMessage, selfPosition } = useMesh();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const peer = peerId ? peerById(peerId) : undefined;
  const messages = useMemo(() => (peerId ? messagesWith(peerId) : []), [messagesWith, peerId]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  if (!ready) return null;
  if (!identity) return <Redirect href="/" />;

  const dist = peer ? Math.round(distance(selfPosition, peer)) : null;

  const onSend = () => {
    if (!peerId || !draft.trim()) return;
    try {
      setError(null);
      sendMessage(peerId, draft);
      setDraft('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <Stack.Screen options={{ title: peer?.callsign ?? 'Peer' }} />

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {peer == null
            ? 'Peer left radio memory'
            : peer.online
              ? `In mesh · ~${dist}u · ${peer.simulated ? 'relay node' : 'peer'}`
              : `Fading · ~${dist}u`}
        </Text>
      </View>

      {!peer ? (
        <View style={styles.missing}>
          <Text style={styles.missingTitle}>Peer out of memory</Text>
          <Text style={styles.missingBody}>
            Beacons timed out. Move closer on the map or wait for the node to beacon again.
          </Text>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No packets yet</Text>
            <Text style={styles.emptyBody}>
              Send a message. If you are out of direct range, relays will store-and-forward across
              the mesh.
            </Text>
          </View>
        }
        renderItem={({ item }) => <MessageBubble message={item} />}
      />

      <View style={styles.composer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.row}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a packet…"
            placeholderTextColor={colors.mute}
            style={styles.input}
            multiline
            maxLength={500}
            onSubmitEditing={onSend}
          />
          <Pressable
            onPress={onSend}
            disabled={!draft.trim() || !peer}
            style={({ pressed }) => [
              styles.send,
              (!draft.trim() || !peer || pressed) && styles.sendDisabled,
            ]}
          >
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.fog },
  statusBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.paper,
  },
  statusText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: colors.mute,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    flexGrow: 1,
  },
  empty: {
    marginTop: spacing.xxl,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  emptyTitle: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 18,
    color: colors.ink,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.mute,
    textAlign: 'center',
  },
  missing: {
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.amberSoft,
    gap: 4,
  },
  missingTitle: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.amber,
  },
  missingBody: {
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  send: {
    backgroundColor: colors.teal,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.white,
    fontSize: 15,
  },
  error: {
    fontFamily: 'IBMPlexMono_400Regular',
    color: colors.danger,
    fontSize: 12,
  },
});
