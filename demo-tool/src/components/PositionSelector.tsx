import { X } from 'lucide-react';
import type { BoomPosition } from '../data/types';
import { BOOM_POSITION_LABELS, BOOM_THRESHOLDS } from '../data/types';

const BASE = import.meta.env.BASE_URL;

interface PositionSelectorProps {
  currentPosition: BoomPosition;
  onSelect: (position: BoomPosition) => void;
  onClose: () => void;
  forecastMax?: number | null;
}

/** Minimum (least-restrictive) position whose threshold still covers the forecast. */
function recommendPosition(positions: BoomPosition[], forecastMax: number): BoomPosition | null {
  const safe = positions
    .map((p) => ({ p, t: BOOM_THRESHOLDS[p] }))
    .filter((x): x is { p: BoomPosition; t: number } => x.t !== null && x.t >= forecastMax)
    .sort((a, b) => a.t - b.t);
  if (safe.length > 0) return safe[0].p;
  // forecast exceeds every limit → the most resilient position
  const withThreshold = positions
    .map((p) => ({ p, t: BOOM_THRESHOLDS[p] }))
    .filter((x): x is { p: BoomPosition; t: number } => x.t !== null)
    .sort((a, b) => b.t - a.t);
  return withThreshold[0]?.p ?? null;
}

export function PositionSelector({ currentPosition, onSelect, onClose, forecastMax }: PositionSelectorProps) {
  const positions = Object.keys(BOOM_POSITION_LABELS) as BoomPosition[];
  const recommended = forecastMax != null ? recommendPosition(positions, forecastMax) : null;

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
          {recommended != null && forecastMax != null && (
            <p className="position-selector-hint">
              Laut Prognose (max. {forecastMax.toFixed(1)} m/s) wird mindestens die Position
              {' '}<strong>{BOOM_POSITION_LABELS[recommended]}</strong> empfohlen.
            </p>
          )}

          <div className="position-selector-list">
            {positions.map((pos) => {
              const t = BOOM_THRESHOLDS[pos];
              const isRecommended = pos === recommended;
              return (
                <button
                  key={pos}
                  className={`position-selector-item ${currentPosition === pos ? 'position-selector-item--active' : ''} ${isRecommended ? 'position-selector-item--recommended' : ''}`}
                  onClick={() => onSelect(pos)}
                >
                  <img src={`${BASE}positions/${pos}.svg`} alt="" className="position-selector-item__icon" />
                  <div className="position-selector-item__info">
                    <span className="position-selector-item__name">
                      {BOOM_POSITION_LABELS[pos]}
                    </span>
                    <span className="position-selector-item__threshold">
                      Schwellenwert: {t !== null ? `${t} m/s` : 'Nicht definiert'}
                    </span>
                  </div>
                  <div className="position-selector-item__tags">
                    {currentPosition === pos && (
                      <span className="position-selector-item__current">Aktuell</span>
                    )}
                    {isRecommended && (
                      <span className="position-selector-item__recommended">Empfohlen</span>
                    )}
                  </div>
                </button>
              );
            })}
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
