import { X, Ban } from 'lucide-react';
import type { BoomPosition } from '../data/types';
import { BOOM_POSITION_LABELS, positionThreshold } from '../data/types';
import { useLang, boomLabel } from '../i18n';

const BASE = import.meta.env.BASE_URL;

interface PositionSelectorProps {
  currentPosition: BoomPosition;
  onSelect: (position: BoomPosition) => void;
  onClose: () => void;
  forecastMax?: number | null;
  forecastPeakAt?: Date | null;
  hasNeedle?: boolean;
  title?: string;
  subtitle?: string;
  allowNoAction?: boolean;
  onNoAction?: () => void;
}

/** Minimum (least-restrictive) position whose threshold still covers the forecast. */
export function recommendPosition(positions: BoomPosition[], forecastMax: number, hasNeedle = false): BoomPosition | null {
  const safe = positions
    .map((p) => ({ p, t: positionThreshold(p, hasNeedle) }))
    .filter((x): x is { p: BoomPosition; t: number } => x.t !== null && x.t >= forecastMax)
    .sort((a, b) => a.t - b.t);
  if (safe.length > 0) return safe[0].p;
  // forecast exceeds every limit → the most resilient position
  const withThreshold = positions
    .map((p) => ({ p, t: positionThreshold(p, hasNeedle) }))
    .filter((x): x is { p: BoomPosition; t: number } => x.t !== null)
    .sort((a, b) => b.t - a.t);
  return withThreshold[0]?.p ?? null;
}

export function PositionSelector({
  currentPosition, onSelect, onClose, forecastMax, forecastPeakAt, hasNeedle = false,
  title, subtitle,
  allowNoAction, onNoAction,
}: PositionSelectorProps) {
  const { lang, t } = useLang();
  const positions = Object.keys(BOOM_POSITION_LABELS) as BoomPosition[];
  const recommended = forecastMax != null ? recommendPosition(positions, forecastMax, hasNeedle) : null;
  const heading = title ?? t('Auslegerposition manuell setzen', 'Set boom position manually');

  return (
    <div className="config-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="config-modal">
        <div className="config-modal__header">
          <h2 className="config-modal__title">{heading}</h2>
          <button className="config-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="config-modal__body">
          {forecastMax != null && (
            <div className="position-selector-forecast">
              <div className="position-selector-forecast__head">
                <span className="position-selector-forecast__label">{t('Prognose max. Windgeschwindigkeit', 'Forecast max. wind speed')}</span>
                <span className="position-selector-forecast__value">{forecastMax.toFixed(1)} m/s</span>
              </div>
              {forecastPeakAt && (
                <span className="position-selector-forecast__time">
                  {t('voraussichtlich am', 'expected on')}{' '}
                  {forecastPeakAt.toLocaleString(lang === 'en' ? 'en-GB' : 'de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                  {t(' Uhr', '')}
                </span>
              )}
            </div>
          )}
          <p style={{ font: '400 14px/20px var(--font-text)', color: 'var(--r-on-surface-muted)', margin: 0 }}>
            {subtitle ?? t('Wählen Sie die Auslegerposition. Der Windschwellenwert passt sich automatisch an.', 'Choose the boom position. The wind threshold adjusts automatically.')}
          </p>
          {recommended != null && forecastMax != null && (
            <p className="position-selector-hint">
              {t('Mindestens empfohlen:', 'Minimum recommended:')} <strong>{boomLabel(recommended, lang)}</strong>
              {positionThreshold(recommended, hasNeedle) !== null ? ` (${positionThreshold(recommended, hasNeedle)} m/s)` : ''}
            </p>
          )}

          <div className="position-selector-list">
            {positions.map((pos) => {
              const thr = positionThreshold(pos, hasNeedle);
              const isRecommended = pos === recommended;
              const inadequate = thr !== null && forecastMax != null && thr < forecastMax;
              return (
                <button
                  key={pos}
                  className={`position-selector-item ${currentPosition === pos ? 'position-selector-item--active' : ''} ${isRecommended ? 'position-selector-item--recommended' : ''}`}
                  onClick={() => onSelect(pos)}
                >
                  <img src={`${BASE}positions/${pos}.svg`} alt="" className={`position-selector-item__icon position-selector-item__icon--${pos}`} />
                  <div className="position-selector-item__info">
                    <span className="position-selector-item__name">
                      {boomLabel(pos, lang)}
                    </span>
                    <span className={`position-selector-item__threshold ${inadequate ? 'position-selector-item__threshold--bad' : ''}`}>
                      {t('Max.', 'Max.')} {thr !== null ? `${thr} m/s` : t('nicht definiert', 'not defined')}
                      {inadequate ? t(' · nicht ausreichend', ' · not sufficient') : ''}
                    </span>
                  </div>
                  <div className="position-selector-item__tags">
                    {currentPosition === pos && (
                      <span className="position-selector-item__current">{t('Aktuell', 'Current')}</span>
                    )}
                    {isRecommended && (
                      <span className="position-selector-item__recommended">{t('Empfohlen', 'Recommended')}</span>
                    )}
                  </div>
                </button>
              );
            })}

            {allowNoAction && (
              <button className="position-selector-item position-selector-item--noaction" onClick={() => onNoAction?.()}>
                <span className="position-selector-item__noaction-icon"><Ban size={22} /></span>
                <div className="position-selector-item__info">
                  <span className="position-selector-item__name">{t('Kein Eingriff notwendig', 'No action needed')}</span>
                  <span className="position-selector-item__threshold">{t('Position bleibt unverändert', 'Position stays unchanged')}</span>
                </div>
              </button>
            )}
          </div>
        </div>

        <div className="config-modal__footer">
          <button className="m-btn m-btn--outline m-btn--block" onClick={onClose}>
            {t('Abbrechen', 'Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
