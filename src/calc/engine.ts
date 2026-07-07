import { Collection, Kill } from "../data/collections";
import { MONSTER_BY_ID, Monster } from "../data/monsters";
import { totalXpForLevel, charLevelPenalty1024, ratioPenalty256, partyBonus256, MAX_LEVEL } from "../data/tables";
import { finalBaseXp } from "./experience";
import { PER_MONSTER_CAP } from "./modifiers";

// D2 does every step in INTEGER math and truncates (D2ApplyPercent = floor(v * pct / 100)). We mirror
// that exactly. All intermediates stay far below Number.MAX_SAFE_INTEGER (2^53) — the largest product
// is ~8.4M × 609 ≈ 5.1e9 — so Math.floor on plain numbers is bit-exact and BigInt is unnecessary.
const applyPct = (v: number, pctNum: number, pctDen: number) => Math.floor((v * pctNum) / pctDen);

export const SHRINE_PCT = 50; // experience shrine

export type Bonuses = {
  anniPct: number; // magnitude of the anni / realm xp charm; classic D2 Anni gives no xp
};

export type Config = {
  currentLevel: number;
  targetLevel: number;
  playersInGame: number;
  runSeconds: number;
  collection: Collection;
  bonuses: Bonuses;
};

// Shrine and anni are toggled per kill (a shrine is timed/local), so the extra % is per kill.
export function killExtraPct(k: Kill, anniPct: number): number {
  return (k.shrine ? SHRINE_PCT : 0) + (k.anni ? anniPct : 0);
}

// Every intermediate value for one kill at one character level — this is what the
// step-by-step ("high school") breakdown renders. All values are integers.
export type KillBreakdown = {
  kill: Kill;
  monster: Monster;
  baseXp: number; // finalBaseXp
  playerPctAdd: number; // (players-1)*50 — the % added on top of base
  scaledUncapped: number; // base + floor(base * playerPctAdd/100) before the cap
  afterPlayers: number; // capped at 0x7FFFFF (the stat stored at spawn)
  capped: boolean;
  ratioNum: number; // numerator; ratioDen tells you /256 or /monsterLevel
  ratioDen: number;
  afterRatio: number; // level-difference penalty, applied at kill
  perPlayer: number; // after even party split
  partyBonusNum: number; // 87*(size-1), over 256
  afterBonus: number;
  penaltyNum: number; // over 1024
  afterPenalty: number;
  extraPct: number;
  afterExtras: number; // shrine/anni/items
  total: number; // × count
};

// Order follows the engine: at spawn the base is scaled by players-in-game and capped at 0x7FFFFF;
// at kill the level-difference penalty, party split, party bonus, high-level penalty and item
// bonuses apply. Every operation truncates, like the game.
export function killAtLevel(
  kill: Kill,
  charLevel: number,
  playersInGame: number,
  extraPct: number
): KillBreakdown | null {
  const monster = MONSTER_BY_ID[kill.monsterId];
  if (!monster) return null;
  const cl = Math.max(1, Math.min(MAX_LEVEL, charLevel));

  const baseXp = finalBaseXp(monster);

  // Spawn: monster xp += (players-1)*50 %, then clamp to the per-monster cap.
  const playerPctAdd = (playersInGame - 1) * 50;
  const scaledUncapped = baseXp + applyPct(baseXp, playerPctAdd, 100);
  const capped = scaledUncapped > PER_MONSTER_CAP;
  const afterPlayers = capped ? PER_MONSTER_CAP : scaledUncapped;

  // Kill: level-difference (ratio) penalty. Monster above you => × clvl/monLvl; below => × table/256.
  const diff = cl - monster.level;
  let ratioNum: number;
  let ratioDen: number;
  if (diff <= 0) {
    ratioNum = Math.min(monster.level, cl);
    ratioDen = monster.level;
  } else {
    ratioNum = ratioPenalty256[Math.min(diff, 99)] ?? 13;
    ratioDen = 256;
  }
  const afterRatio = applyPct(afterPlayers, ratioNum, ratioDen);

  // Even split across the party present.
  const perPlayer = Math.floor(afterRatio / Math.max(1, kill.partySize));

  // Party bonus: + 87*(size-1) / 256.
  const idx = Math.max(0, Math.min(partyBonus256.length - 1, kill.partySize - 1));
  const partyBonusNum = partyBonus256[idx];
  const afterBonus = perPlayer + applyPct(perPlayer, partyBonusNum, 256);

  // High-level character penalty (/1024).
  const penaltyNum = charLevelPenalty1024[cl];
  const afterPenalty = applyPct(afterBonus, penaltyNum, 1024);

  // Shrine / anni / item bonuses.
  const afterExtras = afterPenalty + applyPct(afterPenalty, extraPct, 100);

  const total = afterExtras * kill.count;

  return {
    kill,
    monster,
    baseXp,
    playerPctAdd,
    scaledUncapped,
    afterPlayers,
    capped,
    ratioNum,
    ratioDen,
    afterRatio,
    perPlayer,
    partyBonusNum,
    afterBonus,
    penaltyNum,
    afterPenalty,
    extraPct,
    afterExtras,
    total,
  };
}

export function xpPerRunAtLevel(cfg: Config, charLevel: number): number {
  let sum = 0;
  for (const k of cfg.collection.kills) {
    const b = killAtLevel(k, charLevel, cfg.playersInGame, killExtraPct(k, cfg.bonuses.anniPct));
    if (b) sum += b.total;
  }
  return sum;
}

export function totalXp(level: number): number {
  const l = Math.max(1, Math.min(MAX_LEVEL, level));
  return totalXpForLevel[l];
}

export type LevelRow = {
  level: number; // the level you are grinding through (L -> L+1)
  xpPerRun: number; // xp/run WHILE at this level (penalty changes per level!)
  xpToNext: number;
  runs: number;
  hours: number;
};

export type Plan = {
  runsPerHour: number;
  rows: LevelRow[];
  totalRuns: number;
  totalHours: number;
  xpNeeded: number;
  // headline uses the CURRENT level so the top-line xp/run matches "right now"
  xpPerRunNow: number;
  xpPerHourNow: number;
};

// The whole point of the per-level integration: xp/run is recomputed for every level between
// current and target because the high-level penalty (and ratio penalty) shift each level.
export function plan(cfg: Config): Plan {
  const runsPerHour = cfg.runSeconds > 0 ? 3600 / cfg.runSeconds : 0;
  const from = Math.max(1, Math.min(MAX_LEVEL, cfg.currentLevel));
  const to = Math.max(from, Math.min(MAX_LEVEL, cfg.targetLevel));

  const rows: LevelRow[] = [];
  let totalRuns = 0;
  let totalHours = 0;
  for (let L = from; L < to; L++) {
    const xpPerRun = xpPerRunAtLevel(cfg, L);
    const xpToNext = totalXp(L + 1) - totalXp(L);
    const runs = xpPerRun > 0 ? Math.ceil(xpToNext / xpPerRun) : 0;
    const hours = xpPerRun > 0 && runsPerHour > 0 ? xpToNext / (xpPerRun * runsPerHour) : 0;
    rows.push({ level: L, xpPerRun, xpToNext, runs, hours });
    totalRuns += runs;
    totalHours += hours;
  }

  const xpPerRunNow = xpPerRunAtLevel(cfg, from);
  return {
    runsPerHour,
    rows,
    totalRuns,
    totalHours,
    xpNeeded: totalXp(to) - totalXp(from),
    xpPerRunNow,
    xpPerHourNow: xpPerRunNow * runsPerHour,
  };
}
