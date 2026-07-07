import React, { useEffect, useMemo, useReducer, useState } from "react";
import { Config, plan, killAtLevel, killExtraPct, xpPerRunAtLevel, SHRINE_PCT } from "../calc/engine";
import { finalBaseXp } from "../calc/experience";
import { playersMod, partyBonusPct, charPenaltyFrac } from "../calc/modifiers";
import { MONSTERS, MONSTER_BY_ID } from "../data/monsters";
import { Collection, Kill, PRESET_COLLECTIONS, clone } from "../data/collections";
import { fmtInt, fmtXp, fmtCompact, fmtDuration } from "../helpers/format";
import { configFromUrl, encodeConfig, shareUrl } from "../helpers/share";

type Action =
  | { type: "field"; key: "currentLevel" | "targetLevel" | "playersInGame" | "runSeconds"; value: number }
  | { type: "anniPct"; value: number }
  | { type: "preset"; collection: Collection }
  | { type: "renameCollection"; name: string }
  | { type: "kill"; index: number; patch: Partial<Kill> }
  | { type: "addKill" }
  | { type: "removeKill"; index: number };

function reducer(state: Config, action: Action): Config {
  switch (action.type) {
    case "field":
      return { ...state, [action.key]: action.value };
    case "anniPct":
      return { ...state, bonuses: { ...state.bonuses, anniPct: action.value } };
    case "preset":
      return { ...state, collection: clone(action.collection) };
    case "renameCollection":
      return { ...state, collection: { ...state.collection, name: action.name } };
    case "kill":
      return {
        ...state,
        collection: {
          ...state.collection,
          kills: state.collection.kills.map((k, i) => (i === action.index ? { ...k, ...action.patch } : k)),
        },
      };
    case "addKill":
      return {
        ...state,
        collection: {
          ...state.collection,
          kills: [
            ...state.collection.kills,
            { monsterId: MONSTERS[0].id, count: 1, partySize: 1, shrine: false, anni: false },
          ],
        },
      };
    case "removeKill":
      return {
        ...state,
        collection: { ...state.collection, kills: state.collection.kills.filter((_, i) => i !== action.index) },
      };
  }
}

const initial: Config = {
  currentLevel: 98,
  targetLevel: 99,
  playersInGame: 8,
  runSeconds: 163,
  collection: clone(PRESET_COLLECTIONS[0]),
  bonuses: { anniPct: 10 },
};

// Small dotted-underline label with a hover explanation.
function Hint(props: { text: string; children: React.ReactNode }) {
  return (
    <span className="tk-hint" title={props.text}>
      {props.children}
      <sup className="tk-q">?</sup>
    </span>
  );
}

// A vertical, worked-out "staartdeling" of one kill: each line shows the operation AND the real
// integer arithmetic (before op operand = after), truncated exactly like the game.
function KillLedger(props: { b: ReturnType<typeof killAtLevel>; k: Kill; players: number; charLevel: number }) {
  const b = props.b;
  if (!b) return null;
  const N = fmtInt;
  const mult = (props.players + 1) / 2;
  const partyBonusAdd = b.afterBonus - b.perPlayer;
  const extraAdd = b.afterExtras - b.afterPenalty;
  const extraLabel = [props.k.shrine ? `shrine +${SHRINE_PCT}%` : "", props.k.anni ? `anni +${b.extraPct - (props.k.shrine ? SHRINE_PCT : 0)}%` : ""]
    .filter(Boolean)
    .join(" + ");

  type Row = { label: string; calc: string; result: number; muted?: boolean };
  const rows: Row[] = [
    { label: "base experience", calc: "", result: b.baseXp },
    { label: `× players in game — (${props.players}+1)/2 = ${mult.toFixed(2)}`, calc: `${N(b.baseXp)} × ${mult.toFixed(2)}`, result: b.scaledUncapped },
  ];
  if (b.capped) rows.push({ label: "cap 8,388,607 per monster", calc: `${N(b.scaledUncapped)} →`, result: b.afterPlayers, muted: true });
  rows.push({ label: `× ratio penalty (you L${props.charLevel} vs monster L${b.monster.level})`, calc: `${N(b.afterPlayers)} × ${b.ratioNum}/${b.ratioDen}`, result: b.afterRatio });
  rows.push({ label: "÷ party present", calc: `${N(b.afterRatio)} ÷ ${props.k.partySize}`, result: b.perPlayer });
  rows.push({ label: `+ party bonus (${b.partyBonusNum}/256)`, calc: `${N(b.perPlayer)} + ${N(partyBonusAdd)}`, result: b.afterBonus });
  rows.push({ label: "× high-level penalty", calc: `${N(b.afterBonus)} × ${b.penaltyNum}/1024`, result: b.afterPenalty });
  if (b.extraPct > 0) rows.push({ label: `+ bonus (${extraLabel})`, calc: `${N(b.afterPenalty)} + ${N(extraAdd)}`, result: b.afterExtras });
  rows.push({ label: "× count killed", calc: `${N(b.afterExtras)} × ${props.k.count}`, result: b.total });

  return (
    <div className="tk-ledger">
      <div className="tk-ledger-title">{b.monster.name}</div>
      {rows.map((r, i) => (
        <div className={"tk-ledger-row" + (r.muted ? " muted" : "")} key={i}>
          <span className="tk-ledger-op">{r.label}</span>
          <span className="tk-ledger-calc">{r.calc}</span>
          <span className="tk-ledger-eq">{r.muted ? "" : "="}</span>
          <span className="tk-ledger-result">{N(r.result)}</span>
        </div>
      ))}
      <div className="tk-ledger-row tk-ledger-answer">
        <span className="tk-ledger-op">subtotal — {b.monster.name}</span>
        <span className="tk-ledger-calc"></span>
        <span className="tk-ledger-eq">=</span>
        <span className="tk-ledger-result">{N(b.total)}</span>
      </div>
    </div>
  );
}

function Num(props: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  width?: number;
}) {
  return (
    <input
      className="tk-input"
      type="number"
      value={props.value}
      min={props.min}
      max={props.max}
      step={props.step ?? 1}
      style={{ width: props.width ?? 84 }}
      onChange={(e) => props.onChange(Number(e.target.value))}
    />
  );
}

export function Sheet() {
  const [state, dispatch] = useReducer(reducer, initial, (base) => configFromUrl() ?? base);
  const result = useMemo(() => plan(state), [state]);
  const [copied, setCopied] = useState(false);
  const [breakLevel, setBreakLevel] = useState(state.currentLevel);

  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname + "#s=" + encodeConfig(state));
  }, [state]);

  const onShare = () => {
    const url = shareUrl(state);
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    navigator.clipboard ? navigator.clipboard.writeText(url).then(done, done) : window.prompt("Share:", url);
  };

  const anniPct = state.bonuses.anniPct;
  const bl = Math.max(state.currentLevel, Math.min(state.targetLevel, breakLevel));

  return (
    <div className="tk-wrap">
      <table className="table table-dark tk-sheet">
        <thead>
          <tr>
            <td colSpan={6} className="tk-title">
              <h3>Baal / Boss XP Efficiency — road to 99</h3>
              <span className="tk-sub-title">
                base XP ported byte-faithful from 1.14d · online-game mechanics
              </span>
              <div className="tk-share">
                <button className="tk-btn" onClick={onShare}>
                  {copied ? "link copied ✓" : "share link"}
                </button>
              </div>
            </td>
          </tr>
        </thead>
        <tbody>
          {/* ---- character & game ---- */}
          <tr className="tk-subhead">
            <td className="tk-label" colSpan={6}>
              Character &amp; game
            </td>
          </tr>
          <tr>
            <td className="tk-label">Current level</td>
            <td>
              <Num value={state.currentLevel} min={1} max={99}
                onChange={(v) => dispatch({ type: "field", key: "currentLevel", value: v })} />
            </td>
            <td className="tk-label">Target level</td>
            <td>
              <Num value={state.targetLevel} min={1} max={99}
                onChange={(v) => dispatch({ type: "field", key: "targetLevel", value: v })} />
            </td>
            <td className="tk-label">
              <Hint text="Above level 70 you keep only a shrinking fraction of xp: 8/1024 at 97, 5/1024 at 99. It changes every level — that's why xp/run is not constant.">
                Level penalty now
              </Hint>
            </td>
            <td className="tk-total">{(charPenaltyFrac(state.currentLevel) * 100).toFixed(2)}%</td>
          </tr>
          <tr>
            <td className="tk-label">
              <Hint text="Number of players in the online game. Monster xp is multiplied by (players + 1) / 2 at spawn, capped at 8,388,607 per monster.">
                Players in game
              </Hint>
            </td>
            <td>
              <Num value={state.playersInGame} min={1} max={8}
                onChange={(v) => dispatch({ type: "field", key: "playersInGame", value: v })} />
            </td>
            <td className="tk-label">xp multiplier</td>
            <td className="tk-total">×{playersMod(state.playersInGame).toFixed(2)}</td>
            <td className="tk-label">
              <Hint text="Wall-clock length of one full run. Runs per hour = 3600 / this.">
                Run time (s)
              </Hint>
            </td>
            <td>
              <Num value={state.runSeconds} min={1}
                onChange={(v) => dispatch({ type: "field", key: "runSeconds", value: v })} />
            </td>
          </tr>

          {/* ---- bonus magnitudes (toggled per kill below) ---- */}
          <tr className="tk-subhead">
            <td className="tk-label" colSpan={6}>
              Bonus xp <span className="tk-dim">— tick shrine / anni per monster below</span>
            </td>
          </tr>
          <tr>
            <td className="tk-label">
              <Hint text="An Experience Shrine grants +50% xp while active. Toggle it on the kills it covers.">
                Shrine bonus
              </Hint>
            </td>
            <td className="tk-total">+{SHRINE_PCT}%</td>
            <td className="tk-label">
              <Hint text="Classic D2 Annihilus gives no xp — set this to your realm's rule, then toggle it per kill.">
                Anni bonus
              </Hint>
            </td>
            <td>
              +
              <Num value={anniPct} min={0} width={56}
                onChange={(v) => dispatch({ type: "anniPct", value: v })} />{" "}
              %
            </td>
            <td className="tk-dim" colSpan={2}>
              tick per kill →
            </td>
          </tr>

          {/* ---- collection ---- */}
          <tr className="tk-subhead">
            <td className="tk-label" colSpan={6}>
              Farm target
              <select
                className="tk-select"
                value=""
                onChange={(e) => {
                  const c = PRESET_COLLECTIONS.find((p) => p.name === e.target.value);
                  if (c) dispatch({ type: "preset", collection: c });
                }}
              >
                <option value="">load preset…</option>
                {PRESET_COLLECTIONS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input className="tk-input tk-cname" value={state.collection.name}
                onChange={(e) => dispatch({ type: "renameCollection", name: e.target.value })} />
              <button className="tk-btn" onClick={() => dispatch({ type: "addKill" })}>
                + kill
              </button>
            </td>
          </tr>
          <tr className="tk-colhead">
            <td className="tk-label">Monster</td>
            <td>
              <Hint text="Fixed: floor(MonLvl.XP(H)[monLevel] × monstats base / 100).">Base XP</Hint>
            </td>
            <td>
              <Hint text="Fixed monster level. Your level minus this drives the ratio penalty: 5+ below = less xp, 10+ below = only 5%.">
                Mon lvl · ratio
              </Hint>
            </td>
            <td>
              <Hint text="How many of this monster die per run. A throne wave is a pack, so more than one.">Count</Hint>
            </td>
            <td>
              <Hint text="Partied players present sharing this kill. 1 = you solo it and keep the whole (capped) share.">Party</Hint>
            </td>
            <td>
              <Hint text="Shrine (+50%) and anni bonuses that apply to this specific kill.">Bonus</Hint>
            </td>
          </tr>
          {state.collection.kills.map((k, i) => {
            const m = MONSTER_BY_ID[k.monsterId];
            const b = killAtLevel(k, state.currentLevel, state.playersInGame, killExtraPct(k, anniPct));
            return (
              <tr key={i}>
                <td className="tk-label">
                  <select className="tk-select" value={k.monsterId}
                    onChange={(e) => dispatch({ type: "kill", index: i, patch: { monsterId: e.target.value } })}>
                    {MONSTERS.map((mm) => (
                      <option key={mm.id} value={mm.id}>
                        {mm.name}
                      </option>
                    ))}
                  </select>
                  <button className="tk-x" onClick={() => dispatch({ type: "removeKill", index: i })}>
                    ×
                  </button>
                </td>
                <td className="tk-dim">{m ? fmtInt(finalBaseXp(m)) : "—"}</td>
                <td className="tk-dim">
                  {m ? `L${m.level}` : "—"}
                  {b && (
                    <div className={b.ratioNum < b.ratioDen ? "tk-warn" : "tk-dim"}>
                      ×{(b.ratioNum / b.ratioDen).toFixed(3)}
                    </div>
                  )}
                </td>
                <td>
                  <Num value={k.count} min={1} width={58}
                    onChange={(v) => dispatch({ type: "kill", index: i, patch: { count: v } })} />
                </td>
                <td>
                  <Num value={k.partySize} min={1} max={8} width={58}
                    onChange={(v) => dispatch({ type: "kill", index: i, patch: { partySize: v } })} />
                  <div className="tk-dim">+{partyBonusPct(k.partySize).toFixed(0)}%</div>
                </td>
                <td className="tk-kbonus">
                  <label className="tk-check" title="Experience shrine active for this kill (+50%)">
                    <input type="checkbox" checked={!!k.shrine}
                      onChange={(e) => dispatch({ type: "kill", index: i, patch: { shrine: e.target.checked } })} />
                    shrine
                  </label>
                  <label className="tk-check" title={`Anni counted for this kill (+${anniPct}%)`}>
                    <input type="checkbox" checked={!!k.anni}
                      onChange={(e) => dispatch({ type: "kill", index: i, patch: { anni: e.target.checked } })} />
                    anni
                  </label>
                </td>
              </tr>
            );
          })}

          {/* ---- result ---- */}
          <tr className="tk-subhead">
            <td className="tk-label" colSpan={6}>
              Result — {state.currentLevel} → {Math.max(state.currentLevel, state.targetLevel)}
            </td>
          </tr>
          <tr>
            <td className="tk-label">
              <b>XP / run</b> <span className="tk-dim">(at {state.currentLevel})</span>
            </td>
            <td className="tk-total">
              <b>{fmtXp(result.xpPerRunNow)}</b>
            </td>
            <td className="tk-label">XP / hour</td>
            <td className="tk-total tk-headline">{fmtCompact(result.xpPerHourNow)}</td>
            <td className="tk-label">Runs / hour</td>
            <td className="tk-total">{result.runsPerHour.toFixed(1)}</td>
          </tr>
          <tr>
            <td className="tk-label">
              <b>Total runs</b>
            </td>
            <td className="tk-total">
              <b>{fmtInt(result.totalRuns)}</b>
            </td>
            <td className="tk-label">
              <b>Time to target</b>
            </td>
            <td className="tk-total tk-headline" colSpan={3}>
              <b>{fmtDuration(result.totalHours)}</b>{" "}
              <span className="tk-dim">({result.totalHours.toFixed(1)} h · {fmtCompact(result.xpNeeded)} xp)</span>
            </td>
          </tr>

          {/* ---- per-level breakdown ---- */}
          <tr className="tk-subhead">
            <td className="tk-label" colSpan={6}>
              <Hint text="xp/run drops each level because the high-level penalty shrinks — so each level is computed on its own, not one flat number.">
                Per level (xp/run is not the same every level)
              </Hint>
            </td>
          </tr>
          <tr className="tk-colhead">
            <td className="tk-label">Level</td>
            <td>Penalty</td>
            <td>XP / run</td>
            <td>XP to next</td>
            <td>Runs</td>
            <td>Time</td>
          </tr>
          {result.rows.map((r) => (
            <tr key={r.level} className={r.level === bl ? "tk-active" : undefined}>
              <td className="tk-label">
                {r.level} → {r.level + 1}
              </td>
              <td className="tk-dim">{(charPenaltyFrac(r.level) * 100).toFixed(2)}%</td>
              <td className="tk-total">{fmtXp(r.xpPerRun)}</td>
              <td className="tk-dim">{fmtCompact(r.xpToNext)}</td>
              <td className="tk-total">{fmtInt(r.runs)}</td>
              <td className="tk-dim">{fmtDuration(r.hours)}</td>
            </tr>
          ))}

        </tbody>
      </table>

      {/* ---- worked-out ("staartdeling") breakdown of the whole run ---- */}
      <div className="tk-explain">
        <div className="tk-explain-head">
          How we get the number — the whole run at level{" "}
          <select className="tk-select" value={bl} onChange={(e) => setBreakLevel(Number(e.target.value))}>
            {result.rows.map((r) => (
              <option key={r.level} value={r.level}>
                {r.level}
              </option>
            ))}
          </select>
        </div>
        {state.collection.kills.map((k, i) => {
          const kExtra = killExtraPct(k, anniPct);
          return (
            <KillLedger key={i} b={killAtLevel(k, bl, state.playersInGame, kExtra)} k={k}
              players={state.playersInGame} charLevel={bl} />
          );
        })}
        <div className="tk-ledger tk-grandtotal">
          <div className="tk-ledger-row tk-ledger-answer">
            <span className="tk-ledger-op">Σ TOTAL xp per run ({state.collection.kills.length} sources)</span>
            <span className="tk-ledger-expr">{fmtInt(xpPerRunAtLevel(state, bl))}</span>
          </div>
        </div>
      </div>

      <p className="tk-foot">
        Base XP is fixed from game data: <code>floor(MonLvl.XP(H)[monLevel] × monstats_base / 100)</code>, then ×
        (players+1)/2 and capped at 8,388,607 at spawn, then the level-difference penalty, party split, party bonus,
        high-level penalty and item/shrine bonuses at the kill — every step truncated to an integer, like the game.
        Party split is modelled as an even share.
        {" "}
        <a className="tk-gh" href="https://github.com/jaenster/experience-calc" target="_blank" rel="noreferrer">
          source on GitHub ↗
        </a>
      </p>
    </div>
  );
}
