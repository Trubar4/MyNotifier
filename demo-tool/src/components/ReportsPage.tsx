import { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import type { MachineConfig } from '../data/types';
import { BOOM_THRESHOLDS } from '../data/types';
import {
  generateHistoricalWind,
  aggregateToDaily,
  interpolateTo10Min,
  type WindEntry,
} from '../data/historicalWind';

type Resolution = '10min' | '1h' | '1day';
type Sensor = 'needleBoom' | 'mainBoom';

interface ReportsPageProps {
  machines: MachineConfig[];
}

function formatDT(d: Date, resolution: Resolution): string {
  if (resolution === '1day') {
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
  return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatDateLocal(d: Date): string {
  return d.toISOString().slice(0, 16);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function barColor(value: number, orange: number, red: number): string {
  if (value >= red) return 'var(--r-error)';
  if (value >= orange) return 'var(--r-warning)';
  return 'var(--r-success)';
}

export function ReportsPage({ machines }: ReportsPageProps) {
  const licensedMachines = machines.filter(m => m.license === 'active');

  const [machineId, setMachineId] = useState(licensedMachines[0]?.id ?? '');
  const [from, setFrom] = useState<Date>(daysAgo(7));
  const [to, setTo] = useState<Date>(new Date());
  const [resolution, setResolution] = useState<Resolution>('1h');
  const [sensor, setSensor] = useState<Sensor>('mainBoom');

  const machine = machines.find(m => m.id === machineId);
  const threshold = machine ? BOOM_THRESHOLDS[machine.position.position] : null;

  const [redThreshold, setRedThreshold] = useState<number>(() => threshold ?? 15);
  const [orangeThreshold, setOrangeThreshold] = useState<number>(() => threshold ? Math.round(threshold * 0.8) : 12);

  // Sync thresholds when machine changes
  function handleMachineChange(id: string) {
    setMachineId(id);
    const m = machines.find(x => x.id === id);
    const t = m ? BOOM_THRESHOLDS[m.position.position] : null;
    setRedThreshold(t ?? 15);
    setOrangeThreshold(t ? Math.round(t * 0.8) : 12);
  }

  // Historical data (memoized per machine)
  const allHistorical = useMemo(() => {
    if (!machine) return [];
    return generateHistoricalWind(
      machine.wind.needleBoom,
      machine.wind.mainBoom,
      parseInt(machine.serialNumber, 10) || 1
    );
  }, [machine]);

  // Filter by time range
  const filtered = useMemo(() => {
    return allHistorical.filter(e => e.timestamp >= from && e.timestamp <= to);
  }, [allHistorical, from, to]);

  // Apply resolution
  const resolved = useMemo((): WindEntry[] => {
    if (resolution === '1day') return aggregateToDaily(filtered);
    if (resolution === '10min') return interpolateTo10Min(filtered);
    return filtered;
  }, [filtered, resolution]);

  const maxValue = useMemo(
    () => Math.max(...resolved.map(e => e[sensor]), redThreshold, 1),
    [resolved, sensor, redThreshold]
  );

  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    window.print();
  }

  function handleExcelExport() {
    if (!machine) return;
    const rows = resolved.map(e => ({
      'Zeitpunkt': formatDT(e.timestamp, resolution),
      'Nadelausleger (m/s)': e.needleBoom,
      'Hauptausleger (m/s)': e.mainBoom,
      'Status': e[sensor] >= redThreshold ? 'ÜBERSCHRITTEN' : e[sensor] >= orangeThreshold ? 'WARNUNG' : 'OK',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Windbericht');
    XLSX.writeFile(wb, `Windbericht_${machine.serialNumber}_${from.toISOString().slice(0,10)}_${to.toISOString().slice(0,10)}.xlsx`);
  }

  const sensorLabel = sensor === 'needleBoom' ? 'Nadelausleger' : 'Hauptausleger';

  return (
    <div className="reports-page" ref={printRef}>
      <h1 className="page-title">Windberichte</h1>

      {/* Controls — hidden on print */}
      <div className="reports-controls no-print">
        {/* 1. Maschine */}
        <div className="reports-control-group">
          <label className="reports-label">Maschine</label>
          <select
            className="reports-select"
            value={machineId}
            onChange={e => handleMachineChange(e.target.value)}
          >
            {licensedMachines.map(m => (
              <option key={m.id} value={m.id}>{m.name} – {m.serialNumber}</option>
            ))}
          </select>
        </div>

        {/* Sensor */}
        <div className="reports-control-group">
          <label className="reports-label">Sensor</label>
          <div className="reports-chips">
            <button className={`config-chip ${sensor === 'mainBoom' ? 'config-chip--active' : ''}`} onClick={() => setSensor('mainBoom')}>Hauptausleger</button>
            <button className={`config-chip ${sensor === 'needleBoom' ? 'config-chip--active' : ''}`} onClick={() => setSensor('needleBoom')}>Nadelausleger</button>
          </div>
        </div>

        {/* 2. Zeitraum */}
        <div className="reports-control-group">
          <label className="reports-label">Zeitraum</label>
          <div className="reports-chips">
            <button className="config-chip" onClick={() => { setFrom(daysAgo(1)); setTo(new Date()); }}>24h</button>
            <button className="config-chip" onClick={() => { setFrom(daysAgo(7)); setTo(new Date()); }}>7 Tage</button>
            <button className="config-chip" onClick={() => { setFrom(daysAgo(30)); setTo(new Date()); }}>30 Tage</button>
          </div>
          <div className="reports-date-range">
            <input type="datetime-local" className="position-fixation__input" value={formatDateLocal(from)} onChange={e => { const d = new Date(e.target.value); if (!isNaN(d.getTime())) setFrom(d); }} />
            <span className="reports-date-sep">–</span>
            <input type="datetime-local" className="position-fixation__input" value={formatDateLocal(to)} onChange={e => { const d = new Date(e.target.value); if (!isNaN(d.getTime())) setTo(d); }} />
          </div>
        </div>

        {/* 3. Skalierung */}
        <div className="reports-control-group">
          <label className="reports-label">Skalierung</label>
          <div className="reports-chips">
            <button className={`config-chip ${resolution === '10min' ? 'config-chip--active' : ''}`} onClick={() => setResolution('10min')}>10 Min</button>
            <button className={`config-chip ${resolution === '1h' ? 'config-chip--active' : ''}`} onClick={() => setResolution('1h')}>1 Std</button>
            <button className={`config-chip ${resolution === '1day' ? 'config-chip--active' : ''}`} onClick={() => setResolution('1day')}>1 Tag</button>
          </div>
        </div>

        {/* Schwellenwerte */}
        <div className="reports-control-group">
          <label className="reports-label">Grenzwerte</label>
          <div className="reports-thresholds">
            <label className="reports-threshold-row">
              <span className="reports-threshold-dot reports-threshold-dot--red" />
              <span className="reports-threshold-label">Rot</span>
              <input
                type="number"
                min={0}
                max={50}
                step={0.5}
                className="reports-threshold-input"
                value={redThreshold}
                onChange={e => setRedThreshold(parseFloat(e.target.value) || 0)}
              />
              <span className="reports-threshold-unit">m/s</span>
            </label>
            <label className="reports-threshold-row">
              <span className="reports-threshold-dot reports-threshold-dot--orange" />
              <span className="reports-threshold-label">Orange</span>
              <input
                type="number"
                min={0}
                max={50}
                step={0.5}
                className="reports-threshold-input"
                value={orangeThreshold}
                onChange={e => setOrangeThreshold(parseFloat(e.target.value) || 0)}
              />
              <span className="reports-threshold-unit">m/s</span>
            </label>
          </div>
        </div>

        {/* Export */}
        <div className="reports-control-group reports-control-group--export">
          <button className="lds-btn lds-btn--ghost lds-btn--sm" onClick={handlePrint}>PDF drucken</button>
          <button className="lds-btn lds-btn--primary lds-btn--sm" onClick={handleExcelExport}>XLSX exportieren</button>
        </div>
      </div>

      {/* Report content */}
      {machine && resolved.length > 0 ? (
        <div className="reports-content">
          {/* Print header */}
          <div className="reports-print-header print-only">
            <h2>{machine.name} – {machine.serialNumber}</h2>
            <p>{sensorLabel} · {formatDT(from, resolution)} bis {formatDT(to, resolution)} · Skalierung: {resolution === '1day' ? '1 Tag' : resolution === '1h' ? '1 Stunde' : '10 Minuten'}</p>
            <p>Rotgrenze: {redThreshold} m/s · Orangegrenze: {orangeThreshold} m/s</p>
          </div>

          {/* Histogram */}
          <div className="reports-chart-wrap">
            <div className="reports-chart-title">{machine.name} · {sensorLabel} · {formatDT(from, resolution)} – {formatDT(to, resolution)}</div>

            {/* Y-axis labels + chart */}
            <div className="reports-chart-area">
              <div className="reports-y-axis">
                {[100, 75, 50, 25, 0].map(pct => (
                  <span key={pct} className="reports-y-label">{Math.round(maxValue * pct / 100)}</span>
                ))}
              </div>
              <div className="reports-chart-inner">
                {/* Threshold lines */}
                <div className="reports-threshold-line reports-threshold-line--red" style={{ bottom: `${(redThreshold / maxValue) * 100}%` }}>
                  <span className="reports-threshold-line-label">{redThreshold} m/s</span>
                </div>
                <div className="reports-threshold-line reports-threshold-line--orange" style={{ bottom: `${(orangeThreshold / maxValue) * 100}%` }} />
                {/* Bars */}
                <div className="reports-bars">
                  {resolved.map((e, i) => {
                    const val = e[sensor];
                    const h = (val / maxValue) * 100;
                    return (
                      <div
                        key={i}
                        className="reports-bar"
                        style={{ height: `${h}%`, background: barColor(val, orangeThreshold, redThreshold) }}
                        title={`${formatDT(e.timestamp, resolution)}: ${val.toFixed(1)} m/s`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-axis labels */}
            <div className="reports-x-axis">
              {(() => {
                const step = Math.max(1, Math.floor(resolved.length / 8));
                return resolved.filter((_, i) => i % step === 0).map((e, i) => (
                  <span key={i} className="reports-x-label">{formatDT(e.timestamp, resolution)}</span>
                ));
              })()}
            </div>

            {/* Legend */}
            <div className="reports-legend">
              <span className="reports-legend-item"><span className="reports-legend-dot" style={{ background: 'var(--r-success)' }} />OK</span>
              <span className="reports-legend-item"><span className="reports-legend-dot" style={{ background: 'var(--r-warning)' }} />≥ {orangeThreshold} m/s</span>
              <span className="reports-legend-item"><span className="reports-legend-dot" style={{ background: 'var(--r-error)' }} />≥ {redThreshold} m/s</span>
            </div>
          </div>

          {/* Table */}
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Zeitpunkt</th>
                  <th>Nadelausleger (m/s)</th>
                  <th>Hauptausleger (m/s)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {resolved.map((e, i) => {
                  const val = e[sensor];
                  const status = val >= redThreshold ? 'danger' : val >= orangeThreshold ? 'warning' : 'safe';
                  return (
                    <tr key={i} className={`reports-table__row--${status}`}>
                      <td>{formatDT(e.timestamp, resolution)}</td>
                      <td>{e.needleBoom.toFixed(1)}</td>
                      <td>{e.mainBoom.toFixed(1)}</td>
                      <td className={`reports-table__status--${status}`}>
                        {status === 'danger' ? 'ÜBERSCHRITTEN' : status === 'warning' ? 'WARNUNG' : 'OK'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="machine-empty">Keine Daten für den gewählten Zeitraum.</div>
      )}
    </div>
  );
}
