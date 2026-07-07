// Monster database. `level` and `monstatsBase` are FIXED, extracted from 1.14d monstats.txt
// (Patch_D2.mpq, Hell columns Level(H) / Exp(H)). The experience a kill actually awards is
// derived: finalBaseXp = expScale(level) * monstatsBase  (see calc/experience.ts).
//
// Validated against Baalrun.xlsx: nihlathakboss 277 @ L92 -> 168,161; baalcrab 6460 @ L99
// -> 4,536,276; diablo 3462 @ L94 -> 2,195,808.

export type Monster = {
  id: string;
  name: string;
  level: number; // Hell monster level
  monstatsBase: number; // Exp(H) base from monstats
};

export const MONSTERS: Monster[] = [
  // Act bosses & story uniques
  { id: "baalcrab", name: "Baal", level: 99, monstatsBase: 6460 },
  { id: "diablo", name: "Diablo", level: 94, monstatsBase: 3462 },
  { id: "mephisto", name: "Mephisto", level: 87, monstatsBase: 2131 },
  { id: "izual", name: "Izual", level: 86, monstatsBase: 1987 },
  { id: "duriel", name: "Duriel", level: 88, monstatsBase: 1655 },
  { id: "andariel", name: "Andariel", level: 75, monstatsBase: 1492 },
  { id: "bloodraven", name: "Blood Raven", level: 88, monstatsBase: 977 },
  { id: "radament", name: "Radament", level: 83, monstatsBase: 315 },
  { id: "summoner", name: "The Summoner", level: 80, monstatsBase: 293 },
  { id: "nihlathakboss", name: "Nihlathak", level: 92, monstatsBase: 277 },
  { id: "griswold", name: "Griswold", level: 84, monstatsBase: 273 },

  // Baal throne wave leaders (superuniques) + their pack base class
  { id: "fallenshaman5", name: "Colenzo (Wave 1)", level: 83, monstatsBase: 150 },
  { id: "unraveler5", name: "Achmel (Wave 2)", level: 85, monstatsBase: 300 },
  { id: "baalhighpriest", name: "Bartuc (Wave 3)", level: 93, monstatsBase: 225 },
  { id: "venomlord", name: "Ventar (Wave 4)", level: 93, monstatsBase: 239 },
  { id: "baalminion1", name: "Lister & minions (Wave 5)", level: 92, monstatsBase: 247 },

  // Popular farm superuniques / packs
  { id: "reanimatedhorde5", name: "Pindleskin", level: 85, monstatsBase: 105 },
  { id: "corruptrogue3", name: "The Countess", level: 69, monstatsBase: 95 },
  { id: "deathmauler1", name: "Eyeback (Bloody Foothills)", level: 80, monstatsBase: 105 },
  { id: "overseer3", name: "Sharp Tooth Sayer", level: 82, monstatsBase: 125 },
  { id: "hellbovine", name: "Hell Bovine (Cow)", level: 81, monstatsBase: 80 },
];

export const MONSTER_BY_ID: Record<string, Monster> = Object.fromEntries(MONSTERS.map((m) => [m.id, m]));
