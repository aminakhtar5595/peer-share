export function createId(prefix = 'pkt'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`;
}

export function createPeerId(): string {
  return createId('node');
}

const ADJECTIVES = [
  'Amber',
  'Cedar',
  'Drift',
  'Ember',
  'Frost',
  'Grove',
  'Harbor',
  'Iris',
  'Juniper',
  'Kelp',
  'Lumen',
  'Moss',
  'North',
  'Orchid',
  'Pine',
  'Quartz',
  'Ridge',
  'Sol',
  'Tide',
  'Veld',
];

const NOUNS = [
  'Fox',
  'Heron',
  'Kite',
  'Lynx',
  'Moth',
  'Otter',
  'Pike',
  'Raven',
  'Swift',
  'Wren',
];

export function suggestCallsign(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]!.trim();
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)]!;
  const num = Math.floor(Math.random() * 90) + 10;
  return `${a}${n}-${num}`;
}
