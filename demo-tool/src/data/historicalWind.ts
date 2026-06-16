export interface WindEntry {
  timestamp: Date;
  needleBoom: number;
  mainBoom: number;
}

// Generates 30 days of hourly historical wind data ending now
export function generateHistoricalWind(
  baseNeedle: number,
  baseMain: number,
  seed: number
): WindEntry[] {
  const now = new Date();
  const entries: WindEntry[] = [];
  const totalHours = 30 * 24;

  // Simple pseudo-random based on seed + index
  function rand(i: number): number {
    const x = Math.sin(seed * 9301 + i * 49297 + 233) * 233;
    return x - Math.floor(x);
  }

  const peakNeedle = Math.max(baseNeedle * 1.8, baseNeedle + 4);
  const peakMain = Math.max(baseMain * 1.8, baseMain + 4);

  for (let h = totalHours; h >= 0; h--) {
    const ts = new Date(now.getTime() - h * 3600_000);
    const dayPhase = (h % 24) / 24; // 0-1 within the day
    const weekPhase = (h % 168) / 168;

    // Daily sine: calmer at night, windier afternoon
    const dailySine = Math.sin(dayPhase * Math.PI * 2 - Math.PI / 2) * 0.3 + 0.7;
    // Weekly pattern: stronger mid-week
    const weekSine = Math.sin(weekPhase * Math.PI * 2) * 0.2 + 0.8;
    // Random noise
    const noise = rand(h) * 0.4 + 0.8;
    const factor = dailySine * weekSine * noise;

    entries.push({
      timestamp: ts,
      needleBoom: Math.max(0, Math.round(peakNeedle * factor * 10) / 10),
      mainBoom: Math.max(0, Math.round(peakMain * factor * 10) / 10),
    });
  }

  return entries;
}

// Aggregate hourly entries to daily max
export function aggregateToDaily(entries: WindEntry[]): WindEntry[] {
  const map = new Map<string, WindEntry>();
  for (const e of entries) {
    const key = e.timestamp.toISOString().slice(0, 10);
    const existing = map.get(key);
    if (!existing || e.needleBoom > existing.needleBoom) {
      const day = new Date(e.timestamp);
      day.setHours(12, 0, 0, 0);
      map.set(key, { timestamp: day, needleBoom: e.needleBoom, mainBoom: e.mainBoom });
    }
  }
  return [...map.values()].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// Interpolate to ~10-min resolution (only for ranges ≤ 7 days to keep counts manageable)
export function interpolateTo10Min(entries: WindEntry[]): WindEntry[] {
  if (entries.length < 2) return entries;
  const result: WindEntry[] = [];
  for (let i = 0; i < entries.length - 1; i++) {
    const a = entries[i];
    const b = entries[i + 1];
    const steps = 6;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      result.push({
        timestamp: new Date(a.timestamp.getTime() + t * (b.timestamp.getTime() - a.timestamp.getTime())),
        needleBoom: Math.round((a.needleBoom + t * (b.needleBoom - a.needleBoom)) * 10) / 10,
        mainBoom: Math.round((a.mainBoom + t * (b.mainBoom - a.mainBoom)) * 10) / 10,
      });
    }
  }
  result.push(entries[entries.length - 1]);
  return result;
}
