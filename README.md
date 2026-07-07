# baal-calc

Diablo 2 Baal-run / boss XP efficiency calculator — plan the fastest road to level 99.

A React (create-react-app + TypeScript) single-page app in the style of the `netto-bruto`
calculation sheet. It reproduces the model in `~/Documents/d2/Baalrun.xlsx` faithfully and
generalises it so any boss run can be modelled by editing the kill sources.

## The model

Experience per source is computed in this order (per the Amazon Basin experience mechanics):

1. base monster xp
2. × level-difference (ratio) penalty — for monsters more than 5 levels below you (`/256`)
3. × `/players X` multiplier — `(players + 1) / 2`, capped per monster at 8,388,607
4. ÷ party members present (even split)
5. × party bonus — `87 × (partySize − 1) / 256`
6. × high-level character penalty — `charLevelPenalty[level] / 1024` (falls off from level 70)
7. × shrine / Annihilus bonus %
8. × count (pack size)

Summed over all sources → xp per run → xp/hour → runs needed → time to the target level.

## Data

`src/data/tables.ts` is generated directly from `Baalrun.xlsx` (experience table, level penalty,
level-difference penalty, party bonus) — do not hand-edit the values.

## Develop

```
npm install
npm start      # dev server
npm run build  # static production build in ./build
```
