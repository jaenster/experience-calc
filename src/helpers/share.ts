import { Config } from "../calc/engine";
import { Kill } from "../data/collections";

// Compact, frontend-only sharing: the whole config is packed positionally (no field names),
// JSON-encoded and base64url'd into the URL hash, so it never reaches a server.
//
// [cl, tl, playersInGame, runSeconds, anniPct, collectionName, kills]
// kill: [monsterId, count, partySize, shrine, anni]

type PackedKill = [string, number, number, number, number];
type Packed = [number, number, number, number, number, string, PackedKill[]];

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeConfig(cfg: Config): string {
  const kills: PackedKill[] = cfg.collection.kills.map((k) => [
    k.monsterId,
    k.count,
    k.partySize,
    k.shrine ? 1 : 0,
    k.anni ? 1 : 0,
  ]);
  const packed: Packed = [
    cfg.currentLevel,
    cfg.targetLevel,
    cfg.playersInGame,
    cfg.runSeconds,
    cfg.bonuses.anniPct,
    cfg.collection.name,
    kills,
  ];
  return toBase64Url(new TextEncoder().encode(JSON.stringify(packed)));
}

export function decodeConfig(code: string): Config | null {
  try {
    const p = JSON.parse(new TextDecoder().decode(fromBase64Url(code))) as Packed;
    if (!Array.isArray(p) || p.length < 7 || !Array.isArray(p[6])) return null;
    const kills: Kill[] = p[6].map((k) => ({
      monsterId: String(k[0]),
      count: Number(k[1]),
      partySize: Number(k[2]),
      shrine: !!k[3],
      anni: !!k[4],
    }));
    return {
      currentLevel: Number(p[0]),
      targetLevel: Number(p[1]),
      playersInGame: Number(p[2]),
      runSeconds: Number(p[3]),
      bonuses: { anniPct: Number(p[4]) },
      collection: { name: String(p[5]), kills },
    };
  } catch {
    return null;
  }
}

export function configFromUrl(): Config | null {
  const m = window.location.hash.match(/[#&]s=([^&]+)/);
  return m ? decodeConfig(m[1]) : null;
}

export function shareUrl(cfg: Config): string {
  return window.location.origin + window.location.pathname + "#s=" + encodeConfig(cfg);
}
