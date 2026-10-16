import { useState } from 'react';
import { X } from 'lucide-react';
import type { BoomPosition, MachineConfig } from '../data/types';
import { BOOM_POSITION_LABELS } from '../data/types';

interface ManuellAnpassenModalProps {
  machine: MachineConfig;
  onConfirm: (position: BoomPosition | null) => void; // null = kein Eingriff notwendig
  onClose: () => void;
}

export function ManuellAnpassenModal({ machine, onConfirm, onClose }: ManuellAnpassenModalProps) {
  const [position, setPosition] = useState<BoomPosition>(machine.position.position);
  const [noAction, setNoAction] = useState(false);
  const positions = Object.keys(BOOM_POSITION_LABELS) as BoomPosition[];

  return (
    <div className="config-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="config-modal manuell-modal">
        <div className="manuell-modal__header">
          <h2 className="config-modal__title">Manuell anpassen</h2>
          <button className="config-modal__close" onClick={onClose} aria-label="Schließen">
            <X size={20} />
          </button>
        </div>

        <div className="manuell-modal__body">
          <label className="manuell-modal__label">
            Auslegerposition für {machine.name} - {machine.serialNumber}
          </label>
          <select
            className="rep-select"
            value={position}
            onChange={(e) => setPosition(e.target.value as BoomPosition)}
            disabled={noAction}
          >
            {positions.map((p) => (
              <option key={p} value={p}>{BOOM_POSITION_LABELS[p]}</option>
            ))}
          </select>

          <label className="manuell-modal__check">
            <input
              type="checkbox"
              checked={noAction}
              onChange={(e) => setNoAction(e.target.checked)}
            />
            <span>Kein Eingriff notwendig</span>
          </label>
        </div>

        <div className="manuell-modal__footer">
          <button
            className="m-btn m-btn--primary m-btn--block"
            onClick={() => onConfirm(noAction ? null : position)}
          >
            Position festlegen
          </button>
          <button className="m-btn m-btn--outline m-btn--block" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
