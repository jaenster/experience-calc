# experience-calc

Diablo 2 Baal-run / boss XP efficiency calculator — plan the fastest road to level 99.

Live: **https://experience.typeguru.nl**

A Vite + React + TypeScript single-page app. It reproduces the 1.14d experience mechanics
faithfully (integer math, truncated at every step, like the game) and models any farm run as a
"collection" of kills so you can compare Baal runs, wave packs, cows, Pindle, etc.

## How the numbers are computed

Base XP is fixed from game data, ported byte-faithful from the reconstructed 1.14d `Game.exe`:

```
baseXp = floor( MonLvl.XP(H)[monsterLevel] × monstats.Experience(H) / 100 )
```

Then, per kill (every step truncated to an integer):

1. `+ (players − 1) × 50 %`  — the online players-in-game bonus, `(players+1)/2`
2. capped at `8,388,607` per monster (the spawn-time ceiling)
3. `× ratio penalty` — level difference: monster above you → `clvl/monLvl`, below → table/256
4. `÷ party present` — even split across partied players in the area
5. `+ party bonus` — `87 × (partySize − 1) / 256`
6. `× high-level penalty` — `charLevelPenalty[level] / 1024` (falls off from level 70)
7. `× shrine / anni` bonus (toggled per kill)
8. `× count` (a throne wave is a pack, so more than one)

xp/run is recomputed for **every** level between current and target, because the penalties shift
each level — so the "time to 99" is integrated level by level, not one flat number.

Data is extracted from the client MPQs (`MonStats.txt`, `MonLvl.txt`, `SuperUniques.txt`).

## Develop

```
npm install
npm run dev      # vite dev server
npm run build    # static production build in ./dist
```

## Build

`npm run build` emits a static bundle in `./dist` that can be served by any static host. The included
`Dockerfile` builds the bundle and serves it with nginx; GitHub Actions publishes the image to
`ghcr.io/jaenster/experience-calc` on push to `main`.
