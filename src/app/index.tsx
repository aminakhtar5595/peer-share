import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { suggestCallsign, useMesh } from '@/mesh/MeshProvider';
import { colors, radii, spacing } from '@/theme';

export default function WelcomeScreen() {
  const { ready, identity, claimCallsign } = useMesh();
  const [callsign, setCallsign] = useState(suggestCallsign());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pulse = useRef(new Animated.Value(0.35)).current;
  const rise = useRef(new Animated.Value(18)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const native = Platform.OS !== 'web';
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: native,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: native,
        }),
      ]),
    ).start();

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: native }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: native,
      }),
    ]).start();
  }, [fade, pulse, rise]);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  if (identity) {
    return <Redirect href="/mesh" />;
  }

  const onJoin = async () => {
    setBusy(true);
    setError(null);
    try {
      await claimCallsign(callsign);
      router.replace('/mesh');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join mesh');
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={['#D7EEE8', colors.fog, '#F3EFE6']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.hero}>
            <Animated.View
              style={[
                styles.radar,
                {
                  opacity: pulse,
                  transform: [
                    {
                      scale: pulse.interpolate({
                        inputRange: [0.35, 1],
                        outputRange: [0.92, 1.04],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
              <Text style={styles.brand}>Relay</Text>
              <Text style={styles.headline}>Chat across devices when the internet drops.</Text>
              <Text style={styles.support}>
                Nearby nodes form a mesh. Messages hop peer-to-peer with store-and-forward — no
                account, no cloud inbox.
              </Text>
            </Animated.View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.label}>Your callsign</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={callsign}
                onChangeText={setCallsign}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={24}
                placeholder="CedarFox-42"
                placeholderTextColor={colors.mute}
                style={styles.input}
              />
              <Pressable
                onPress={() => setCallsign(suggestCallsign())}
                style={styles.shuffle}
                accessibilityLabel="Suggest callsign"
              >
                <Text style={styles.shuffleText}>↻</Text>
              </Pressable>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              onPress={onJoin}
              disabled={busy}
              style={({ pressed }) => [styles.cta, (pressed || busy) && styles.ctaPressed]}
            >
              <Text style={styles.ctaText}>{busy ? 'Joining…' : 'Enter the mesh'}</Text>
            </Pressable>
            <Text style={styles.footnote}>
              Demo radios are simulated on-device. Open a second browser tab to mesh with a real
              peer over BroadcastChannel.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fog,
  },
  hero: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  radar: {
    position: 'absolute',
    top: 48,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: colors.tealBright,
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
  },
  brand: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 56,
    lineHeight: 58,
    color: colors.ink,
    letterSpacing: -1.5,
  },
  headline: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 22,
    lineHeight: 28,
    color: colors.inkSoft,
    maxWidth: 340,
  },
  support: {
    marginTop: spacing.sm,
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.mute,
    maxWidth: 360,
  },
  panel: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  label: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 12,
    color: colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 17,
    color: colors.ink,
  },
  shuffle: {
    width: 52,
    borderRadius: radii.md,
    backgroundColor: colors.mist,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shuffleText: {
    fontSize: 22,
    color: colors.teal,
  },
  error: {
    fontFamily: 'IBMPlexMono_400Regular',
    color: colors.danger,
    fontSize: 12,
  },
  cta: {
    marginTop: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaPressed: {
    opacity: 0.88,
  },
  ctaText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.white,
    fontSize: 16,
  },
  footnote: {
    marginTop: spacing.sm,
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: colors.mute,
  },
});
