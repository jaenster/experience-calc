const intFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const oneFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export function fmtInt(n: number): string {
  return intFmt.format(Math.round(n));
}

export function fmtXp(n: number): string {
  return intFmt.format(Math.round(n));
}

// Compact xp: 1.23M / 45.6K for headline figures.
export function fmtCompact(n: number): string {
  if (n >= 1_000_000) return oneFmt.format(n / 1_000_000) + "M";
  if (n >= 1_000) return oneFmt.format(n / 1_000) + "K";
  return fmtInt(n);
}

export function fmtPct(n: number): string {
  return oneFmt.format(n) + "%";
}

// Turn a number of hours into "3d 4h 12m" style.
export function fmtDuration(hours: number): string {
  if (!isFinite(hours) || hours <= 0) return "–";
  const totalMin = Math.round(hours * 60);
  const d = Math.floor(totalMin / (60 * 24));
  const h = Math.floor((totalMin % (60 * 24)) / 60);
  const m = totalMin % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m || parts.length === 0) parts.push(`${m}m`);
  return parts.join(" ");
}
