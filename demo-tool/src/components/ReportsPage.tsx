import { useState, useMemo, useRef } from 'react';
import { Minus, Plus, BarChart3, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { MachineConfig } from '../data/types';
import { BOOM_POSITION_LABELS, BOOM_THRESHOLDS } from '../data/types';
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
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const [from, setFrom] = useState<Date>(daysAgo(3));
  const [to, setTo] = useState<Date>(new Date());
  const [resolution, setResolution] = useState<Resolution>('1h');
  const [sensor, setSensor] = useState<Sensor>('mainBoom');
  const [showReport, setShowReport] = useState(false);

  const machine = machines.find(m => m.id === machineId);
  const threshold = machine ? BOOM_THRESHOLDS[machine.position.position] : null;

  const [redThreshold, setRedThreshold] = useState<number>(() => threshold ?? 15);
  const [orangeThreshold, setOrangeThreshold] = useState<number>(() => threshold ? Math.round(threshold * 0.8) : 12);

  function handleMachineChange(id: string) {
    setMachineId(id);
    const m = machines.find(x => x.id === id);
    const t = m ? BOOM_THRESHOLDS[m.position.position] : null;
    setRedThreshold(t ?? 15);
    setOrangeThreshold(t ? Math.round(t * 0.8) : 12);
    setShowReport(false);
  }

  const allHistorical = useMemo(() => {
    if (!machine) return [];
    return generateHistoricalWind(machine.wind.needleBoom, machine.wind.mainBoom, parseInt(machine.serialNumber, 10) || 1);
  }, [machine]);

  const filtered = useMemo(() => allHistorical.filter(e => e.timestamp >= from && e.timestamp <= to), [allHistorical, from, to]);

  const resolved = useMemo((): WindEntry[] => {
    if (resolution === '1day') return aggregateToDaily(filtered);
    if (resolution === '10min') return interpolateTo10Min(filtered);
    return filtered;
  }, [filtered, resolution]);

  const maxValue = useMemo(() => Math.max(...resolved.map(e => e[sensor]), redThreshold, 1), [resolved, sensor, redThreshold]);

  const printRef = useRef<HTMLDivElement>(null);
  const sensorLabel = sensor === 'needleBoom' ? 'Nadelausleger' : 'Hauptausleger';

  function handlePrint() { window.print(); }

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

  function step(setter: (fn: (v: number) => number) => void, delta: number) {
    setter(v => Math.max(0, Math.round((v + delta) * 2) / 2));
  }

  return (
    <div className="reports-page" ref={printRef}>
      <h1 className="page-title">Windberichte</h1>

      <div className="rep-form no-print">
        <div className="rep-field">
          <label className="rep-label">Machine</label>
          <select className="rep-select" value={machineId} onChange={e => handleMachineChange(e.target.value)}>
            {licensedMachines.map(m => (
              <option key={m.id} value={m.id}>{m.name} - {m.serialNumber}</option>
            ))}
          </select>
        </div>

        <div className="rep-field">
          <label className="rep-label">Sensor</label>
          <div className="m-segment">
            <button className={`m-segment__btn ${sensor === 'mainBoom' ? 'm-segment__btn--active' : ''}`} onClick={() => { setSensor('mainBoom'); setShowReport(false); }}>Hauptausleger</button>
            <button className={`m-segment__btn ${sensor === 'needleBoom' ? 'm-segment__btn--active' : ''}`} onClick={() => { setSensor('needleBoom'); setShowReport(false); }}>Nadelausleger</button>
          </div>
        </div>

        <div className="rep-field">
          <label className="rep-label">Von</label>
          <input type="datetime-local" className="rep-input" value={formatDateLocal(from)} onChange={e => { const d = new Date(e.target.value); if (!isNaN(d.getTime())) { setFrom(d); setShowReport(false); } }} />
        </div>
        <div className="rep-field">
          <label className="rep-label">Bis</label>
          <input type="datetime-local" className="rep-input" value={formatDateLocal(to)} onChange={e => { const d = new Date(e.target.value); if (!isNaN(d.getTime())) { setTo(d); setShowReport(false); } }} />
        </div>

        <div className="rep-field">
          <label className="rep-label">Skalierung</label>
          <div className="m-segment m-segment--3">
            <button className={`m-segment__btn ${resolution === '10min' ? 'm-segment__btn--active' : ''}`} onClick={() => { setResolution('10min'); setShowReport(false); }}>10 Min</button>
            <button className={`m-segment__btn ${resolution === '1h' ? 'm-segment__btn--active' : ''}`} onClick={() => { setResolution('1h'); setShowReport(false); }}>1 Std</button>
            <button className={`m-segment__btn ${resolution === '1day' ? 'm-segment__btn--active' : ''}`} onClick={() => { setResolution('1day'); setShowReport(false); }}>1 Tag</button>
          </div>
        </div>

        <div className="rep-field">
          <label className="rep-label">Grenzwerte</label>
          <div className="rep-limits">
            <div className="rep-limit">
              <span className="rep-limit-head"><span className="rep-dot rep-dot--red" />Kritisch <span className="rep-limit-unit">m/s</span></span>
              <div className="m-stepper">
                <button onClick={() => step(setRedThreshold, -0.5)} aria-label="weniger"><Minus size={16} /></button>
                <input type="number" value={redThreshold} onChange={e => setRedThreshold(parseFloat(e.target.value) || 0)} />
                <button onClick={() => step(setRedThreshold, 0.5)} aria-label="mehr"><Plus size={16} /></button>
              </div>
            </div>
            <div className="rep-limit">
              <span className="rep-limit-head"><span className="rep-dot rep-dot--orange" />Warnung <span className="rep-limit-unit">m/s</span></span>
              <div className="m-stepper">
                <button onClick={() => step(setOrangeThreshold, -0.5)} aria-label="weniger"><Minus size={16} /></button>
                <input type="number" value={orangeThreshold} onChange={e => setOrangeThreshold(parseFloat(e.target.value) || 0)} />
                <button onClick={() => step(setOrangeThreshold, 0.5)} aria-label="mehr"><Plus size={16} /></button>
              </div>
            </div>
          </div>
          {machine && threshold !== null && (
            <div className="rep-limit-ref">
              Arbeitsposition {BOOM_POSITION_LABELS[machine.position.position]}: <strong>{threshold} m/s</strong>
            </div>
          )}
        </div>

        <button className="m-btn m-btn--primary m-btn--block" onClick={() => setShowReport(true)} disabled={!machine}>
          <BarChart3 size={18} />
          Bericht anzeigen
        </button>
      </div>

      {showReport && machine && resolved.length > 0 ? (
        <div className="reports-content">
          <div className="reports-print-header print-only">
            <h2>{machine.name} – {machine.serialNumber}</h2>
            <p>{sensorLabel} · {formatDT(from, resolution)} bis {formatDT(to, resolution)}</p>
          </div>

          <div className="reports-chart-wrap">
            <div className="reports-chart-title">{sensorLabel} · {formatDT(from, resolution)} – {formatDT(to, resolution)}</div>
            <div className="reports-chart-area">
              <div className="reports-y-axis">
                {[100, 75, 50, 25, 0].map(pct => (
                  <span key={pct} className="reports-y-label">{Math.round(maxValue * pct / 100)}</span>
                ))}
              </div>
              <div className="reports-chart-inner">
                <div className="reports-threshold-line reports-threshold-line--red" style={{ bottom: `${(redThreshold / maxValue) * 100}%` }}>
                  <span className="reports-threshold-line-label">{redThreshold}</span>
                </div>
                <div className="reports-threshold-line reports-threshold-line--orange" style={{ bottom: `${(orangeThreshold / maxValue) * 100}%` }} />
                <div className="reports-bars">
                  {resolved.map((e, i) => {
                    const val = e[sensor];
                    const h = (val / maxValue) * 100;
                    return (
                      <div key={i} className="reports-bar" style={{ height: `${h}%`, background: barColor(val, orangeThreshold, redThreshold) }} title={`${formatDT(e.timestamp, resolution)}: ${val.toFixed(1)} m/s`} />
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="reports-x-axis">
              {(() => {
                const axisLabel = (d: Date) => {
                  const dm = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
                  if (resolution === '1day') return dm;
                  const p = (n: number) => n.toString().padStart(2, '0');
                  return `${dm} ${p(d.getHours())}:${p(d.getMinutes())}`;
                };
                const step2 = Math.max(1, Math.ceil(resolved.length / 4));
                return resolved.filter((_, i) => i % step2 === 0).map((e, i) => (
                  <span key={i} className="reports-x-label">{axisLabel(e.timestamp)}</span>
                ));
              })()}
            </div>
            <div className="reports-legend">
              <span className="reports-legend-item"><span className="reports-legend-dot" style={{ background: 'var(--r-success)' }} />OK</span>
              <span className="reports-legend-item"><span className="reports-legend-dot" style={{ background: 'var(--r-warning)' }} />≥ {orangeThreshold} m/s</span>
              <span className="reports-legend-item"><span className="reports-legend-dot" style={{ background: 'var(--r-error)' }} />≥ {redThreshold} m/s</span>
            </div>
          </div>

          <div className="rep-export no-print">
            <button className="m-btn m-btn--outline" onClick={handlePrint}><FileText size={16} />PDF</button>
            <button className="m-btn m-btn--outline" onClick={handleExcelExport}><Download size={16} />XLSX</button>
          </div>

          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Zeitpunkt</th>
                  <th>Nadel</th>
                  <th>Haupt</th>
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
                        {status === 'danger' ? 'ÜBERSCHR.' : status === 'warning' ? 'WARNUNG' : 'OK'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : showReport ? (
        <div className="machine-empty">Keine Daten für den gewählten Zeitraum.</div>
      ) : null}
    </div>
  );
}
