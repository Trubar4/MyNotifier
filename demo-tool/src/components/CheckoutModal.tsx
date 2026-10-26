import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import type { MachineConfig, Notification } from '../data/types';

const BASE = import.meta.env.BASE_URL;
import { machineThreshold } from '../data/types';
import { MachineCard } from './MachineCard';
import { InfoPopover } from './InfoPopover';
import { useLang } from '../i18n';

type WindowH = 24 | 48 | 72;

/** Why a machine shows up in the check-out. */
type CheckoutReason = 'exceedance' | 'offline' | 'forecast';

interface CheckoutModalProps {
  machines: MachineConfig[];
  getNotifInfo: (machineId: string) => { critical: number; warning: number; assignedUser: string | null };
  getLatestNotif?: (machineId: string) => Notification | undefined;
  showLastNotif?: boolean;
  onClose: () => void;
  onOpen: (id: string) => void;
  onOpenPositionSelector: (id: string) => void;
  onNotifClick: (id: string) => void;
}

/** Highest forecast hour within the window, with its timestamp. */
function forecastPeakInWindow(m: MachineConfig, hours: WindowH): { value: number; at: Date } {
  const slice = m.forecast.hourly.slice(0, hours);
  if (!slice.length) return { value: m.forecast.max72h, at: m.forecast.timestamp };
  const peak = slice.reduce((a, x) => (x.speed > a.speed ? x : a), slice[0]);
  return { value: peak.speed, at: peak.timestamp };
}

function maxForecastInWindow(m: MachineConfig, hours: WindowH): number {
  return forecastPeakInWindow(m, hours).value;
}

/** Higher of the two current sensor readings. */
function currentWind(m: MachineConfig): number {
  return Math.max(m.wind.needleBoom, m.wind.mainBoom);
}

/**
 * A licensed machine needs a check-out action when:
 *  - it is active and its CURRENT measurement already exceeds the max.
 *    permissible wind → act now ('exceedance'); always listed, window-independent; or
 *  - it is offline → the position must be confirmed manually so later
 *    notifications are based on a known position ('offline'); or
 *  - it is active and its wind forecast in the selected window exceeds the
 *    max. permissible wind → adjust pre-emptively ('forecast').
 * Unlicensed machines are not monitored and never appear.
 */
function checkoutReason(m: MachineConfig, hours: WindowH): CheckoutReason | null {
  if (m.license !== 'active') return null;
  const threshold = machineThreshold(m);
  // Active, already exceeding now → highest priority, always shown.
  if (m.status === 'online' && threshold !== null && currentWind(m) >= threshold) return 'exceedance';
  if (m.status === 'offline') return 'offline';
  if (threshold === null) return null; // no limit for the current position
  return maxForecastInWindow(m, hours) >= threshold ? 'forecast' : null;
}

export function CheckoutModal({
  machines, getNotifInfo, getLatestNotif, showLastNotif, onClose,
  onOpen, onOpenPositionSelector, onNotifClick,
}: CheckoutModalProps) {
  const { t } = useLang();
  const [windowH, setWindowH] = useState<WindowH>(24);
  const [informMachine, setInformMachine] = useState<MachineConfig | null>(null);
  const [informedIds, setInformedIds] = useState<Set<string>>(new Set());
  const list = machines
    .map((m) => ({ m, reason: checkoutReason(m, windowH) }))
    .filter((x): x is { m: MachineConfig; reason: CheckoutReason } => x.reason !== null);

  return (
    <div className="checkout-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="checkout-sheet">
        <div className="checkout-sheet__header">
          <img src={BASE + 'checkout.svg'} alt="" width={22} height={22} />
          <span className="checkout-sheet__info" onClick={(e) => e.stopPropagation()}>
            <InfoPopover>
              {t(
                'Der Check-Out listet Maschinen, bei denen vor dem Verlassen der Baustelle eine Handlung nötig ist:\n\n• Aktuelle Überschreitung: Der Messwert liegt bereits über der zulässigen Windgeschwindigkeit – sofort Position anpassen (immer gelistet, unabhängig vom Zeitfenster).\n\n• Inaktive Maschinen: Position manuell bestätigen, damit die Benachrichtigungen auf einer bekannten Position beruhen.\n\n• Aktive Maschinen, deren Windprognose im gewählten Zeitfenster über der zulässigen Windgeschwindigkeit liegt: Position rechtzeitig anpassen.\n\nMaschinen ohne Lizenz werden nicht überwacht und erscheinen nicht.',
                'Check-out lists machines that need action before you leave the site:\n\n• Current exceedance: the measured value already exceeds the permissible wind speed – adjust the position now (always listed, regardless of the time window).\n\n• Inactive machines: confirm the position manually so notifications are based on a known position.\n\n• Active machines whose wind forecast in the selected window exceeds the permissible wind speed: adjust the position in good time.\n\nMachines without a licence are not monitored and do not appear.',
              )}
            </InfoPopover>
          </span>
          <h2 className="checkout-sheet__title">{t('Check-Out durchführen', 'Perform check-out')}</h2>
          <button className="config-modal__close" onClick={onClose} aria-label={t('Schließen', 'Close')}>
            <X size={20} />
          </button>
        </div>

        <div className="checkout-sheet__tabs">
          {([24, 48, 72] as WindowH[]).map((h) => (
            <button
              key={h}
              className={`m-segment__btn ${windowH === h ? 'm-segment__btn--active' : ''}`}
              onClick={() => setWindowH(h)}
            >
              {h}H
            </button>
          ))}
        </div>

        <div className="checkout-sheet__list">
          {list.length === 0 ? (
            <div className="checkout-sheet__empty">
              <CheckCircle size={28} />
              <span>{t(`Keine Maschine benötigt im ${windowH}h-Fenster eine Handlung.`, `No machine requires action in the ${windowH}h window.`)}</span>
            </div>
          ) : (
            list.map(({ m, reason }) => {
              const info = getNotifInfo(m.id);
              // Active machines (driver on site) → notify the driver to move the boom.
              // Inactive machines (no live position) → set the position manually.
              const notifyDriver = reason === 'exceedance' || reason === 'forecast';
              const informed = informedIds.has(m.id);
              const label = notifyDriver
                ? (informed ? t('✓ Fahrer informiert', '✓ Driver notified') : t('Fahrer informieren', 'Notify driver'))
                : t('Position setzen (Inaktiv)', 'Set position (inactive)');
              return (
                <MachineCard
                  key={m.id}
                  machine={m}
                  notifCritical={info.critical}
                  notifWarning={info.warning}
                  assignedUser={info.assignedUser}
                  onOpen={() => onOpen(m.id)}
                  onOpenPositionSelector={() => onOpenPositionSelector(m.id)}
                  onNotifClick={() => onNotifClick(m.id)}
                  primaryActionLabel={label}
                  onPrimaryAction={notifyDriver ? () => setInformMachine(m) : () => onOpenPositionSelector(m.id)}
                  primaryActionDone={notifyDriver && informed}
                  forecastWind={forecastPeakInWindow(m, windowH)}
                  showLastNotif={showLastNotif}
                  lastNotif={getLatestNotif?.(m.id)}
                />
              );
            })
          )}
        </div>
      </div>

      {informMachine && (
        <div className="config-overlay" onClick={(e) => e.target === e.currentTarget && setInformMachine(null)}>
          <div className="config-modal" style={{ maxWidth: 420 }}>
            <div className="config-modal__header">
              <h2 className="config-modal__title">{t('Fahrer informieren', 'Notify driver')}</h2>
              <button className="config-modal__close" onClick={() => setInformMachine(null)} aria-label={t('Schließen', 'Close')}>
                <X size={20} />
              </button>
            </div>
            <div className="config-modal__body">
              <p style={{ margin: 0, font: '400 14px/20px var(--font-text)', color: 'var(--p-black)' }}>
                {t(
                  `Der Fahrer von ${informMachine.name} - ${informMachine.serialNumber} wird aufgefordert, den Ausleger in eine sichere Position zu bringen.`,
                  `The driver of ${informMachine.name} - ${informMachine.serialNumber} will be asked to move the boom to a safe position.`,
                )}
              </p>
              <div className="m-card__actions" style={{ marginTop: 'var(--s-4)' }}>
                <button
                  className="m-btn m-btn--primary"
                  onClick={() => {
                    setInformedIds((prev) => new Set(prev).add(informMachine.id));
                    setInformMachine(null);
                  }}
                >
                  {t('Jetzt informieren', 'Notify now')}
                </button>
                <button className="m-btn m-btn--outline" onClick={() => setInformMachine(null)}>
                  {t('Abbrechen', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
