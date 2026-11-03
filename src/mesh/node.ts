import { createId } from './ids';
import { getSharedRadio, type MeshRadio } from './radio';
import { inRange } from './range';
import type { ChatMessage, MeshPacket, MeshPeer, PeerId } from './types';

const DEFAULT_TTL = 6;
const BEACON_MS = 2200;
const SEEN_TTL_MS = 60_000;

type NodeListeners = {
  onPeers?: (peers: MeshPeer[]) => void;
  onMessages?: (messages: ChatMessage[]) => void;
  onStatus?: (onlinePeers: number) => void;
  onLog?: (line: string) => void;
};

/**
 * One mesh node: beacon, receive, store-and-forward, deliver chat.
 */
export class MeshNode {
  readonly peer: MeshPeer;
  private radio: MeshRadio;
  private peers = new Map<PeerId, MeshPeer>();
  private seen = new Map<string, number>();
  private inbox: ChatMessage[] = [];
  private outbox: ChatMessage[] = [];
  private listeners: NodeListeners;
  private beaconTimer: ReturnType<typeof setInterval> | null = null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private unsubscribe: (() => void) | null = null;
  private running = false;

  constructor(peer: MeshPeer, listeners: NodeListeners = {}, radio: MeshRadio = getSharedRadio()) {
    this.peer = peer;
    this.listeners = listeners;
    this.radio = radio;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.unsubscribe = this.radio.subscribe((packet) => this.onAir(packet));
    this.beacon();
    this.beaconTimer = setInterval(() => this.beacon(), BEACON_MS);
    this.cleanupTimer = setInterval(() => this.sweep(), 4000);
    this.emitPeers();
  }

  stop(): void {
    this.running = false;
    if (this.beaconTimer) clearInterval(this.beaconTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  getPeers(): MeshPeer[] {
    return [...this.peers.values()].sort((a, b) => a.callsign.localeCompare(b.callsign));
  }

  getMessages(withPeer: PeerId): ChatMessage[] {
    return [...this.inbox, ...this.outbox]
      .filter((m) => (m.from === withPeer && m.to === this.peer.id) || (m.from === this.peer.id && m.to === withPeer))
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  getAllMessages(): ChatMessage[] {
    return [...this.inbox, ...this.outbox].sort((a, b) => a.createdAt - b.createdAt);
  }

  moveTo(x: number, y: number): void {
    this.peer.x = clamp(x, 4, 96);
    this.peer.y = clamp(y, 4, 96);
    this.beacon();
    this.emitPeers();
  }

  sendChat(to: PeerId, body: string): ChatMessage {
    const trimmed = body.trim();
    if (!trimmed) {
      throw new Error('Message is empty');
    }

    const message: ChatMessage = {
      id: createId('msg'),
      from: this.peer.id,
      to,
      body: trimmed,
      createdAt: Date.now(),
      hopCount: 0,
      status: 'queued',
      direction: 'out',
    };

    this.outbox.push(message);
    this.emitMessages();

    const packet: MeshPacket = {
      id: message.id,
      kind: 'chat',
      from: this.peer.id,
      to,
      body: trimmed,
      ttl: DEFAULT_TTL,
      hops: [this.peer.id],
      createdAt: message.createdAt,
    };

    this.seen.set(packet.id, Date.now());
    this.radio.transmit(packet);
    message.status = 'sent';
    this.emitMessages();
    this.listeners.onLog?.(`TX chat → ${short(to)} (${trimmed.slice(0, 28)})`);
    return message;
  }

  private beacon(): void {
    const packet: MeshPacket = {
      id: createId('bcn'),
      kind: 'beacon',
      from: this.peer.id,
      to: '*',
      body: JSON.stringify({
        callsign: this.peer.callsign,
        x: this.peer.x,
        y: this.peer.y,
        simulated: this.peer.simulated,
      }),
      ttl: 3,
      hops: [this.peer.id],
      createdAt: Date.now(),
    };
    this.radio.transmit(packet);
  }

  private onAir(packet: MeshPacket): void {
    if (!this.running) return;
    if (packet.from === this.peer.id) return;
    if (packet.hops.includes(this.peer.id)) return;
    if (this.seen.has(packet.id)) return;

    // Physical RF: only hear the previous hop if that transmitter is in range
    const previousHop = packet.hops[packet.hops.length - 1] ?? packet.from;
    if (previousHop !== packet.from) {
      const bridge = this.peers.get(previousHop);
      if (!bridge || !inRange(this.peer, bridge)) return;
    } else if (packet.kind !== 'beacon') {
      const known = this.peers.get(packet.from);
      if (!known || !inRange(this.peer, known)) return;
    }

    if (packet.kind === 'beacon') {
      this.tryBeacon(packet);
      return;
    }

    this.seen.set(packet.id, Date.now());
    const known = this.peers.get(packet.from);
    if (known) {
      known.lastSeen = Date.now();
      known.online = true;
      this.emitPeers();
    }

    if (packet.kind === 'chat') {
      this.handleChat(packet);
      return;
    }

    if (packet.kind === 'ack') {
      this.handleAck(packet);
    }
  }

  private tryBeacon(packet: MeshPacket): void {
    try {
      const payload = JSON.parse(packet.body) as {
        callsign: string;
        x: number;
        y: number;
        simulated?: boolean;
      };
      const remote: MeshPeer = {
        id: packet.from,
        callsign: payload.callsign,
        x: payload.x,
        y: payload.y,
        simulated: Boolean(payload.simulated),
        lastSeen: Date.now(),
        online: true,
      };

      // Direct beacons must be in radio range of origin
      if (packet.hops.length === 1 && !inRange(this.peer, remote)) return;

      // Relayed beacons: previous hop must be a known in-range neighbor
      if (packet.hops.length > 1) {
        const previousHop = packet.hops[packet.hops.length - 1]!;
        const bridge = this.peers.get(previousHop);
        if (!bridge || !inRange(this.peer, bridge)) return;
      }

      this.seen.set(packet.id, Date.now());
      this.peers.set(remote.id, remote);
      this.emitPeers();

      // Flood beacon further for mesh discovery
      if (packet.ttl > 1 && !packet.hops.includes(this.peer.id)) {
        const forwarded: MeshPacket = {
          ...packet,
          ttl: packet.ttl - 1,
          hops: [...packet.hops, this.peer.id],
        };
        setTimeout(() => {
          if (!this.running) return;
          this.radio.transmit(forwarded);
        }, 40 + Math.random() * 80);
      }
    } catch {
      // ignore malformed beacon
    }
  }

  private handleChat(packet: MeshPacket): void {
    const hopCount = packet.hops.length;

    if (packet.to === this.peer.id) {
      const message: ChatMessage = {
        id: packet.id,
        from: packet.from,
        to: packet.to,
        body: packet.body,
        createdAt: packet.createdAt,
        hopCount,
        status: 'delivered',
        direction: 'in',
      };
      if (!this.inbox.some((m) => m.id === message.id)) {
        this.inbox.push(message);
        this.emitMessages();
        this.listeners.onLog?.(`RX chat ← ${short(packet.from)} via ${hopCount} hop(s)`);
      }
      this.sendAck(packet);
      return;
    }

    if (packet.ttl <= 1) {
      this.listeners.onLog?.(`DROP ${short(packet.id)} ttl exhausted`);
      return;
    }

    if (packet.hops.includes(this.peer.id)) return;

    const forwarded: MeshPacket = {
      ...packet,
      ttl: packet.ttl - 1,
      hops: [...packet.hops, this.peer.id],
    };

    setTimeout(() => {
      if (!this.running) return;
      this.radio.transmit(forwarded);
      this.listeners.onLog?.(`RELAY ${short(packet.id)} hop=${forwarded.hops.length}`);
    }, 80 + Math.random() * 120);
  }

  private handleAck(packet: MeshPacket): void {
    const originalId = packet.body;
    const msg = this.outbox.find((m) => m.id === originalId);
    if (msg && msg.status !== 'delivered') {
      msg.status = 'delivered';
      msg.hopCount = packet.hops.length;
      this.emitMessages();
      this.listeners.onLog?.(`ACK for ${short(originalId)}`);
    }

    // Relay ACKs too so delivery confirmation can hop back
    if (packet.to !== this.peer.id && packet.ttl > 1 && !packet.hops.includes(this.peer.id)) {
      const forwarded: MeshPacket = {
        ...packet,
        ttl: packet.ttl - 1,
        hops: [...packet.hops, this.peer.id],
      };
      setTimeout(() => {
        if (!this.running) return;
        this.radio.transmit(forwarded);
      }, 60);
    }
  }

  private sendAck(original: MeshPacket): void {
    const ack: MeshPacket = {
      id: createId('ack'),
      kind: 'ack',
      from: this.peer.id,
      to: original.from,
      body: original.id,
      ttl: DEFAULT_TTL,
      hops: [this.peer.id],
      createdAt: Date.now(),
    };
    this.radio.transmit(ack);
  }

  private sweep(): void {
    const now = Date.now();
    for (const [id, ts] of this.seen) {
      if (now - ts > SEEN_TTL_MS) this.seen.delete(id);
    }
    let changed = false;
    for (const peer of this.peers.values()) {
      if (now - peer.lastSeen > 7000) {
        if (peer.online) {
          peer.online = false;
          changed = true;
        }
      }
      if (now - peer.lastSeen > 20000) {
        this.peers.delete(peer.id);
        changed = true;
      }
    }
    if (changed) this.emitPeers();
  }

  private emitPeers(): void {
    const peers = this.getPeers();
    this.listeners.onPeers?.(peers);
    this.listeners.onStatus?.(peers.filter((p) => p.online).length);
  }

  private emitMessages(): void {
    this.listeners.onMessages?.(this.getAllMessages());
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function short(id: string): string {
  return id.slice(-6);
}
