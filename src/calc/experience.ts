import { Monster } from "../data/monsters";
import { monLvlXpH } from "../data/monlvl";

// D2 bakes the monster's real experience into its stat at spawn, scaling the small monstats
// "Experience" base by a per-monster-level factor from MonLvl.txt:
//
//   awardedBaseXp = floor( MonLvl.XP(H)[monLevel] * monstats.Experience(H) / 100 )
//
// Ported byte-faithful from the reconstructed 1.14d Game.exe (MONSTER_CalculateLevelScaledStats
// @ 0x006538a0). Validated: baalcrab 6460 @ L99 -> floor(70221*6460/100) = 4,536,276;
// diablo 3462 @ L94 -> 2,195,808.
export function finalBaseXp(m: Monster): number {
  const idx = Math.max(1, Math.min(monLvlXpH.length - 1, m.level));
  return Math.floor((monLvlXpH[idx] * m.monstatsBase) / 100);
}
