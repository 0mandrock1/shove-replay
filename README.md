# SHOVE — replay viewer

A static, human-readable replay viewer for **SHOVE**, a tiny turn-based tactics
puzzle in the spirit of *Into the Breach*: command a squad of mechs defending
three buildings from bugs for five turns, where enemies **telegraph** their
attacks as an offset — so shoving an attacker redirects its blow onto water,
mountains, or its own friends.

**Live:** https://tools.mandrock.me/shove-replay/

This viewer reconstructs the games that were actually played from the upstream
*play ledger*, and lets you step through each one turn by turn: the board as a
readable grid, every unit and enemy, and — crucially — each enemy's locked-in
telegraph, so you can **see the position the model was reading** when it moved.

## Credit — SHOVE is not ours

> The game **SHOVE** was designed, built and played by **Claude Fable 5**.
> Repo by **robss2020**: https://github.com/robss2020/claude-fable-5-having-fun

**The game itself is not redistributed in this repository.** The upstream repo
carries **no licence**, so all rights to its source (`shove.py`), its play
ledger, and its other artefacts are reserved by its author. This project:

- clones upstream **at build time** into `./upstream/` (which is `.gitignore`d),
- imports the upstream `shove` module to replay the recorded sessions,
- writes a derived `frames.json` (also `.gitignore`d) that is deployed but
  **never committed**.

The **MIT licence** in this repo covers **only this viewer** — `replay.py`,
`build.sh`, `index.html`, `app.js`, `i18n.js`, `style.css`, `check-i18n.js` —
not the game.

The UI is bilingual (Ukrainian / English) with an instant in-page toggle; it
defaults to Ukrainian and remembers the choice in `localStorage`. It also has
a **Glossary** (SHOVE's mechanics + tactics the player discovered) and a
**Help** panel, both bilingual — all reachable from the header toolbar.

## What's replayable, and what isn't

The play ledger contains six sessions (v1–v6). The upstream repo only still
contains the **v6** source, so only the **v6** session can be reconstructed into
a real board — the harness imports upstream and replays the exact commands.

For v1–v5 the source no longer exists upstream. Rather than fabricate a
plausible-but-wrong board, those sessions are shown as an **honest command
timeline** (timestamped commands + the player's own notes + the recorded
game-over stats), clearly labelled with why there is no board. An honest gap
beats a plausible lie.

A mandatory consistency check asserts that, for every replayable session, the
final reconstructed frame's score / kills / style / buildings equal the values
the game itself recorded in its `game_over` ledger entry — otherwise the build
fails.

## Build (one command)

```sh
./build.sh
```

That refreshes the upstream clone, runs `replay.py` to produce `frames.json`,
validates i18n coverage (`check-i18n.js`), and deploys the viewer
(`index.html`, `app.js`, `i18n.js`, `style.css`, `frames.json`) to
`/var/www/html/tools-landing/shove-replay/`.

To only regenerate data without deploying:

```sh
git clone --depth 1 https://github.com/robss2020/claude-fable-5-having-fun upstream
python3 replay.py          # writes frames.json
python3 -m http.server     # then open index.html
```

`replay.py` is deterministic: rerunning produces an identical `frames.json`.

## Files

| File | Role |
|---|---|
| `replay.py` | reconstruction harness — parses the ledger, replays v6, emits `frames.json` |
| `build.sh` | clone/refresh upstream → `replay.py` → deploy |
| `index.html`, `app.js`, `style.css` | the viewer (plain JS, no build step, no dependencies) |
| `i18n.js` | EN/UA string dictionary + glossary/help/legend content |
| `check-i18n.js` | build-time gate: asserts every string has both en+ua |
| `upstream/` | upstream game clone — **gitignored, not redistributed** |
| `frames.json` | derived replay data — **gitignored**, produced by the build |
