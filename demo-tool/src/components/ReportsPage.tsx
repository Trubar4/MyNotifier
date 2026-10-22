import { useState, useMemo, useRef } from 'react';
import { Minus, Plus, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { MachineConfig } from '../data/types';
import { machineThreshold } from '../data/types';
import { useLang, boomLabel } from '../i18n';
import {
  generateHistoricalWind,
  aggregateToDaily,
  interpolateTo10Min,
  type WindEntry,
} from '../data/historicalWind';

type Resolution = '10min' | '1h' | '1day';
type Status = 'danger' | 'warning' | 'safe';
type Filter = 'alle' | Status;

interface ReportsPageProps {
  machines: MachineConfig[];
}

function formatDT(d: Date, resolution: Resolution, loc = 'de-DE'): string {
  if (resolution === '1day') {
    return d.toLocaleDateString(loc, { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
  return d.toLocaleString(loc, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
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

function statusOf(value: number, orange: number, red: number): Status {
  if (value >= red) return 'danger';
  if (value >= orange) return 'warning';
  return 'safe';
}

function barColor(status: Status): string {
  return status === 'danger' ? 'var(--r-error)' : status === 'warning' ? 'var(--r-warning)' : 'var(--r-success)';
}

export function ReportsPage({ machines }: ReportsPageProps) {
  const { lang, t } = useLang();
  const loc = lang === 'en' ? 'en-GB' : 'de-DE';
  const licensedMachines = machines.filter(m => m.license === 'active');

  const [stepNo, setStepNo] = useState<1 | 2>(1);
  const [machineId, setMachineId] = useState(licensedMachines[0]?.id ?? '');
  const [from, setFrom] = useState<Date>(daysAgo(3));
  const [to, setTo] = useState<Date>(new Date());
  const [resolution, setResolution] = useState<Resolution>('1h');
  const [filter, setFilter] = useState<Filter>('alle');

  const machine = machines.find(m => m.id === machineId);
  const threshold = machine ? machineThreshold(machine) : null;
  const sensor = 'mainBoom' as const;          // Haupt-/Nadel müssen nicht gewählt werden → Hauptausleger
  const sensorLabel = t('Hauptausleger', 'Main boom');

  const [redThreshold, setRedThreshold] = useState<number>(() => threshold ?? 15);
  const [orangeThreshold, setOrangeThreshold] = useState<number>(() => threshold ? Math.round(threshold * 0.8) : 12);

  function handleMachineChange(id: string) {
    setMachineId(id);
    const m = machines.find(x => x.id === id);
    const t = m ? machineThreshold(m) : null;
    setRedThreshold(t ?? 15);
    setOrangeThreshold(t ? Math.round(t * 0.8) : 12);
    setStepNo(1);
  }

  const allHistorical = useMemo(() => {
    if (!machine) return [];
    return generateHistoricalWind(machine.wind.needleBoom, machine.wind.mainBoom, parseInt(machine.serialNumber, 10) || 1);
  }, [machine]);

  const filteredRange = useMemo(() => allHistorical.filter(e => e.timestamp >= from && e.timestamp <= to), [allHistorical, from, to]);

  const resolved = useMemo((): WindEntry[] => {
    if (resolution === '1day') return aggregateToDaily(filteredRange);
    if (resolution === '10min') return interpolateTo10Min(filteredRange);
    return filteredRange;
  }, [filteredRange, resolution]);

  const maxValue = useMemo(() => Math.max(...resolved.map(e => e[sensor]), redThreshold, 1), [resolved, redThreshold]);

  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() { window.print(); }

  function handleExcelExport() {
    if (!machine) return;
    const rows = resolved.map(e => ({
      [t('Zeitpunkt', 'Time')]: formatDT(e.timestamp, resolution, loc),
      [t('Nadelausleger (m/s)', 'Jib (m/s)')]: e.needleBoom,
      [t('Hauptausleger (m/s)', 'Main boom (m/s)')]: e.mainBoom,
      [t('Status', 'Status')]: e[sensor] >= redThreshold ? t('ÜBERSCHRITTEN', 'EXCEEDED') : e[sensor] >= orangeThreshold ? t('WARNUNG', 'WARNING') : 'OK',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('Windbericht', 'Wind report'));
    XLSX.writeFile(wb, `${t('Windbericht', 'Wind_report')}_${machine.serialNumber}_${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.xlsx`);
  }

  function stepper(setter: (fn: (v: number) => number) => void, delta: number) {
    setter(v => Math.max(0, Math.round((v + delta) * 2) / 2));
  }

  const canReport = !!machine && resolved.length > 0;
  const filterMatch = (s: Status) => filter === 'alle' || filter === s;

  return (
    <div className="reports-page" ref={printRef}>
      <h1 className="page-title">{t('Windberichte', 'Wind reports')}</h1>

      {/* Step tabs 01 / 02 */}
      <div className="rep-steps no-print" role="tablist">
        <button
          className={`rep-step ${stepNo === 1 ? 'rep-step--active' : ''}`}
          onClick={() => setStepNo(1)}
          role="tab"
          aria-selected={stepNo === 1}
        >
          01
        </button>
        <button
          className={`rep-step ${stepNo === 2 ? 'rep-step--active' : ''}`}
          onClick={() => canReport && setStepNo(2)}
          role="tab"
          aria-selected={stepNo === 2}
          disabled={!canReport}
        >
          02
        </button>
      </div>

      {/* ======================= STEP 01 — KONFIGURATION ======================= */}
      {stepNo === 1 && (
        <div className="rep-form no-print">
          <h2 className="rep-section-title">{t('Konfiguration', 'Configuration')}</h2>

          <div className="rep-field">
            <label className="rep-label">{t('Maschine', 'Machine')}</label>
            <select className="rep-select" value={machineId} onChange={e => handleMachineChange(e.target.value)}>
              {licensedMachines.map(m => (
                <option key={m.id} value={m.id}>{m.name} - {m.serialNumber}</option>
              ))}
            </select>
          </div>

          <div className="rep-field">
            <label className="rep-label">{t('Von', 'From')}</label>
            <input type="datetime-local" className="rep-input" value={formatDateLocal(from)} onChange={e => { const d = new Date(e.target.value); if (!isNaN(d.getTime())) setFrom(d); }} />
          </div>
          <div className="rep-field">
            <label className="rep-label">{t('Bis', 'To')}</label>
            <input type="datetime-local" className="rep-input" value={formatDateLocal(to)} onChange={e => { const d = new Date(e.target.value); if (!isNaN(d.getTime())) setTo(d); }} />
          </div>

          <div className="rep-field">
            <label className="rep-label">{t('Skalierung', 'Resolution')}</label>
            <div className="m-segment m-segment--3">
              <button className={`m-segment__btn ${resolution === '10min' ? 'm-segment__btn--active' : ''}`} onClick={() => setResolution('10min')}>{t('10 Min', '10 min')}</button>
              <button className={`m-segment__btn ${resolution === '1h' ? 'm-segment__btn--active' : ''}`} onClick={() => setResolution('1h')}>{t('1 Std', '1 h')}</button>
              <button className={`m-segment__btn ${resolution === '1day' ? 'm-segment__btn--active' : ''}`} onClick={() => setResolution('1day')}>{t('1 Tag', '1 day')}</button>
            </div>
          </div>

          <div className="rep-field">
            <label className="rep-label">{t('Grenzwerte', 'Limits')}</label>
            <div className="rep-limits">
              <div className="rep-limit">
                <span className="rep-limit-head"><span className="rep-dot rep-dot--red" />{t('Kritisch', 'Critical')} <span className="rep-limit-unit">m/s</span></span>
                <div className="m-stepper">
                  <button onClick={() => stepper(setRedThreshold, -0.5)} aria-label={t('weniger', 'less')}><Minus size={16} /></button>
                  <input type="number" value={redThreshold} onChange={e => setRedThreshold(parseFloat(e.target.value) || 0)} />
                  <button onClick={() => stepper(setRedThreshold, 0.5)} aria-label={t('mehr', 'more')}><Plus size={16} /></button>
                </div>
              </div>
              <div className="rep-limit">
                <span className="rep-limit-head"><span className="rep-dot rep-dot--orange" />{t('Warnung', 'Warning')} <span className="rep-limit-unit">m/s</span></span>
                <div className="m-stepper">
                  <button onClick={() => stepper(setOrangeThreshold, -0.5)} aria-label={t('weniger', 'less')}><Minus size={16} /></button>
                  <input type="number" value={orangeThreshold} onChange={e => setOrangeThreshold(parseFloat(e.target.value) || 0)} />
                  <button onClick={() => stepper(setOrangeThreshold, 0.5)} aria-label={t('mehr', 'more')}><Plus size={16} /></button>
                </div>
              </div>
            </div>
            {machine && threshold !== null && (
              <div className="rep-limit-ref">
                {t('Position', 'Position')} {boomLabel(machine.position.position, lang)}: <strong>{threshold} m/s</strong>
              </div>
            )}
          </div>

          <button className="m-btn m-btn--primary m-btn--block" onClick={() => setStepNo(2)} disabled={!canReport}>
            <BarChart3 size={18} />
            {t('Bericht anzeigen', 'Show report')}
          </button>
        </div>
      )}

      {/* ======================= STEP 02 — BERICHT ======================= */}
      {stepNo === 2 && machine && (
        <div className="reports-content">
          <h2 className="rep-section-title no-print">{t('Bericht', 'Report')}</h2>

          <div className="rep-field no-print">
            <label className="rep-label">{t('Filter', 'Filter')}</label>
            <select className="rep-select" value={filter} onChange={e => setFilter(e.target.value as Filter)}>
              <option value="alle">{t('Alle', 'All')}</option>
              <option value="danger">{t('Kritisch', 'Critical')}</option>
              <option value="warning">{t('Warnung', 'Warning')}</option>
              <option value="safe">OK</option>
            </select>
          </div>

          <div className="reports-chart-wrap">
            <div className="reports-chart-title">
              <strong>{machine.name} - {machine.serialNumber}</strong><br />
              {sensorLabel} · {formatDT(from, resolution, loc)} – {formatDT(to, resolution, loc)}
            </div>
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
                    const st = statusOf(val, orangeThreshold, redThreshold);
                    const h = (val / maxValue) * 100;
                    return (
                      <div
                        key={i}
                        className="reports-bar"
                        style={{ height: `${h}%`, background: barColor(st), opacity: filterMatch(st) ? 1 : 0.15 }}
                        title={`${formatDT(e.timestamp, resolution, loc)}: ${val.toFixed(1)} m/s`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="reports-x-axis">
              {(() => {
                const axisLabel = (d: Date) => {
                  const dm = d.toLocaleDateString(loc, { day: '2-digit', month: '2-digit' });
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
              <span className="reports-legend-item"><span className="reports-legend-dot" style={{ background: 'var(--r-error)' }} />{t('Kritisch', 'Critical')}</span>
              <span className="reports-legend-item"><span className="reports-legend-dot" style={{ background: 'var(--r-warning)' }} />{t('Warnung', 'Warning')}</span>
              <span className="reports-legend-item"><span className="reports-legend-dot" style={{ background: 'var(--r-success)' }} />OK</span>
            </div>
          </div>

          <div className="rep-export no-print">
            <button className="m-btn m-btn--primary" onClick={handleExcelExport}><img src={`${import.meta.env.BASE_URL}icon-xls.svg`} alt="" width={16} height={16} className="m-icon" />{t('XLSX exportieren', 'Export XLSX')}</button>
            <button className="m-btn m-btn--outline" onClick={handlePrint}><img src={`${import.meta.env.BASE_URL}icon-print.svg`} alt="" width={16} height={16} className="m-icon" />{t('PDF drucken', 'Print PDF')}</button>
          </div>

          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr><th>{t('Zeitpunkt', 'Time')}</th><th>{t('Nadel', 'Jib')}</th><th>{t('Haupt', 'Main')}</th><th>{t('Status', 'Status')}</th></tr>
              </thead>
              <tbody>
                {resolved.filter(e => filterMatch(statusOf(e[sensor], orangeThreshold, redThreshold))).map((e, i) => {
                  const st = statusOf(e[sensor], orangeThreshold, redThreshold);
                  return (
                    <tr key={i} className={`reports-table__row--${st}`}>
                      <td>{formatDT(e.timestamp, resolution, loc)}</td>
                      <td>{e.needleBoom.toFixed(1)}</td>
                      <td>{e.mainBoom.toFixed(1)}</td>
                      <td className={`reports-table__status--${st}`}>
                        {st === 'danger' ? t('ÜBERSCHR.', 'EXCEED.') : st === 'warning' ? t('WARNUNG', 'WARNING') : 'OK'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
