import { useState } from 'react';
import { CheckCircle, AlertTriangle, WifiOff, Wifi } from 'lucide-react';
import type { MachineConfig, Notification, BoomPosition } from '../data/types';
import { BOOM_POSITION_LABELS, BOOM_THRESHOLDS } from '../data/types';
import { PositionSelector } from './PositionSelector';

const BASE = import.meta.env.BASE_URL;

interface DailyCheckPageProps {
  machines: MachineConfig[];
  notifications: Notification[];
  onUpdateMachine: (updated: MachineConfig) => void;
}

// Only overnight/parking positions are valid recommendations
const OVERNIGHT_POSITIONS: BoomPosition[] = ['parkposition', 'jackknife', 'boomDown'];

function getRecommendedPosition(maxWind: number): BoomPosition {
  for (const pos of OVERNIGHT_POSITIONS) {
    const threshold = BOOM_THRESHOLDS[pos];
    if (threshold === null || threshold > maxWind) return pos;
  }
  return 'boomDown';
}

function getMaxWindUntil(machine: MachineConfig, until: Date): { speed: number; timestamp: Date | null } {
  const relevant = machine.forecast.hourly.filter(h => h.timestamp <= until);
  if (relevant.length === 0) return { speed: 0, timestamp: null };
  const peak = relevant.reduce((max, h) => h.speed > max.speed ? h : max, relevant[0]);
  return { speed: peak.speed, timestamp: peak.timestamp };
}

function formatDateTime(d: Date): string {
  return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatDateTimeLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function tomorrowAt6(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(6, 0, 0, 0);
  return d;
}

export function DailyCheckPage({ machines, notifications, onUpdateMachine }: DailyCheckPageProps) {
  const [until, setUntil] = useState<Date>(tomorrowAt6());
  const [positionSelectorMachineId, setPositionSelectorMachineId] = useState<string | null>(null);
  const [filterActionNeeded, setFilterActionNeeded] = useState(false);

  const licensedMachines = machines.filter(m => m.license === 'active');

  function getUnreadNotifInfo(machineId: string) {
    const unread = notifications.filter(n => n.machineId === machineId && !n.read);
    return {
      critical: unread.filter(n => n.level === 1).length,
      warning: unread.filter(n => n.level === 2).length,
    };
  }

  const positionSelectorMachine = positionSelectorMachineId
    ? machines.find(m => m.id === positionSelectorMachineId)
    : null;

  return (
    <>
      <h1 className="page-title">Abendcheck</h1>

      <div className="dailycheck-header">
        <label className="dailycheck-until__label" htmlFor="dailycheck-until">
          Position vorschlagen bis:
        </label>
        <input
          id="dailycheck-until"
          type="datetime-local"
          className="position-fixation__input dailycheck-until__input"
          value={formatDateTimeLocal(until)}
          onChange={e => {
            const d = new Date(e.target.value);
            if (!isNaN(d.getTime())) setUntil(d);
          }}
        />
        <button
          className={`config-chip${filterActionNeeded ? ' config-chip--active' : ''} dailycheck-filter-btn`}
          onClick={() => setFilterActionNeeded(f => !f)}
        >
          Handlung nötig
        </button>
      </div>

      <div className="dailycheck-grid">
        {licensedMachines.filter(machine => {
          if (!filterActionNeeded) return true;
          const isOnline = machine.status === 'online';
          const positionKnown = isOnline || machine.position.manuallySet;
          if (!positionKnown) return true; // offline, position unknown
          const { speed: maxWind } = getMaxWindUntil(machine, until);
          const recommendedPos = getRecommendedPosition(maxWind);
          const recThreshold = BOOM_THRESHOLDS[recommendedPos];
          const currentThreshold = BOOM_THRESHOLDS[machine.position.position];
          const positionOk = currentThreshold === null ||
            (recThreshold !== null && currentThreshold >= recThreshold);
          return !positionOk;
        }).map(machine => {
          const isOnline = machine.status === 'online';
          const { speed: maxWind, timestamp: peakTime } = getMaxWindUntil(machine, until);
          const recommendedPos = getRecommendedPosition(maxWind);
          const recThreshold = BOOM_THRESHOLDS[recommendedPos];
          const buffer = recThreshold !== null && maxWind > 0
            ? Math.round(((recThreshold - maxWind) / recThreshold) * 100)
            : null;

          const currentPos = machine.position.position;
          const positionKnown = isOnline || machine.position.manuallySet;
          const currentThreshold = positionKnown ? BOOM_THRESHOLDS[currentPos] : undefined;

          // Green: current threshold >= recommended threshold (or boomDown chosen = always safe)
          const positionOk = positionKnown && (
            currentThreshold === null ||
            (recThreshold !== null && currentThreshold !== undefined && currentThreshold >= recThreshold)
          );
          // Red: threshold <= maxWind (actually unsafe)
          const positionInsufficient = positionKnown && currentThreshold !== undefined &&
            currentThreshold !== null && currentThreshold <= maxWind;
          // Yellow: threshold > maxWind but < recommended (sufficient for wind, but wrong overnight position)
          const positionWarning = positionKnown && !positionOk && !positionInsufficient;

          const notifInfo = getUnreadNotifInfo(machine.id);
          const totalNotifs = notifInfo.critical + notifInfo.warning;

          return (
            <div key={machine.id} className={`dailycheck-card${positionOk ? ' dailycheck-card--ok' : positionInsufficient ? ' dailycheck-card--bad' : positionWarning ? ' dailycheck-card--warn' : ''}`}>
              {/* Header */}
              <div className="dailycheck-card__header">
                <img src={BASE + 'crane-lwn.svg'} alt="" width={24} height={24} />
                <span className="dailycheck-card__name">{machine.name} – {machine.serialNumber}</span>
                {totalNotifs > 0 && (
                  <span className={`notif-badge notif-badge--${notifInfo.critical > 0 ? 'critical' : 'warning'}`}>
                    {totalNotifs}
                  </span>
                )}
                {positionOk && <CheckCircle size={20} className="dailycheck-card__ok-icon" />}
                {positionWarning && <AlertTriangle size={20} className="dailycheck-card__warn-icon" />}
                {positionInsufficient && <AlertTriangle size={20} className="dailycheck-card__bad-icon" />}
              </div>

              {/* Status */}
              <div className="dailycheck-row">
                <span className="dailycheck-row__label">Maschinenstatus</span>
                <span className={`dailycheck-row__value dailycheck-row__value--status ${isOnline ? 'dailycheck-row__value--online' : 'dailycheck-row__value--offline'}`}>
                  {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Aktuelle Position */}
              <div className="dailycheck-row">
                <span className="dailycheck-row__label">Aktuelle Auslegerposition</span>
                <span className="dailycheck-row__value">
                  {positionKnown ? BOOM_POSITION_LABELS[currentPos] : 'Unbekannt'}
                </span>
              </div>

              {/* Empfehlung */}
              <div className="dailycheck-row dailycheck-row--highlight">
                <span className="dailycheck-row__label">Empfohlene Position</span>
                <span className="dailycheck-row__value">
                  {BOOM_POSITION_LABELS[recommendedPos]}
                  {recThreshold !== null && (
                    <span className="dailycheck-row__sub"> ({recThreshold} m/s)</span>
                  )}
                </span>
              </div>

              {/* Prognose */}
              <div className="dailycheck-row">
                <span className="dailycheck-row__label">Windprognose bis {formatDateTime(until)}</span>
                <span className="dailycheck-row__value">
                  {maxWind > 0 ? (
                    <>
                      <strong>{maxWind.toFixed(1)} m/s</strong>
                      {peakTime && <span className="dailycheck-row__sub"> um {formatDateTime(peakTime)}</span>}
                      {buffer !== null && <span className="dailycheck-row__sub">, {buffer}% Puffer</span>}
                    </>
                  ) : (
                    <span className="dailycheck-row__sub">Keine Prognosedaten</span>
                  )}
                </span>
              </div>

              {/* Warnung wenn Prognose Empfehlung überschreitet */}
              {recThreshold !== null && maxWind >= recThreshold && (
                <div className="dailycheck-card__warning">
                  <AlertTriangle size={13} />
                  Prognose überschreitet Schwellenwert der empfohlenen Position
                </div>
              )}

              {/* Button nur für Offline-Maschinen */}
              {!isOnline && (
                <button
                  className={`lds-btn lds-btn--sm dailycheck-card__btn${positionOk ? ' dailycheck-card__btn--ok' : positionInsufficient ? ' dailycheck-card__btn--bad' : positionWarning ? ' dailycheck-card__btn--warn' : ' lds-btn--primary'}`}
                  onClick={() => setPositionSelectorMachineId(machine.id)}
                >
                  {positionOk && <CheckCircle size={14} />}
                  {(positionWarning || positionInsufficient) && <AlertTriangle size={14} />}
                  Position manuell setzen
                </button>
              )}
            </div>
          );
        })}
      </div>

      {positionSelectorMachine && (
        <PositionSelector
          currentPosition={positionSelectorMachine.position.position}
          onSelect={(pos) => {
            onUpdateMachine({
              ...positionSelectorMachine,
              position: {
                ...positionSelectorMachine.position,
                position: pos,
                manuallySet: true,
                timestamp: new Date(),
              },
            });
            setPositionSelectorMachineId(null);
          }}
          onClose={() => setPositionSelectorMachineId(null)}
        />
      )}
    </>
  );
}
