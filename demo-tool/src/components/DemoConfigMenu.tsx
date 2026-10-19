import { X, SlidersHorizontal } from 'lucide-react';
import type { MachineConfig } from '../data/types';

const BASE = import.meta.env.BASE_URL;

interface DemoConfigMenuProps {
  machines: MachineConfig[];
  onPick: (machineId: string) => void;
  onClose: () => void;
}

/**
 * Global entry point for the demonstrator's hidden scenario config,
 * opened from the avatar button. Lets the user pick a machine to
 * configure (status, licence, position, wind, forecast).
 */
export function DemoConfigMenu({ machines, onPick, onClose }: DemoConfigMenuProps) {
  return (
    <div className="config-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="config-modal">
        <div className="config-modal__header">
          <h2 className="config-modal__title">Konfiguration der Demo</h2>
          <button className="config-modal__close" onClick={onClose} aria-label="Schließen">
            <X size={20} />
          </button>
        </div>

        <div className="config-modal__body">
          <div className="demo-menu__hint">
            <SlidersHorizontal size={16} />
            <span>
              Setzen Sie Demo-Szenarien pro Maschine: Status, Lizenz, Auslegerposition,
              Windgeschwindigkeit und Prognose. Wählen Sie eine Maschine.
            </span>
          </div>

          <div className="demo-menu__list">
            {machines.map((m) => (
              <button key={m.id} className="demo-menu__item" onClick={() => onPick(m.id)}>
                <span className="demo-menu__item-text">
                  <span className="demo-menu__item-name">{m.name} - {m.serialNumber}</span>
                  <span className="demo-menu__item-sub">
                    {m.status === 'online' ? 'Online' : 'Offline'}
                    {' · '}
                    {m.license === 'active' ? 'Lizenz aktiv' : m.license === 'expired' ? 'Lizenz abgelaufen' : 'Keine Lizenz'}
                  </span>
                </span>
                <img src={BASE + 'icon-chevron.svg'} alt="" width={12} height={7} className="demo-menu__item-chevron" style={{ transform: 'rotate(-90deg)' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
