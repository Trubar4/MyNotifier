import { X, Ban } from 'lucide-react';
import type { BoomPosition } from '../data/types';
import { BOOM_POSITION_LABELS, BOOM_THRESHOLDS } from '../data/types';

const BASE = import.meta.env.BASE_URL;

interface PositionSelectorProps {
  currentPosition: BoomPosition;
  onSelect: (position: BoomPosition) => void;
  onClose: () => void;
  forecastMax?: number | null;
  title?: string;
  subtitle?: string;
  allowNoAction?: boolean;
  onNoAction?: () => void;
}

/** Minimum (least-restrictive) position whose threshold still covers the forecast. */
export function recommendPosition(positions: BoomPosition[], forecastMax: number): BoomPosition | null {
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

export function PositionSelector({
  currentPosition, onSelect, onClose, forecastMax,
  title = 'Auslegerposition manuell setzen', subtitle,
  allowNoAction, onNoAction,
}: PositionSelectorProps) {
  const positions = Object.keys(BOOM_POSITION_LABELS) as BoomPosition[];
  const recommended = forecastMax != null ? recommendPosition(positions, forecastMax) : null;

  return (
    <div className="config-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="config-modal">
        <div className="config-modal__header">
          <h2 className="config-modal__title">{title}</h2>
          <button className="config-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="config-modal__body">
          {forecastMax != null && (
            <div className="position-selector-forecast">
              <span className="position-selector-forecast__label">Prognose max. Windgeschwindigkeit</span>
              <span className="position-selector-forecast__value">{forecastMax.toFixed(1)} m/s</span>
            </div>
          )}
          <p style={{ font: '400 14px/20px var(--font-text)', color: 'var(--r-on-surface-muted)', margin: 0 }}>
            {subtitle ?? 'Wählen Sie die Auslegerposition. Der Windschwellenwert passt sich automatisch an.'}
          </p>
          {recommended != null && forecastMax != null && (
            <p className="position-selector-hint">
              Mindestens empfohlen: <strong>{BOOM_POSITION_LABELS[recommended]}</strong>
              {BOOM_THRESHOLDS[recommended] !== null ? ` (${BOOM_THRESHOLDS[recommended]} m/s)` : ''}
            </p>
          )}

          <div className="position-selector-list">
            {positions.map((pos) => {
              const t = BOOM_THRESHOLDS[pos];
              const isRecommended = pos === recommended;
              const inadequate = t !== null && forecastMax != null && t < forecastMax;
              return (
                <button
                  key={pos}
                  className={`position-selector-item ${currentPosition === pos ? 'position-selector-item--active' : ''} ${isRecommended ? 'position-selector-item--recommended' : ''}`}
                  onClick={() => onSelect(pos)}
                >
                  <img src={`${BASE}positions/${pos}.svg`} alt="" className={`position-selector-item__icon position-selector-item__icon--${pos}`} />
                  <div className="position-selector-item__info">
                    <span className="position-selector-item__name">
                      {BOOM_POSITION_LABELS[pos]}
                    </span>
                    <span className={`position-selector-item__threshold ${inadequate ? 'position-selector-item__threshold--bad' : ''}`}>
                      Max. {t !== null ? `${t} m/s` : 'nicht definiert'}
                      {inadequate ? ' · nicht ausreichend' : ''}
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

            {allowNoAction && (
              <button className="position-selector-item position-selector-item--noaction" onClick={() => onNoAction?.()}>
                <span className="position-selector-item__noaction-icon"><Ban size={22} /></span>
                <div className="position-selector-item__info">
                  <span className="position-selector-item__name">Kein Eingriff notwendig</span>
                  <span className="position-selector-item__threshold">Position bleibt unverändert</span>
                </div>
              </button>
            )}
          </div>
        </div>

        <div className="config-modal__footer">
          <button className="m-btn m-btn--outline m-btn--block" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
