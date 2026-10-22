import { RefreshCw, Ban } from 'lucide-react';
import type { MachineConfig } from '../data/types';
import { machineThreshold } from '../data/types';
import { useLang, boomLabel } from '../i18n';

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
  const { lang, t } = useLang();
  const hasLicense = machine.license === 'active';
  const isOnline = machine.status === 'online';
  const totalNotif = notifCritical + notifWarning;
  const hasCritical = notifCritical > 0;

  const threshold = machineThreshold(machine);
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
              <span>{t('Keine Lizenz', 'No licence')}</span>
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
                <span>{t(`Stand: ${formatStamp(machine.wind.timestamp)} Uhr`, `As of: ${formatStamp(machine.wind.timestamp)}`)}</span>
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
              aria-label={t('Benachrichtigungen', 'Notifications')}
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
            <span>{t(`${assignedUser} hat die Aufgabe übernommen`, `${assignedUser} took over the task`)}</span>
          </div>
        )}

        {/* Machine state panel */}
        <div className="m-card__state">
          <div className="m-card__state-col">
            <span className="m-card__state-label">{t('Auslegerposition', 'Boom position')}</span>
            {hasLicense ? (
              <div className="m-card__pos">
                <PositionIcon position={machine.position.position} />
                <span className="m-card__pos-label">{boomLabel(machine.position.position, lang)}</span>
              </div>
            ) : (
              <span className="m-card__nodata">{t('Keine Daten', 'No data')}</span>
            )}
          </div>

          <div className="m-card__state-divider" />

          <div className="m-card__state-col">
            <span className="m-card__state-label">{t('Windmessung', 'Wind measurement')}</span>
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
                    <span>{t('max. zulässig:', 'max. permissible:')}</span>
                    <strong>{threshold}</strong>
                    <span>m/s</span>
                  </div>
                )}
              </div>
            ) : (
              <span className="m-card__nodata">{t('Keine Daten', 'No data')}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="m-card__actions">
          {hasLicense ? (
            <>
              <button className="m-btn m-btn--primary" onClick={onOpenPositionSelector}>
                <img src={BASE + 'position-action.svg'} alt="" className="m-btn__icon-crane" />
                {t('Position', 'Position')}
              </button>
              <button className="m-btn m-btn--outline" onClick={onOpen}>
                <img src={BASE + 'details-doc.svg'} alt="" width={18} height={18} />
                {t('Details', 'Details')}
              </button>
            </>
          ) : (
            <>
              <button className="m-btn m-btn--primary m-btn--wide" onClick={onOpen}>
                <img src={BASE + 'license-acquire.svg'} alt="" width={18} height={18} />
                {t('Lizenz jetzt erwerben', 'Acquire licence now')}
              </button>
              <button className="m-btn m-btn--outline m-btn--icon" onClick={onOpen} aria-label={t('Details', 'Details')}>
                <img src={BASE + 'details-doc.svg'} alt="" width={18} height={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
