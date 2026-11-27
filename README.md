# turkey-run-game-01

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/cryptocollectorid/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/cryptocollectorid/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

**Turkey Run — Thanksgiving Escape.** A turkey flees the farmer across the farm at dusk: jump the glowing ovens and fences, slide under the flying carving knives, grab corn for score (golden corn pays 50, combos pay more), and reach the forest 1,000 metres away before the farmer catches you. Three lives — every stumble lets the farmer close in. Title screen, HUD (score, distance to the forest, lives, combo), caught / escaped end screens with restart, parallax farm scenery, dust, feathers, screen shake, and synthesised WebAudio sound (no audio files, no network).

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` from any static server — the game is plain static files (HTML + ES modules + canvas, no libraries, no network requests) and plays offline in a desktop browser.

Controls: **Space / ↑ / click** — jump · **↓ / S** — slide · **P** — pause · **M** — mute · **R** — restart.

Screenshots are real renders of the game, staged deterministically: `?shot=start|play|action|end&seed=1` (see `shots.json`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=themitecho10&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
