import { createPeerId } from './ids';
import { MeshNode } from './node';
import type { MeshPeer } from './types';

const BOT_NAMES = ['CedarRelay', 'MossBridge', 'TideNode', 'RidgeEcho'];

/**
 * Spawns roaming relay bots that keep the mesh alive for a single-device demo.
 * They only forward traffic — they do not start chats unless you message them.
 */
export class MeshSimulator {
  private bots: MeshNode[] = [];
  private wanderTimer: ReturnType<typeof setInterval> | null = null;

  start(count = 3): void {
    this.stop();
    for (let i = 0; i < count; i++) {
      const peer: MeshPeer = {
        id: createPeerId(),
        callsign: BOT_NAMES[i] ?? `Relay-${i + 1}`,
        x: 20 + i * 22 + Math.random() * 8,
        y: 28 + (i % 2) * 24 + Math.random() * 10,
        simulated: true,
        lastSeen: Date.now(),
        online: true,
      };
      const node = new MeshNode(peer, {
        onLog: (line) => {
          if (__DEV__) {
            // Keep console quiet in production builds
            console.log(`[${peer.callsign}] ${line}`);
          }
        },
      });
      node.start();
      this.bots.push(node);
    }

    this.wanderTimer = setInterval(() => this.wander(), 3500);
  }

  stop(): void {
    if (this.wanderTimer) clearInterval(this.wanderTimer);
    this.wanderTimer = null;
    for (const bot of this.bots) bot.stop();
    this.bots = [];
  }

  getBots(): MeshNode[] {
    return this.bots;
  }

  private wander(): void {
    for (const bot of this.bots) {
      const dx = (Math.random() - 0.5) * 10;
      const dy = (Math.random() - 0.5) * 10;
      bot.moveTo(bot.peer.x + dx, bot.peer.y + dy);
    }
  }
}
