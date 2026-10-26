import { RefreshCw, Ban, Phone } from 'lucide-react';
import type { MachineConfig, Notification } from '../data/types';
import { machineThreshold, forecastPeakTime } from '../data/types';
import { useLang, boomLabel } from '../i18n';
import { notificationHeadline } from './NotificationCard';

const BASE = import.meta.env.BASE_URL;

interface MachineCardProps {
  machine: MachineConfig;
  notifCritical: number;
  notifWarning: number;
  assignedUser: string | null;
  onOpen: () => void;
  onOpenPositionSelector: () => void;
  onNotifClick: () => void;
  /** When set (e.g. in the check-out), the primary button shows this recommendation
   *  as its label and takes the full width; Details collapses to an icon button. */
  primaryActionLabel?: string;
  /** Override for the check-out primary button (defaults to onOpenPositionSelector). */
  onPrimaryAction?: () => void;
  /** Render the check-out primary button as a completed (grey) state. */
  primaryActionDone?: boolean;
  /** Icon for the check-out primary button: the crane (set position) or a phone (notify driver). */
  primaryActionIcon?: 'crane' | 'notify';
  /** When set (check-out), the wind panel shows this forecast peak + its time
   *  instead of the current wind measurement. */
  forecastWind?: { value: number; at: Date };
  /** Experimental: show the latest notification headline on the card. */
  lastNotif?: Notification;
  showLastNotif?: boolean;
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
  onOpen, onOpenPositionSelector, onNotifClick, primaryActionLabel, forecastWind,
  lastNotif, showLastNotif, onPrimaryAction, primaryActionDone, primaryActionIcon = 'crane',
}: MachineCardProps) {
  const { lang, t, speedNum, speedUnit, thresholdNum } = useLang();
  const hasLicense = machine.license === 'active';
  const isOnline = machine.status === 'online';
  const totalNotif = notifCritical + notifWarning;
  const hasCritical = notifCritical > 0;

  const threshold = machineThreshold(machine);
  const windNow = Math.max(machine.wind.needleBoom, machine.wind.mainBoom);
  // A current measurement only exists while the machine is active AND the wind logger is sending.
  const hasLiveWind = isOnline && machine.windloggerStatus !== 'offline' && machine.windloggerStatus !== 'fault';
  const measVal = hasLiveWind ? windNow : null;
  const fcVal = forecastWind ? forecastWind.value : machine.forecast.max72h;
  const fcAt = forecastWind ? forecastWind.at : forecastPeakTime(machine);
  const measExceeds = measVal !== null && threshold !== null && measVal >= threshold;
  const fcExceeds = threshold !== null && fcVal >= threshold;

  function formatForecastAt(d: Date): string {
    return d.toLocaleString(lang === 'en' ? 'en-GB' : 'de-DE', {
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
    }) + t(' Uhr', '');
  }

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
              <span>{isOnline ? t('Aktiv', 'Active') : t('Inaktiv', 'Inactive')}</span>
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

        {/* Experimental: latest notification headline (with a reserved spacer so
            cards without an alert still align in the desktop grid) */}
        {showLastNotif && (
          lastNotif && hasLicense ? (
            <button
              className={`m-card__lastnotif m-card__lastnotif--${lastNotif.level === 1 ? 'kritisch' : 'warnung'}`}
              onClick={onNotifClick}
              title={notificationHeadline(lastNotif, machine, { t, lang, speedNum, speedUnit })}
            >
              <img src={BASE + 'icon-bell.svg'} alt="" width={18} height={18} className="m-card__lastnotif-bell" />
              <span className="m-card__lastnotif-text">
                {notificationHeadline(lastNotif, machine, { t, lang, speedNum, speedUnit })}
              </span>
              <img src={BASE + 'icon-chevron.svg'} alt="" width={12} height={7} className="m-icon" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }} />
            </button>
          ) : (
            <div className="m-card__lastnotif-spacer" aria-hidden="true" />
          )
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
            <span className="m-card__state-label">{t('Windgeschwindigkeit', 'Wind speed')}</span>
            {hasLicense ? (
              <div className="m-card__wind">
                <div className="m-card__wind-row">
                  <span className="m-card__wind-key">{t('Messung', 'Measured')}</span>
                  <span className={`m-card__wind-rowval ${measExceeds ? 'm-card__wind-num--danger' : ''}`}>
                    {measVal !== null ? `${speedNum(measVal)} ${speedUnit}` : '—'}
                  </span>
                </div>
                <div className="m-card__wind-row">
                  <span className="m-card__wind-key">{t('Prognose', 'Forecast')}</span>
                  <span className={`m-card__wind-rowval ${fcExceeds ? 'm-card__wind-num--danger' : ''}`}>
                    {speedNum(fcVal)} {speedUnit}
                  </span>
                </div>
                {fcAt && <div className="m-card__wind-when">{formatForecastAt(fcAt)}</div>}
                {threshold !== null && (
                  <div className="m-card__wind-max">
                    <span>{t('max. zulässig:', 'max. permissible:')}</span>
                    <strong>{thresholdNum(threshold)}</strong>
                    <span>{speedUnit}</span>
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
            primaryActionLabel ? (
              <>
                <button
                  className={`m-btn ${primaryActionDone ? 'm-btn--secondary' : 'm-btn--primary'} m-btn--wide`}
                  onClick={onPrimaryAction ?? onOpenPositionSelector}
                >
                  {!primaryActionDone && (
                    primaryActionIcon === 'notify'
                      ? <Phone size={18} />
                      : <img src={BASE + 'position-action.svg'} alt="" className="m-btn__icon-crane" />
                  )}
                  {primaryActionLabel}
                </button>
                <button className="m-btn m-btn--outline m-btn--icon" onClick={onOpen} aria-label={t('Details', 'Details')}>
                  <img src={BASE + 'details-doc.svg'} alt="" width={18} height={18} />
                </button>
              </>
            ) : (
              <>
                {/* Active machines: position is known (live), so no emphasis needed → grey. */}
                <button className={`m-btn ${isOnline ? 'm-btn--secondary' : 'm-btn--primary'}`} onClick={onOpenPositionSelector}>
                  <img src={BASE + 'position-action.svg'} alt="" className="m-btn__icon-crane" />
                  {t('Position', 'Position')}
                </button>
                <button className="m-btn m-btn--outline" onClick={onOpen}>
                  <img src={BASE + 'details-doc.svg'} alt="" width={18} height={18} />
                  {t('Details', 'Details')}
                </button>
              </>
            )
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
