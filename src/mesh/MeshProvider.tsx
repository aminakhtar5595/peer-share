import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { createPeerId, suggestCallsign } from './ids';
import { MeshNode } from './node';
import { MeshSimulator } from './simulator';
import type { ChatMessage, Identity, MeshPeer, MeshStatus, PeerId } from './types';

const IDENTITY_KEY = 'relay.identity.v1';

type MeshContextValue = {
  ready: boolean;
  identity: Identity | null;
  status: MeshStatus;
  peers: MeshPeer[];
  messages: ChatMessage[];
  onlineCount: number;
  logs: string[];
  selfPosition: { x: number; y: number };
  claimCallsign: (callsign: string) => Promise<void>;
  resetIdentity: () => Promise<void>;
  sendMessage: (to: PeerId, body: string) => void;
  moveSelf: (x: number, y: number) => void;
  messagesWith: (peerId: PeerId) => ChatMessage[];
  peerById: (peerId: PeerId) => MeshPeer | undefined;
};

const MeshContext = createContext<MeshContextValue | null>(null);

export function MeshProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [peers, setPeers] = useState<MeshPeer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [selfPosition, setSelfPosition] = useState({ x: 50, y: 72 });
  const nodeRef = useRef<MeshNode | null>(null);
  const simRef = useRef<MeshSimulator | null>(null);

  const pushLog = useCallback((line: string) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString()}  ${line}`, ...prev].slice(0, 40));
  }, []);

  const teardown = useCallback(() => {
    nodeRef.current?.stop();
    nodeRef.current = null;
    simRef.current?.stop();
    simRef.current = null;
  }, []);

  const bootNode = useCallback(
    (id: Identity) => {
      teardown();
      const peer: MeshPeer = {
        id: id.id,
        callsign: id.callsign,
        x: 50,
        y: 72,
        simulated: false,
        lastSeen: Date.now(),
        online: true,
      };
      setSelfPosition({ x: peer.x, y: peer.y });
      const node = new MeshNode(peer, {
        onPeers: setPeers,
        onMessages: setMessages,
        onStatus: setOnlineCount,
        onLog: pushLog,
      });
      node.start();
      nodeRef.current = node;

      const sim = new MeshSimulator();
      sim.start(3);
      simRef.current = sim;
      pushLog(`Online as ${id.callsign}`);
    },
    [pushLog, teardown],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(IDENTITY_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as Identity;
          setIdentity(parsed);
          bootNode(parsed);
        }
      } catch {
        // Storage unavailable — continue without persisted identity
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
      teardown();
    };
    // Boot once on mount; bootNode/teardown are stable callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const claimCallsign = useCallback(
    async (callsign: string) => {
      const clean = callsign.trim().replace(/\s+/g, '');
      if (clean.length < 2) throw new Error('Callsign too short');
      const next: Identity = { id: createPeerId(), callsign: clean };
      try {
        await AsyncStorage.setItem(IDENTITY_KEY, JSON.stringify(next));
      } catch {
        // Persist is best-effort; mesh still works in-session
      }
      setIdentity(next);
      setPeers([]);
      setMessages([]);
      setLogs([]);
      bootNode(next);
    },
    [bootNode],
  );

  const resetIdentity = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(IDENTITY_KEY);
    } catch {
      // ignore
    }
    teardown();
    setIdentity(null);
    setPeers([]);
    setMessages([]);
    setOnlineCount(0);
    setLogs([]);
  }, [teardown]);

  const sendMessage = useCallback((to: PeerId, body: string) => {
    nodeRef.current?.sendChat(to, body);
  }, []);

  const moveSelf = useCallback((x: number, y: number) => {
    nodeRef.current?.moveTo(x, y);
    setSelfPosition({ x, y });
  }, []);

  const messagesWith = useCallback(
    (peerId: PeerId) => {
      return messages.filter(
        (m) =>
          (m.from === peerId && m.to === identity?.id) ||
          (m.from === identity?.id && m.to === peerId),
      );
    },
    [identity?.id, messages],
  );

  const peerById = useCallback((peerId: PeerId) => peers.find((p) => p.id === peerId), [peers]);

  const status: MeshStatus = !identity
    ? 'idle'
    : onlineCount === 0
      ? 'scanning'
      : onlineCount < 2
        ? 'degraded'
        : 'online';

  const value = useMemo<MeshContextValue>(
    () => ({
      ready,
      identity,
      status,
      peers,
      messages,
      onlineCount,
      logs,
      selfPosition,
      claimCallsign,
      resetIdentity,
      sendMessage,
      moveSelf,
      messagesWith,
      peerById,
    }),
    [
      ready,
      identity,
      status,
      peers,
      messages,
      onlineCount,
      logs,
      selfPosition,
      claimCallsign,
      resetIdentity,
      sendMessage,
      moveSelf,
      messagesWith,
      peerById,
    ],
  );

  return <MeshContext.Provider value={value}>{children}</MeshContext.Provider>;
}

export function useMesh(): MeshContextValue {
  const ctx = useContext(MeshContext);
  if (!ctx) throw new Error('useMesh must be used within MeshProvider');
  return ctx;
}

export { suggestCallsign };
