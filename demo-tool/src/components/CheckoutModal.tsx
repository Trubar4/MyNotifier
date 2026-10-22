import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import type { MachineConfig } from '../data/types';

const BASE = import.meta.env.BASE_URL;
import { machineThreshold } from '../data/types';
import { MachineCard } from './MachineCard';
import { InfoPopover } from './InfoPopover';
import { useLang } from '../i18n';

type WindowH = 24 | 48 | 72;

/** Why a machine shows up in the check-out. */
type CheckoutReason = 'offline' | 'forecast';

interface CheckoutModalProps {
  machines: MachineConfig[];
  getNotifInfo: (machineId: string) => { critical: number; warning: number; assignedUser: string | null };
  onClose: () => void;
  onOpen: (id: string) => void;
  onOpenPositionSelector: (id: string) => void;
  onNotifClick: (id: string) => void;
}

function maxForecastInWindow(m: MachineConfig, hours: WindowH): number {
  const slice = m.forecast.hourly.slice(0, hours);
  return slice.length ? Math.max(...slice.map((h) => h.speed)) : m.forecast.max72h;
}

/**
 * A licensed machine needs a check-out action when either:
 *  - it is offline → the position must be confirmed manually so later
 *    notifications are based on a known position ('offline'); or
 *  - it is online but its wind forecast in the selected window exceeds the
 *    max. permissible wind for its current position → the position should be
 *    adjusted pre-emptively ('forecast').
 * Unlicensed machines are not monitored and never appear.
 */
function checkoutReason(m: MachineConfig, hours: WindowH): CheckoutReason | null {
  if (m.license !== 'active') return null;
  if (m.status === 'offline') return 'offline';
  const threshold = machineThreshold(m);
  if (threshold === null) return null; // no limit for the current position
  return maxForecastInWindow(m, hours) >= threshold ? 'forecast' : null;
}

export function CheckoutModal({
  machines, getNotifInfo, onClose,
  onOpen, onOpenPositionSelector, onNotifClick,
}: CheckoutModalProps) {
  const { t } = useLang();
  const [windowH, setWindowH] = useState<WindowH>(24);
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
                'Der Check-Out listet Maschinen, bei denen vor dem Verlassen der Baustelle eine Handlung nötig ist:\n\n• Offline-Maschinen: Position manuell bestätigen, damit die Benachrichtigungen auf einer bekannten Position beruhen.\n\n• Online-Maschinen, deren Windprognose im gewählten Zeitfenster über der für die aktuelle Auslegerposition zulässigen Windgeschwindigkeit liegt: Position rechtzeitig anpassen.\n\nMaschinen ohne Lizenz werden nicht überwacht und erscheinen nicht.',
                'Check-out lists machines that need action before you leave the site:\n\n• Offline machines: confirm the position manually so notifications are based on a known position.\n\n• Online machines whose wind forecast in the selected window exceeds the max. permissible wind for the current boom position: adjust the position in good time.\n\nMachines without a licence are not monitored and do not appear.',
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
              const label = reason === 'offline'
                ? t('Position überprüfen (Offline)', 'Check position (offline)')
                : t('Position anpassen (Prognose)', 'Adjust position (forecast)');
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
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
