import {
  ArrowLeft,
  Construction,
  Wifi,
  WifiOff,
  Wind,
  CloudSun,
  MapPin,
  AlertTriangle,
  CheckCircle,
  PenLine,
} from 'lucide-react';
import type { MachineConfig, BoomPosition } from '../data/types';
import { BOOM_POSITION_LABELS, BOOM_THRESHOLDS } from '../data/types';
import { InfoPopover } from './InfoPopover';
import { PositionSelector } from './PositionSelector';
import { useState } from 'react';

interface MachineDetailProps {
  machine: MachineConfig;
  onBack: () => void;
  onUpdateMachine: (updated: MachineConfig) => void;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'jetzt';
  if (diffMin < 60) return `vor ${diffMin} Min.`;

  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isLive(date: Date): boolean {
  return Date.now() - date.getTime() < 60000;
}

function getWindLevel(speed: number, threshold: number | null): 'safe' | 'warning' | 'danger' {
  if (threshold === null) return 'safe';
  if (speed >= threshold) return 'danger';
  if (speed >= threshold * 0.8) return 'warning';
  return 'safe';
}

export function MachineDetail({ machine, onBack, onUpdateMachine }: MachineDetailProps) {
  const [showPositionSelector, setShowPositionSelector] = useState(false);

  const hasLicense = machine.license === 'active';
  const isOnline = machine.status === 'online';
  const threshold = BOOM_THRESHOLDS[machine.position.position];
  const needleLevel = getWindLevel(machine.wind.needleBoom, threshold);
  const mainLevel = getWindLevel(machine.wind.mainBoom, threshold);

  function handleSetPosition(pos: BoomPosition) {
    onUpdateMachine({
      ...machine,
      position: {
        position: pos,
        timestamp: new Date(),
        manuallySet: true,
      },
    });
    setShowPositionSelector(false);
  }

  return (
    <div className="detail">
      {/* Breadcrumb / Back */}
      <button className="detail__back" onClick={onBack}>
        <ArrowLeft size={16} />
        Zurück zur Übersicht
      </button>

      {/* Machine Header */}
      <div className="detail__header">
        <div className="detail__header-icon">
          <Construction size={32} />
        </div>
        <div className="detail__header-info">
          <h1 className="detail__title">
            {machine.name} - {machine.serialNumber}
          </h1>
          <span className="detail__title-accent" />
          <div className="detail__meta">
            <span className={`detail__status-badge ${isOnline ? 'detail__status-badge--online' : 'detail__status-badge--offline'}`}>
              <span className={`status-dot ${isOnline ? 'status-dot--online' : 'status-dot--offline'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {hasLicense ? (
              <span className="detail__license-badge detail__license-badge--active">Lizenz aktiv</span>
            ) : (
              <span className="license-badge license-badge--none">Keine Lizenz</span>
            )}
            {machine.notificationCount > 0 && (
              <span className="detail__notification-count">
                {machine.notificationCount} {machine.notificationCount === 1 ? 'Benachrichtigung' : 'Benachrichtigungen'}
              </span>
            )}
          </div>
        </div>
      </div>

      {!hasLicense ? (
        <div className="detail__no-license">
          <AlertTriangle size={24} />
          <div>
            <strong>Keine aktive Lizenz</strong>
            <p>Für diese Maschine ist keine MyNotifier WIND Lizenz aktiv. Kontaktieren Sie Ihren Liebherr Ansprechpartner.</p>
          </div>
        </div>
      ) : (
        <div className="detail__grid">
          {/* Wind Section */}
          <div className="detail__section detail__section--wind">
            <div className="detail__section-header">
              <Wind size={18} />
              <h2 className="detail__section-title">Aktuelle Windgeschwindigkeit</h2>
              <InfoPopover>
                Die Windgeschwindigkeit wird am Nadelausleger und Hauptausleger gemessen. Die Schwellenwerte hängen von der aktuellen Auslegerposition ab.
              </InfoPopover>
            </div>
            {!isLive(machine.wind.timestamp) ? (
              <span className="detail__freshness detail__freshness--stale">
                Wert von {formatTimestamp(machine.wind.timestamp)}
              </span>
            ) : (
              <span className="detail__freshness detail__freshness--live">Live</span>
            )}

            <div className="wind-detail-grid">
              {/* Nadelausleger */}
              <div className="wind-detail-card">
                <span className="wind-detail-card__label">Nadelausleger</span>
                <span className={`wind-detail-card__value wind-detail-card__value--${needleLevel}`}>
                  {machine.wind.needleBoom.toFixed(1)}
                  <span className="wind-detail-card__unit">m/s</span>
                </span>
                {threshold !== null && (
                  <div className="wind-threshold">
                    <div className="wind-threshold__bar">
                      <div
                        className={`wind-threshold__fill wind-threshold__fill--${needleLevel}`}
                        style={{ width: `${Math.min((machine.wind.needleBoom / threshold) * 100, 100)}%` }}
                      />
                      <div className="wind-threshold__marker" style={{ left: '80%' }} />
                      <div className="wind-threshold__marker wind-threshold__marker--limit" style={{ left: '100%' }} />
                    </div>
                    <div className="wind-threshold__labels">
                      <span>0</span>
                      <span className="wind-threshold__warn-label">{(threshold * 0.8).toFixed(0)}</span>
                      <span className="wind-threshold__limit-label">{threshold} m/s</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Hauptausleger */}
              <div className="wind-detail-card">
                <span className="wind-detail-card__label">Hauptausleger</span>
                <span className={`wind-detail-card__value wind-detail-card__value--${mainLevel}`}>
                  {machine.wind.mainBoom.toFixed(1)}
                  <span className="wind-detail-card__unit">m/s</span>
                </span>
                {threshold !== null && (
                  <div className="wind-threshold">
                    <div className="wind-threshold__bar">
                      <div
                        className={`wind-threshold__fill wind-threshold__fill--${mainLevel}`}
                        style={{ width: `${Math.min((machine.wind.mainBoom / threshold) * 100, 100)}%` }}
                      />
                      <div className="wind-threshold__marker" style={{ left: '80%' }} />
                      <div className="wind-threshold__marker wind-threshold__marker--limit" style={{ left: '100%' }} />
                    </div>
                    <div className="wind-threshold__labels">
                      <span>0</span>
                      <span className="wind-threshold__warn-label">{(threshold * 0.8).toFixed(0)}</span>
                      <span className="wind-threshold__limit-label">{threshold} m/s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {threshold !== null && (
              <div className="wind-threshold-info">
                <div className={`wind-threshold-status wind-threshold-status--${needleLevel === 'danger' || mainLevel === 'danger' ? 'danger' : needleLevel === 'warning' || mainLevel === 'warning' ? 'warning' : 'safe'}`}>
                  {needleLevel === 'danger' || mainLevel === 'danger' ? (
                    <>
                      <AlertTriangle size={16} />
                      <span>Windgeschwindigkeit überschreitet den Schwellenwert für die aktuelle Auslegerposition ({BOOM_POSITION_LABELS[machine.position.position]}: {threshold} m/s)</span>
                    </>
                  ) : needleLevel === 'warning' || mainLevel === 'warning' ? (
                    <>
                      <AlertTriangle size={16} />
                      <span>Windgeschwindigkeit nähert sich dem Schwellenwert ({BOOM_POSITION_LABELS[machine.position.position]}: {threshold} m/s)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Windgeschwindigkeit im sicheren Bereich ({BOOM_POSITION_LABELS[machine.position.position]}: Schwellenwert {threshold} m/s)</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Position Section */}
          <div className="detail__section detail__section--position">
            <div className="detail__section-header">
              <MapPin size={18} />
              <h2 className="detail__section-title">Auslegerposition</h2>
            </div>

            <div className="position-detail">
              <span className="position-detail__value">
                {BOOM_POSITION_LABELS[machine.position.position]}
              </span>
              {machine.position.manuallySet && (
                <span className="position-detail__manual">
                  Manuell gesetzt am {formatTimestamp(machine.position.timestamp)}
                </span>
              )}
              {!isOnline && !machine.position.manuallySet && (
                <span className="position-detail__stale">
                  Wert von {formatTimestamp(machine.position.timestamp)}
                </span>
              )}

              {threshold !== null && (
                <div className="position-detail__threshold">
                  <span className="position-detail__threshold-label">Windschwellenwert:</span>
                  <span className="position-detail__threshold-value">{threshold} m/s</span>
                </div>
              )}

              <div className="position-detail__positions">
                <span className="position-detail__positions-title">Alle Positionen & Schwellenwerte:</span>
                {(Object.keys(BOOM_POSITION_LABELS) as BoomPosition[]).map((pos) => (
                  <div
                    key={pos}
                    className={`position-row ${machine.position.position === pos ? 'position-row--active' : ''}`}
                  >
                    <span className="position-row__name">{BOOM_POSITION_LABELS[pos]}</span>
                    <span className="position-row__threshold">
                      {BOOM_THRESHOLDS[pos] !== null ? `${BOOM_THRESHOLDS[pos]} m/s` : '—'}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="position-detail__set-btn"
                onClick={() => setShowPositionSelector(true)}
              >
                <PenLine size={14} />
                Position manuell setzen
              </button>
            </div>
          </div>

          {/* Forecast Section */}
          <div className="detail__section detail__section--forecast">
            <div className="detail__section-header">
              <CloudSun size={18} />
              <h2 className="detail__section-title">Vorhersage 72h</h2>
              <InfoPopover>
                Die Vorhersagen stammen von Meteomatics aufgrund der Höhe der Auslegerposition des Maschinenstandorts.
              </InfoPopover>
            </div>
            <span className="detail__freshness detail__freshness--stale">
              Vorhersage von {formatTimestamp(machine.forecast.timestamp)}
            </span>

            <div className="forecast-detail">
              <div className="forecast-detail__max">
                <span className="forecast-detail__max-label">Maximale Windgeschwindigkeit (72h)</span>
                <span className={`forecast-detail__max-value forecast-detail__max-value--${getWindLevel(machine.forecast.max72h, threshold)}`}>
                  {machine.forecast.max72h.toFixed(1)}
                  <span className="forecast-detail__max-unit">m/s</span>
                </span>
              </div>

              {threshold !== null && (
                <div className="forecast-threshold-bar">
                  <div className="forecast-threshold-bar__track">
                    <div
                      className={`forecast-threshold-bar__fill forecast-threshold-bar__fill--${getWindLevel(machine.forecast.max72h, threshold)}`}
                      style={{ width: `${Math.min((machine.forecast.max72h / threshold) * 100, 100)}%` }}
                    />
                    <div className="forecast-threshold-bar__limit" style={{ left: '100%' }} />
                  </div>
                  <div className="forecast-threshold-bar__label">
                    Schwellenwert: {threshold} m/s
                  </div>
                </div>
              )}

              {machine.forecast.max72h > (threshold ?? Infinity) && (
                <div className="forecast-warning">
                  <AlertTriangle size={14} />
                  <span>
                    Die vorhergesagte Windgeschwindigkeit überschreitet den aktuellen Schwellenwert.
                    Überprüfen Sie die Auslegerposition und planen Sie gegebenenfalls Maßnahmen.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Machine Status Section */}
          <div className="detail__section detail__section--status">
            <div className="detail__section-header">
              {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
              <h2 className="detail__section-title">Maschinenstatus</h2>
              <InfoPopover>
                <div>
                  <strong>Online</strong> = Master ein + Datenverbindung<br />
                  <strong>Offline</strong> = Master aus UND/ODER keine Datenverbindung
                </div>
              </InfoPopover>
            </div>

            <div className="status-detail">
              <div className="status-detail__indicator">
                <span className={`status-dot ${isOnline ? 'status-dot--online' : 'status-dot--offline'}`} style={{ width: 12, height: 12 }} />
                <span className="status-detail__text">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              {!isOnline && (
                <span className="status-detail__since">
                  Seit {formatTimestamp(machine.wind.timestamp)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {showPositionSelector && (
        <PositionSelector
          currentPosition={machine.position.position}
          onSelect={handleSetPosition}
          onClose={() => setShowPositionSelector(false)}
        />
      )}
    </div>
  );
}
