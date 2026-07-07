import React, { useMemo, useReducer } from "react";
import {
  KillSource,
  RunConfig,
  evalRun,
  baalRunPreset,
  partyBonusPct,
  playersMod,
  charPenaltyFrac,
} from "../calc/run";
import { fmtInt, fmtXp, fmtCompact, fmtPct, fmtDuration } from "../helpers/format";

type State = RunConfig;

type Action =
  | { type: "field"; key: "currentLevel" | "targetLevel" | "playersSetting" | "runSeconds"; value: number }
  | { type: "source"; index: number; patch: Partial<KillSource> }
  | { type: "addSource" }
  | { type: "removeSource"; index: number }
  | { type: "preset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "field":
      return { ...state, [action.key]: action.value };
    case "source":
      return {
        ...state,
        sources: state.sources.map((s, i) => (i === action.index ? { ...s, ...action.patch } : s)),
      };
    case "addSource":
      return {
        ...state,
        sources: [...state.sources, { name: "New monster", baseXp: 100000, count: 1, partySize: 1, bonusPct: 0 }],
      };
    case "removeSource":
      return { ...state, sources: state.sources.filter((_, i) => i !== action.index) };
    case "preset":
      return { ...state, sources: baalRunPreset() };
  }
}

const initial: State = {
  currentLevel: 97,
  targetLevel: 99,
  playersSetting: 8,
  runSeconds: 163, // ~2m43s per run, the spreadsheet's default pace
  sources: baalRunPreset(),
};

function NumCell(props: {
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
  width?: number;
}) {
  return (
    <input
      className="tk-input"
      type="number"
      value={props.value}
      step={props.step ?? 1}
      min={props.min}
      max={props.max}
      style={{ width: props.width ?? 90 }}
      onChange={(e) => props.onChange(Number(e.target.value))}
    />
  );
}

export function Sheet() {
  const [state, dispatch] = useReducer(reducer, initial);
  const result = useMemo(() => evalRun(state), [state]);

  const runMinutes = state.runSeconds / 60;

  return (
    <div className="tk-wrap">
      <table className="table table-dark tk-sheet">
        <thead>
          <tr>
            <td colSpan={7} className="tk-title">
              <h3>Baal / Boss XP Efficiency — road to 99</h3>
              <span className="tk-sub-title">
                faithful to Baalrun.xlsx · experience mechanics per the Amazon Basin wiki
              </span>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr className="tk-subhead">
            <td className="tk-label" colSpan={7}>
              Character &amp; game
            </td>
          </tr>
          <tr>
            <td className="tk-label">Current level</td>
            <td>
              <NumCell value={state.currentLevel} min={1} max={99}
                onChange={(v) => dispatch({ type: "field", key: "currentLevel", value: v })} />
            </td>
            <td className="tk-label">Target level</td>
            <td>
              <NumCell value={state.targetLevel} min={1} max={99}
                onChange={(v) => dispatch({ type: "field", key: "targetLevel", value: v })} />
            </td>
            <td className="tk-label">Level penalty</td>
            <td colSpan={2} className="tk-total">
              {fmtPct(charPenaltyFrac(state.currentLevel) * 100)} of xp (÷1024)
            </td>
          </tr>
          <tr>
            <td className="tk-label">Players (/players X)</td>
            <td>
              <NumCell value={state.playersSetting} min={1} max={8}
                onChange={(v) => dispatch({ type: "field", key: "playersSetting", value: v })} />
            </td>
            <td className="tk-label">Players mod</td>
            <td className="tk-total">×{playersMod(state.playersSetting).toFixed(2)}</td>
            <td className="tk-label">Run time</td>
            <td colSpan={2}>
              <NumCell value={state.runSeconds} min={1} step={1} width={80}
                onChange={(v) => dispatch({ type: "field", key: "runSeconds", value: v })} />{" "}
              s <span className="tk-dim">({runMinutes.toFixed(2)} min)</span>
            </td>
          </tr>

          <tr className="tk-subhead">
            <td className="tk-label" colSpan={7}>
              Kill sources
              <button className="tk-btn" onClick={() => dispatch({ type: "preset" })}>
                reset to Baal run
              </button>
              <button className="tk-btn" onClick={() => dispatch({ type: "addSource" })}>
                + add
              </button>
            </td>
          </tr>
          <tr className="tk-colhead">
            <td className="tk-label">Monster</td>
            <td>Base XP</td>
            <td>Count</td>
            <td>Party</td>
            <td>Mon lvl</td>
            <td>Bonus %</td>
            <td>XP / run</td>
          </tr>
          {state.sources.map((s, i) => {
            const sr = result.perSource[i];
            return (
              <tr key={i}>
                <td className="tk-label">
                  <input
                    className="tk-input tk-name"
                    value={s.name}
                    onChange={(e) => dispatch({ type: "source", index: i, patch: { name: e.target.value } })}
                  />
                  <button className="tk-x" title="remove" onClick={() => dispatch({ type: "removeSource", index: i })}>
                    ×
                  </button>
                </td>
                <td>
                  <NumCell value={s.baseXp} min={0} step={1000}
                    onChange={(v) => dispatch({ type: "source", index: i, patch: { baseXp: v } })} />
                </td>
                <td>
                  <NumCell value={s.count} min={1} width={60}
                    onChange={(v) => dispatch({ type: "source", index: i, patch: { count: v } })} />
                </td>
                <td>
                  <NumCell value={s.partySize} min={1} max={8} width={60}
                    onChange={(v) => dispatch({ type: "source", index: i, patch: { partySize: v } })} />
                  <div className="tk-dim">+{fmtPct(partyBonusPct(s.partySize))}</div>
                </td>
                <td>
                  <input
                    className="tk-input"
                    type="number"
                    style={{ width: 60 }}
                    value={s.monsterLevel ?? ""}
                    placeholder="—"
                    onChange={(e) =>
                      dispatch({
                        type: "source",
                        index: i,
                        patch: { monsterLevel: e.target.value === "" ? undefined : Number(e.target.value) },
                      })
                    }
                  />
                  {s.monsterLevel !== undefined && <div className="tk-dim">×{sr.ratioFrac.toFixed(3)}</div>}
                </td>
                <td>
                  <NumCell value={s.bonusPct} min={0} width={60}
                    onChange={(v) => dispatch({ type: "source", index: i, patch: { bonusPct: v } })} />
                </td>
                <td className="tk-total">{fmtXp(sr.xpPerRun)}</td>
              </tr>
            );
          })}

          <tr className="tk-subhead">
            <td className="tk-label" colSpan={7}>
              Result
            </td>
          </tr>
          <tr>
            <td className="tk-label">
              <b>XP per run</b>
            </td>
            <td colSpan={2} className="tk-total">
              <b>{fmtXp(result.xpPerRun)}</b>
            </td>
            <td className="tk-label">Runs / hour</td>
            <td colSpan={3} className="tk-total">
              {result.runsPerHour.toFixed(1)}
            </td>
          </tr>
          <tr>
            <td className="tk-label">
              <b>XP per hour</b>
            </td>
            <td colSpan={2} className="tk-total tk-headline">
              <b>{fmtCompact(result.xpPerHour)}</b>
            </td>
            <td className="tk-label">
              XP to level {Math.max(state.currentLevel, state.targetLevel)}
            </td>
            <td colSpan={3} className="tk-total">
              {fmtCompact(result.xpNeeded)} <span className="tk-dim">({fmtInt(result.xpNeeded)})</span>
            </td>
          </tr>
          <tr>
            <td className="tk-label">Runs needed</td>
            <td colSpan={2} className="tk-total">
              {fmtInt(result.runsNeeded)}
            </td>
            <td className="tk-label">
              <b>Time to target</b>
            </td>
            <td colSpan={3} className="tk-total tk-headline">
              <b>{fmtDuration(result.hoursNeeded)}</b>{" "}
              <span className="tk-dim">({result.hoursNeeded.toFixed(1)} h)</span>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="tk-foot">
        Per-monster xp is capped at 8,388,607, split evenly across the party, multiplied by the party bonus,
        then by the /players setting and the high-level character penalty. Level-difference (ratio) penalty
        applies to monsters more than 5 levels below you. Tune run time and party sizes to find the most
        efficient run.
      </p>
    </div>
  );
}
