import { RefreshCw, Ban } from 'lucide-react';
import type { MachineConfig } from '../data/types';
import { BOOM_POSITION_LABELS, BOOM_THRESHOLDS } from '../data/types';

const BASE = import.meta.env.BASE_URL;

interface MachineCardProps {
  machine: MachineConfig;
  notifCritical: number;
  notifWarning: number;
  assignedUser: string | null;
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

/* Official Liebherr boom-position icons (public/positions/<position>.svg) */
function PositionIcon({ position }: { position: MachineConfig['position']['position'] }) {
  return (
    <img
      src={`${BASE}positions/${position}.svg`}
      alt=""
      className={`m-card__pos-icon m-card__pos-icon--${position}`}
    />
  );
}

export function MachineCard({
  machine, notifCritical, notifWarning, assignedUser,
  onOpen, onOpenPositionSelector, onNotifClick,
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
              <img src={BASE + 'icon-mappin.svg'} alt="" width={13} height={14} className="m-icon" />
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
              <img src={BASE + 'icon-bell.svg'} alt="" className="m-card__bell-icon" />
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
                <PositionIcon position={machine.position.position} />
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
                <img src={BASE + 'position-action.svg'} alt="" className="m-btn__icon-crane" />
                Position
              </button>
              <button className="m-btn m-btn--outline" onClick={onOpen}>
                <img src={BASE + 'details-doc.svg'} alt="" width={18} height={18} />
                Details
              </button>
            </>
          ) : (
            <>
              <button className="m-btn m-btn--primary m-btn--wide" onClick={onOpen}>
                <img src={BASE + 'license-acquire.svg'} alt="" width={18} height={18} />
                Lizenz jetzt erwerben
              </button>
              <button className="m-btn m-btn--outline m-btn--icon" onClick={onOpen} aria-label="Details">
                <img src={BASE + 'details-doc.svg'} alt="" width={18} height={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
