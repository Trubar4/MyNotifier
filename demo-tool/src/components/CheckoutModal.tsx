import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import type { MachineConfig } from '../data/types';

const BASE = import.meta.env.BASE_URL;
import { BOOM_THRESHOLDS } from '../data/types';
import { MachineCard } from './MachineCard';

type WindowH = 24 | 48 | 72;

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

/** Needs action = licensed machine whose current position no longer covers the forecast in the window. */
function needsAction(m: MachineConfig, hours: WindowH): boolean {
  if (m.license !== 'active') return false;
  const threshold = BOOM_THRESHOLDS[m.position.position];
  if (threshold === null) return true; // position laid down / unknown limit
  return maxForecastInWindow(m, hours) >= threshold;
}

export function CheckoutModal({
  machines, getNotifInfo, onClose,
  onOpen, onOpenPositionSelector, onNotifClick,
}: CheckoutModalProps) {
  const [windowH, setWindowH] = useState<WindowH>(24);
  const list = machines.filter((m) => needsAction(m, windowH));

  return (
    <div className="checkout-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="checkout-sheet">
        <div className="checkout-sheet__header">
          <img src={BASE + 'checkout.svg'} alt="" width={22} height={22} />
          <h2 className="checkout-sheet__title">Check-Out durchführen</h2>
          <button className="config-modal__close" onClick={onClose} aria-label="Schließen">
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
              <span>Keine Maschine benötigt im {windowH}h-Fenster eine Handlung.</span>
            </div>
          ) : (
            list.map((m) => {
              const info = getNotifInfo(m.id);
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
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
