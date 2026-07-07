// A "collection" is a farm target: a named list of kills done per run. Base XP and monster level
// come from the monster database (fixed); the run-specific knobs are how many you kill (count) and
// how many partied players are present to split it (partySize).

export type Kill = {
  monsterId: string;
  count: number; // monsters of this type killed per run (a wave is a pack, so count > 1)
  partySize: number; // partied players present sharing this kill (1 = you solo it)
  shrine?: boolean; // experience shrine active for this kill (shrines are timed/local, so per-kill)
  anni?: boolean; // anni / realm xp charm counted for this kill
};

export type Collection = {
  name: string;
  kills: Kill[];
};

// Presets. The full Baal run mirrors Baalrun.xlsx: Baal in a 4-party, Diablo & Nihlathak solo'd in
// the full game (huge, uncapped share), and the wave-5 pack shared by 8.
export const PRESET_COLLECTIONS: Collection[] = [
  {
    name: "Baal run (full)",
    kills: [
      { monsterId: "baalcrab", count: 1, partySize: 4 },
      { monsterId: "diablo", count: 1, partySize: 1 },
      { monsterId: "nihlathakboss", count: 1, partySize: 1 },
      { monsterId: "baalminion1", count: 6, partySize: 8 },
    ],
  },
  {
    name: "Baal waves (all 5 packs)",
    kills: [
      { monsterId: "fallenshaman5", count: 6, partySize: 8 },
      { monsterId: "unraveler5", count: 4, partySize: 8 },
      { monsterId: "baalhighpriest", count: 6, partySize: 8 },
      { monsterId: "venomlord", count: 9, partySize: 8 },
      { monsterId: "baalminion1", count: 6, partySize: 8 },
    ],
  },
  {
    name: "Baal + waves + Baal",
    kills: [
      { monsterId: "fallenshaman5", count: 6, partySize: 8 },
      { monsterId: "unraveler5", count: 4, partySize: 8 },
      { monsterId: "baalhighpriest", count: 6, partySize: 8 },
      { monsterId: "venomlord", count: 9, partySize: 8 },
      { monsterId: "baalminion1", count: 6, partySize: 8 },
      { monsterId: "baalcrab", count: 1, partySize: 4 },
    ],
  },
  {
    name: "Cow run (solo)",
    kills: [{ monsterId: "hellbovine", count: 511, partySize: 1 }],
  },
  {
    name: "Pindleskin (solo)",
    kills: [{ monsterId: "reanimatedhorde5", count: 7, partySize: 1 }],
  },
];

export function clone(c: Collection): Collection {
  return { name: c.name, kills: c.kills.map((k) => ({ ...k })) };
}
