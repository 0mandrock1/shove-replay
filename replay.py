#!/usr/bin/env python3
"""Reconstruct SHOVE play sessions from the upstream play ledger into frames.json.

SHOVE (the game) was designed, built and played by Claude Fable 5; its source
lives in the upstream repo (github.com/robss2020/claude-fable-5-having-fun) and
is NOT redistributed here. This harness imports the upstream `shove` module at
build time, replays each recorded session by driving the same command functions
the human/agent used, and captures a full board frame after every command.

Only sessions whose ledger `version` matches the version implemented by the
upstream shove.py (currently v6) can be reconstructed. Older sessions (v1..v5)
were played against source that no longer exists in the repo; we do NOT fabricate
a board for them -- they are emitted as an honest command timeline + notes +
their recorded game_over stats, marked replayable:false.

Deterministic: rerunning produces an identical frames.json.
"""
import json
import os
import sys
import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
UPSTREAM = os.path.join(HERE, "upstream")
LEDGER = os.path.join(UPSTREAM, "play_ledger.jsonl")
OUT = os.path.join(HERE, "frames.json")

# Neutralise the upstream ledger writer BEFORE importing: shove.cmd_end() calls
# ledger("game_over", ...) which would append to the upstream ledger. SHOVE_TEST
# makes ledger() a no-op. Also pin state to a scratch path we never read.
os.environ["SHOVE_TEST"] = "1"
os.environ["SHOVE_STATE"] = os.path.join(HERE, ".replay_scratch_state.json")

sys.path.insert(0, UPSTREAM)
import shove  # noqa: E402  (import after env setup is intentional)


def parse_sessions(rows):
    """Split the flat ledger into sessions, one per `new` event."""
    sessions = []
    cur = None
    for r in rows:
        e = r["e"]
        if e == "new":
            if cur:
                sessions.append(cur)
            cur = {
                "start": r["t"], "last": r["t"],
                "seed": r.get("seed"), "version": r.get("version"),
                "commands": [], "notes": [], "game_over": None,
            }
        elif cur is None:
            continue
        else:
            cur["last"] = r["t"]
            if e == "cmd":
                cur["commands"].append({"cmd": r["cmd"], "t": r["t"]})
            elif e == "note":
                cur["notes"].append(r["text"])
            elif e == "game_over":
                cur["game_over"] = {k: r.get(k) for k in
                                    ("outcome", "score", "turn", "kills",
                                     "style", "buildings", "version")}
    if cur:
        sessions.append(cur)
    return sessions


def apply_command(s, cmdstr):
    """Drive the upstream state `s` with one recorded command, exactly as
    upstream main() dispatches it (minus save/ledger/render side effects)."""
    argv = cmdstr.split()
    c = argv[0].lower()
    if c == "move":
        shove.cmd_move(s, argv[1], int(argv[2]), int(argv[3]))
    elif c == "hit":
        shove.cmd_hit(s, argv[1], argv[2].upper())
    elif c == "shoot":
        shove.cmd_shoot(s, argv[1], argv[2].upper())
    elif c == "yank":
        shove.cmd_yank(s, argv[1], argv[2].upper())
    elif c == "end":
        shove.cmd_end(s)
    else:
        raise ValueError("unknown command in ledger: %r" % cmdstr)


def enemy_view(s, e):
    """Serialise one enemy incl. its telegraphed/locked aim and what it hits."""
    out = {"id": e["id"], "type": e["type"], "x": e["x"], "y": e["y"],
           "hp": e["hp"], "aim": None}
    if e.get("tel"):
        tx, ty = e["x"] + e["tel"][0], e["y"] + e["tel"][1]
        onboard = shove.inb(tx, ty)
        t = shove.occupant(s, tx, ty) if onboard else None
        out["aim"] = {
            "x": tx, "y": ty, "onboard": onboard,
            "hits": shove.label(t) if t else ("off-board" if not onboard else "empty ground"),
        }
    return out


def snapshot(s, index, command, timestamp):
    """Capture a full, self-contained frame of the board state."""
    danger = []
    for e in shove.alive(s["enemies"]):
        if e.get("tel"):
            tx, ty = e["x"] + e["tel"][0], e["y"] + e["tel"][1]
            if shove.inb(tx, ty):
                danger.append([tx, ty])
    spawn_warn = [[sp["x"], sp["y"]] for sp in s["spawns"] if sp["turn"] == s["turn"]]
    return {
        "index": index,
        "command": command,          # None for the opening frame
        "timestamp": timestamp,
        "turn": min(s["turn"], s["max_turns"]),
        "raw_turn": s["turn"],
        "max_turns": s["max_turns"],
        "status": s["status"],
        "score": shove.score(s),
        "kills": s["kills"],
        "style": s["style"],
        "buildings_left": len(shove.alive(s["buildings"])),
        "grid": [row[:] for row in s["grid"]],
        "buildings": [{"x": b["x"], "y": b["y"], "hp": b["hp"],
                       "destroyed": b["hp"] <= 0} for b in s["buildings"]],
        "units": [{"id": u["id"], "name": u["name"], "x": u["x"], "y": u["y"],
                   "hp": u["hp"], "maxhp": u["maxhp"], "moved": u["moved"],
                   "acted": u["acted"], "destroyed": u["hp"] <= 0}
                  for u in s["units"]],
        "enemies": [enemy_view(s, e) for e in shove.alive(s["enemies"])],
        "spawns": [{"type": sp["type"], "x": sp["x"], "y": sp["y"],
                    "turn": sp["turn"]} for sp in s["spawns"]],
        "danger": danger,
        "spawn_warn": spawn_warn,
        "log": [],   # filled by caller with events new since previous frame
    }


def duration_str(start, last):
    t0 = datetime.datetime.fromisoformat(start)
    t1 = datetime.datetime.fromisoformat(last)
    sec = int((t1 - t0).total_seconds())
    return "%dm%02ds" % (sec // 60, sec % 60)


def replay_session(ses, index):
    """Reconstruct one session. Returns (session_dict, consistency_row|None)."""
    seed = ses["seed"]
    version = ses["version"]
    replayable = (version == shove.VERSION)

    go = ses["game_over"]
    meta = {
        "index": index,
        "seed": seed,
        "version": version,
        "start": ses["start"],
        "end": ses["last"],
        "duration": duration_str(ses["start"], ses["last"]),
        "outcome": (go or {}).get("outcome", "(abandoned)"),
        "score": (go or {}).get("score"),
        "kills": (go or {}).get("kills"),
        "style": (go or {}).get("style"),
        "buildings": (go or {}).get("buildings"),
    }

    out = {
        "meta": meta,
        "replayable": replayable,
        "commands": ses["commands"],
        "notes": ses["notes"],
        "game_over": go,
        "frames": None,
    }
    if not replayable:
        return out, None

    # Reconstruct: seed the game, then apply each command, snapshotting after each.
    s = shove.gen(seed)
    frames = []
    prev_len = len(s["events"])
    opening = snapshot(s, 0, None, ses["start"])
    opening["log"] = s["events"][:]     # deployment / opening telegraph lines
    frames.append(opening)

    for i, c in enumerate(ses["commands"], start=1):
        apply_command(s, c["cmd"])
        fr = snapshot(s, i, c["cmd"], c["t"])
        fr["log"] = s["events"][prev_len:]
        prev_len = len(s["events"])
        frames.append(fr)
    out["frames"] = frames

    # Consistency: the final frame must equal the recorded game_over stats.
    last = frames[-1]
    row = None
    if go:
        row = {
            "index": index, "seed": seed, "version": version,
            "ledger": {"score": go.get("score"), "kills": go.get("kills"),
                       "style": go.get("style"), "buildings": go.get("buildings"),
                       "outcome": go.get("outcome")},
            "replay": {"score": last["score"], "kills": last["kills"],
                       "style": last["style"], "buildings": last["buildings_left"],
                       "outcome": last["status"]},
        }
        row["match"] = row["ledger"] == row["replay"]
    return out, row


def main():
    rows = [json.loads(l) for l in open(LEDGER) if l.strip()]
    raw = parse_sessions(rows)

    sessions = []
    checks = []
    for idx, ses in enumerate(raw, start=1):
        sdict, row = replay_session(ses, idx)
        sessions.append(sdict)
        if row is not None:
            checks.append(row)

    with open(OUT, "w") as f:
        json.dump({"sessions": sessions}, f, indent=1, sort_keys=True)
        f.write("\n")

    # scratch state file may have been created by env pinning; remove it
    scratch = os.environ["SHOVE_STATE"]
    if os.path.exists(scratch):
        os.remove(scratch)

    # ---- report ----
    print("SHOVE replay -- %d session(s) written to %s" % (len(sessions), OUT))
    for s in sessions:
        m = s["meta"]
        print("  S%d  %s seed %-6s  replayable=%-5s  %s  score=%s  frames=%s"
              % (m["index"], m["version"], m["seed"], str(s["replayable"]).lower(),
                 m["outcome"], m["score"],
                 len(s["frames"]) if s["frames"] else "-"))
    print("\nCONSISTENCY CHECK (replayable sessions with a game_over):")
    ok = True
    for r in checks:
        print("  S%d %s seed %s: ledger=%s replay=%s -> %s"
              % (r["index"], r["version"], r["seed"], r["ledger"], r["replay"],
                 "MATCH" if r["match"] else "*** MISMATCH ***"))
        ok = ok and r["match"]
    if not ok:
        print("\n!! consistency check FAILED -- the harness is wrong; not shippable")
        sys.exit(1)
    print("\nall consistency checks passed" if checks else "\n(no replayable game_over to check)")


if __name__ == "__main__":
    main()
