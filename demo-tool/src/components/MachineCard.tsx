import { RefreshCw, MapPin, Bell, Settings, Ban, PencilRuler, FileSearch } from 'lucide-react';
import type { MachineConfig } from '../data/types';
import { BOOM_POSITION_LABELS, BOOM_THRESHOLDS } from '../data/types';

const BASE = import.meta.env.BASE_URL;

interface MachineCardProps {
  machine: MachineConfig;
  notifCritical: number;
  notifWarning: number;
  assignedUser: string | null;
  onOpenConfig: () => void;
  onOpen: () => void;
  onOpenPositionSelector: () => void;
  onNotifClick: () => void;
}

function formatStamp(date: Date): string {
  return date.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

/* Placeholder boom-position icon — replaced by official Liebherr SVGs once provided */
function PositionIcon() {
  return (
    <img src={BASE + 'boom-angle.svg'} alt="" width={48} height={48} style={{ display: 'block' }} />
  );
}

export function MachineCard({
  machine, notifCritical, notifWarning, assignedUser,
  onOpenConfig, onOpen, onOpenPositionSelector, onNotifClick,
}: MachineCardProps) {
  const hasLicense = machine.license === 'active';
  const isOnline = machine.status === 'online';
  const totalNotif = notifCritical + notifWarning;
  const hasCritical = notifCritical > 0;

  const threshold = BOOM_THRESHOLDS[machine.position.position];
  const windNow = Math.max(machine.wind.needleBoom, machine.wind.mainBoom);
  const windExceeds = threshold !== null && windNow >= threshold;

  return (
    <div className="m-card">
      {/* Demo config (hidden-ish) */}
      <button className="m-card__demo" onClick={onOpenConfig} title="Demo-Konfiguration" aria-label="Demo-Konfiguration">
        <Settings size={14} />
      </button>

      {/* Status row */}
      <div className="m-card__status">
        <div className="m-card__status-left">
          {hasLicense ? (
            <>
              <RefreshCw size={14} className="m-card__status-icon" />
              <span>{formatStamp(machine.wind.timestamp)}</span>
            </>
          ) : (
            <>
              <Ban size={14} className="m-card__status-icon" />
              <span>Keine Lizenz</span>
            </>
          )}
        </div>
        <div className="m-card__status-right">
          {hasLicense ? (
            <>
              <span className={`m-card__dot ${isOnline ? 'm-card__dot--online' : 'm-card__dot--offline'}`} />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </>
          ) : (
            <span className="m-card__sn-right">SN: {machine.serialNumber}</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="m-card__body">
        <div className="m-card__header">
          <div className="m-card__header-left">
            <h3 className="m-card__name">{machine.name} - {machine.serialNumber}</h3>
            {hasLicense ? (
              <div className="m-card__sn">
                <img src={BASE + 'crane-lwn.svg'} alt="" width={16} height={16} />
                <span>{machine.serialNumber}</span>
              </div>
            ) : (
              <div className="m-card__sn">
                <span>Stand: {formatStamp(machine.wind.timestamp)} Uhr</span>
              </div>
            )}
            <div className="m-card__loc">
              <MapPin size={14} />
              <span>{hasLicense ? machine.location.shortAddress : '-'}</span>
            </div>
          </div>
          {hasLicense && (
            <button
              className="m-card__bell"
              onClick={totalNotif > 0 ? onNotifClick : undefined}
              aria-label="Benachrichtigungen"
              style={totalNotif > 0 ? undefined : { cursor: 'default' }}
            >
              <Bell size={22} strokeWidth={1.75} />
              {totalNotif > 0 && (
                <span className={`m-card__bell-badge ${hasCritical ? 'm-card__bell-badge--critical' : ''}`}>
                  {totalNotif}
                </span>
              )}
            </button>
          )}
        </div>

        {assignedUser && (
          <div className="m-card__assigned">
            <span>{assignedUser} hat die Aufgabe übernommen</span>
          </div>
        )}

        {/* Machine state panel */}
        <div className="m-card__state">
          <div className="m-card__state-col">
            <span className="m-card__state-label">Auslegerposition</span>
            {hasLicense ? (
              <div className="m-card__pos">
                <PositionIcon />
                <span className="m-card__pos-label">{BOOM_POSITION_LABELS[machine.position.position]}</span>
              </div>
            ) : (
              <span className="m-card__nodata">No Data</span>
            )}
          </div>

          <div className="m-card__state-divider" />

          <div className="m-card__state-col">
            <span className="m-card__state-label">Windmessung</span>
            {hasLicense ? (
              <div className="m-card__wind">
                <div className="m-card__wind-value">
                  <span className={`m-card__wind-num ${windExceeds ? 'm-card__wind-num--danger' : ''}`}>
                    {windNow.toFixed(1)}
                  </span>
                  <span className="m-card__wind-unit">m/s</span>
                </div>
                {threshold !== null && (
                  <div className="m-card__wind-max">
                    <span>max. zulässig:</span>
                    <strong>{threshold}</strong>
                    <span>m/s</span>
                  </div>
                )}
              </div>
            ) : (
              <span className="m-card__nodata">No Data</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="m-card__actions">
          {hasLicense ? (
            <>
              <button className="m-btn m-btn--primary" onClick={onOpenPositionSelector}>
                <PencilRuler size={18} />
                Position
              </button>
              <button className="m-btn m-btn--outline" onClick={onOpen}>
                <FileSearch size={18} />
                Details
              </button>
            </>
          ) : (
            <>
              <button className="m-btn m-btn--primary m-btn--wide" onClick={onOpen}>
                <FileSearch size={18} />
                Lizenz jetzt erwerben
              </button>
              <button className="m-btn m-btn--outline m-btn--icon" onClick={onOpen} aria-label="Details">
                <FileSearch size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
