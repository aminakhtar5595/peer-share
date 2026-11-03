export type PeerId = string;

export type MeshPeer = {
  id: PeerId;
  callsign: string;
  /** Simulated radio position 0–100 on both axes */
  x: number;
  y: number;
  /** true when this peer is a local simulated bot */
  simulated: boolean;
  lastSeen: number;
  online: boolean;
};

export type PacketKind = 'beacon' | 'chat' | 'ack';

export type MeshPacket = {
  id: string;
  kind: PacketKind;
  from: PeerId;
  to: PeerId | '*';
  body: string;
  /** Remaining hops before drop */
  ttl: number;
  hops: PeerId[];
  createdAt: number;
};

export type ChatMessage = {
  id: string;
  from: PeerId;
  to: PeerId;
  body: string;
  createdAt: number;
  /** How many relays carried this message */
  hopCount: number;
  status: 'queued' | 'sent' | 'delivered' | 'dropped';
  direction: 'in' | 'out';
};

export type MeshStatus = 'idle' | 'scanning' | 'online' | 'degraded';

export type Identity = {
  id: PeerId;
  callsign: string;
};
