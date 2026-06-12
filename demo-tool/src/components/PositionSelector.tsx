import { X, MapPin } from 'lucide-react';
import type { BoomPosition } from '../data/types';
import { BOOM_POSITION_LABELS, BOOM_THRESHOLDS } from '../data/types';

interface PositionSelectorProps {
  currentPosition: BoomPosition;
  onSelect: (position: BoomPosition) => void;
  onClose: () => void;
}

export function PositionSelector({ currentPosition, onSelect, onClose }: PositionSelectorProps) {
  const positions = Object.keys(BOOM_POSITION_LABELS) as BoomPosition[];

  return (
    <div className="config-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="config-modal">
        <div className="config-modal__header">
          <h2 className="config-modal__title">
            Auslegerposition manuell setzen
          </h2>
          <button className="config-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="config-modal__body">
          <p style={{ font: '400 14px/20px var(--font-text)', color: 'var(--r-on-surface-muted)', margin: 0 }}>
            Wählen Sie die aktuelle Auslegerposition. Der Windschwellenwert passt sich automatisch an.
          </p>

          <div className="position-selector-list">
            {positions.filter(p => p !== 'unknown').map((pos) => (
              <button
                key={pos}
                className={`position-selector-item ${currentPosition === pos ? 'position-selector-item--active' : ''}`}
                onClick={() => onSelect(pos)}
              >
                <MapPin size={16} className="position-selector-item__icon" />
                <div className="position-selector-item__info">
                  <span className="position-selector-item__name">
                    {BOOM_POSITION_LABELS[pos]}
                  </span>
                  <span className="position-selector-item__threshold">
                    Schwellenwert: {BOOM_THRESHOLDS[pos] !== null ? `${BOOM_THRESHOLDS[pos]} m/s` : 'Nicht definiert'}
                  </span>
                </div>
                {currentPosition === pos && (
                  <span className="position-selector-item__current">Aktuell</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="config-modal__footer">
          <button className="lds-btn lds-btn--ghost" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
