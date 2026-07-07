import {
  totalXpForLevel,
  charLevelPenalty1024,
  ratioPenalty256,
  partyBonus256,
  MAX_LEVEL,
} from "../data/tables";

// Hard per-monster experience cap in classic D2 (2^23 - 1).
export const PER_MONSTER_CAP = 8388607;

// One kind of monster killed during a run: a boss, a super-unique, or a trash pack.
export type KillSource = {
  name: string;
  // Raw base experience the monster carries (from monstats, at the difficulty being farmed).
  baseXp: number;
  // How many of this monster die per run (1 for a boss, e.g. 8 for a wave-5 pack).
  count: number;
  // Party members present in the area who split this kill (drives both the split and the party bonus).
  partySize: number;
  // Monster level; only used for the level-difference penalty. Leave undefined for near-level uniques (full xp).
  monsterLevel?: number;
  // Extra multiplicative bonus in percent (shrine / Annihilus / small charm), applied last.
  bonusPct: number;
};

export type RunConfig = {
  currentLevel: number;
  targetLevel: number;
  playersSetting: number; // /players X in the game (1..8)
  runSeconds: number; // wall-clock time of one full run
  sources: KillSource[];
};

// /players X experience multiplier: (players + 1) / 2.
export function playersMod(players: number): number {
  return players / 2 + 0.5;
}

// Party bonus as a percentage, from the party size present.
export function partyBonusPct(partySize: number): number {
  const idx = Math.max(0, Math.min(partyBonus256.length - 1, partySize - 1));
  return (partyBonus256[idx] / 256) * 100;
}

// High-level character penalty as a fraction (1.0 up to level 69).
export function charPenaltyFrac(level: number): number {
  const l = Math.max(1, Math.min(MAX_LEVEL, level));
  return charLevelPenalty1024[l] / 1024;
}

// Level-difference (ratio) penalty as a fraction. Monsters far below you give less; monsters above you
// give the classic clvl/mlvl bonus-cap. Undefined monster level means a near-level unique => full xp.
export function ratioPenaltyFrac(charLevel: number, monsterLevel?: number): number {
  if (monsterLevel === undefined) return 1;
  const diff = charLevel - monsterLevel;
  if (diff <= 0) {
    // Monster at or above the character: capped at charLevel/monsterLevel (never above 1).
    return Math.min(1, charLevel / monsterLevel);
  }
  const table = ratioPenalty256[Math.min(diff, 99)];
  const num = table !== undefined ? table : 13;
  return num / 256;
}

export type SourceResult = {
  source: KillSource;
  ratioFrac: number;
  afterPlayers: number; // capped
  perPlayer: number;
  afterBonus: number;
  afterCharPenalty: number;
  xpPerRun: number; // this source's total contribution to one run (× count, × bonusPct)
};

export function evalSource(src: KillSource, charLevel: number, players: number): SourceResult {
  const ratioFrac = ratioPenaltyFrac(charLevel, src.monsterLevel);
  const raw = src.baseXp * ratioFrac;
  const afterPlayers = Math.min(raw * playersMod(players), PER_MONSTER_CAP);
  const perPlayer = afterPlayers / Math.max(1, src.partySize);
  const afterBonus = perPlayer * (1 + partyBonusPct(src.partySize) / 100);
  const afterCharPenalty = afterBonus * charPenaltyFrac(charLevel);
  const withShrine = afterCharPenalty * (1 + src.bonusPct / 100);
  const xpPerRun = withShrine * src.count;
  return { source: src, ratioFrac, afterPlayers, perPlayer, afterBonus, afterCharPenalty, xpPerRun };
}

export type RunResult = {
  perSource: SourceResult[];
  xpPerRun: number;
  runsPerHour: number;
  xpPerHour: number;
  xpNeeded: number;
  runsNeeded: number;
  hoursNeeded: number;
  daysNeeded: number;
};

export function totalXp(level: number): number {
  const l = Math.max(1, Math.min(MAX_LEVEL, level));
  return totalXpForLevel[l];
}

export function evalRun(cfg: RunConfig): RunResult {
  const perSource = cfg.sources.map((s) => evalSource(s, cfg.currentLevel, cfg.playersSetting));
  const xpPerRun = perSource.reduce((a, s) => a + s.xpPerRun, 0);
  const runsPerHour = cfg.runSeconds > 0 ? 3600 / cfg.runSeconds : 0;
  const xpPerHour = xpPerRun * runsPerHour;

  const target = Math.max(cfg.currentLevel, cfg.targetLevel);
  const xpNeeded = Math.max(0, totalXp(target) - totalXp(cfg.currentLevel));
  const runsNeeded = xpPerRun > 0 ? Math.ceil(xpNeeded / xpPerRun) : 0;
  const hoursNeeded = xpPerHour > 0 ? xpNeeded / xpPerHour : 0;
  const daysNeeded = hoursNeeded / 24;

  return {
    perSource,
    xpPerRun,
    runsPerHour,
    xpPerHour,
    xpNeeded,
    runsNeeded,
    hoursNeeded,
    daysNeeded,
  };
}

// The classic Baal run, straight from Baalrun.xlsx: Baal, Diablo, Nihlathak, and a wave-5 pack.
export function baalRunPreset(): KillSource[] {
  return [
    { name: "Baal", baseXp: 4536276, count: 1, partySize: 4, bonusPct: 0 },
    { name: "Diablo", baseXp: 2195808, count: 1, partySize: 1, bonusPct: 0 },
    { name: "Nihlathak", baseXp: 168161, count: 1, partySize: 1, bonusPct: 0 },
    { name: "Wave 5 pack", baseXp: 632255, count: 8, partySize: 8, monsterLevel: 88, bonusPct: 0 },
  ];
}
