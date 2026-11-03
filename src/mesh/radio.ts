import type { MeshPacket } from './types';

type PacketHandler = (packet: MeshPacket) => void;

/**
 * Simulated radio layer.
 * - In-process listeners for multi-persona / bot nodes in one app
 * - BroadcastChannel on web so two browser tabs can form a real mesh
 *
 * Swap this module for BLE / Wi‑Fi Direct adapters without changing the router.
 */
const CHANNEL = 'relay-mesh-radio-v1';

export class MeshRadio {
  private localHandlers = new Set<PacketHandler>();
  private channel: BroadcastChannel | null = null;
  private closed = false;

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL);
      this.channel.onmessage = (event: MessageEvent<MeshPacket>) => {
        if (this.closed) return;
        this.fanOutLocal(event.data, false);
      };
    }
  }

  subscribe(handler: PacketHandler): () => void {
    this.localHandlers.add(handler);
    return () => {
      this.localHandlers.delete(handler);
    };
  }

  /** Transmit a packet onto the shared airwaves */
  transmit(packet: MeshPacket): void {
    if (this.closed) return;
    this.fanOutLocal(packet, true);
    this.channel?.postMessage(packet);
  }

  close(): void {
    this.closed = true;
    this.localHandlers.clear();
    this.channel?.close();
    this.channel = null;
  }

  private fanOutLocal(packet: MeshPacket, skipSelfEcho: boolean): void {
    // Local handlers always receive; callers dedupe by packet id.
    // skipSelfEcho is reserved for future directed unicast radios.
    void skipSelfEcho;
    for (const handler of this.localHandlers) {
      handler(packet);
    }
  }
}

/** Shared singleton so bots + human node share one air interface in-process */
let sharedRadio: MeshRadio | null = null;

export function getSharedRadio(): MeshRadio {
  if (!sharedRadio) sharedRadio = new MeshRadio();
  return sharedRadio;
}
