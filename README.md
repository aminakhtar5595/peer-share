# Relay — Offline Mesh Chat

Portfolio React Native (Expo) app that demos **peer-to-peer mesh messaging** without the internet: nearby nodes beacon, chat packets hop through relays, and delivery ACKs travel back with store-and-forward.

## Features

- Callsign identity (persisted locally)
- Simulated radio field with roaming relay bots
- Mesh map with radio-range links (tap to reposition)
- Chat with hop count + delivery status
- Live TX / RX / RELAY radio log
- Web multi-tab mesh via `BroadcastChannel` (`src/mesh/radio.ts`)

## Run

```bash
npm install
npm run web          # http://127.0.0.1:43123
# or
npx expo start       # then press `w` / scan with Expo Go
```

Also:

```bash
npm run typecheck
```

## Architecture

| Piece | Role |
| --- | --- |
| `src/mesh/radio.ts` | Air interface (in-process + BroadcastChannel). Swap for BLE / Wi‑Fi Direct later. |
| `src/mesh/node.ts` | Beacon, range gate, chat, TTL, hop list, relay, ACK |
| `src/mesh/simulator.ts` | Roaming relay bots for a single-device demo |
| `src/mesh/MeshProvider.tsx` | React state + AsyncStorage identity |
| `src/app/*` | Expo Router screens |

## Demo script

1. Enter a callsign → watch three relay nodes appear on the map.
2. Open a peer chat and send a message (hop metadata shows under bubbles).
3. Tap the map to move yourself; thin links show who is in radio range.
4. Optional: open a second browser tab with another callsign to mesh for real.

## Stack

Expo SDK 58 · React Native · Expo Router · TypeScript · Reanimated · Space Grotesk + IBM Plex Mono
