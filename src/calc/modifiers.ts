import { charLevelPenalty1024, ratioPenalty256, partyBonus256, MAX_LEVEL } from "../data/tables";

// Hard per-monster experience cap in classic D2 (2^23 - 1).
export const PER_MONSTER_CAP = 8388607;

// Number of players in the (online) game scales monster experience by (players + 1) / 2.
export function playersMod(playersInGame: number): number {
  return playersInGame / 2 + 0.5;
}

// Party bonus as a percentage, from the number of partied players present for the kill.
export function partyBonusPct(partySize: number): number {
  const idx = Math.max(0, Math.min(partyBonus256.length - 1, partySize - 1));
  return (partyBonus256[idx] / 256) * 100;
}

// High-level character penalty as a fraction (1.0 up to level 69, falls off to 5/1024 at 99).
export function charPenaltyFrac(level: number): number {
  const l = Math.max(1, Math.min(MAX_LEVEL, level));
  return charLevelPenalty1024[l] / 1024;
}

// Level-difference (ratio) penalty as a fraction. Monsters far below you give less; a monster above
// you caps your share at charLevel/monsterLevel.
export function ratioPenaltyFrac(charLevel: number, monsterLevel: number): number {
  const diff = charLevel - monsterLevel;
  if (diff <= 0) return Math.min(1, charLevel / monsterLevel);
  const num = ratioPenalty256[Math.min(diff, 99)];
  return (num !== undefined ? num : 13) / 256;
}
