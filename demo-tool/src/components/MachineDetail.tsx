import { useState, useEffect } from 'react';
import { Crosshair, BellOff } from 'lucide-react';
import type {
  MachineConfig, BoomPosition, Notification, NotificationSettings, NotifyPrefs, ForecastHour,
} from '../data/types';
import { BOOM_POSITION_LABELS, machineThreshold, configHasNeedle } from '../data/types';
import { PositionSelector } from './PositionSelector';
import { NotifyPrefsControls } from './SettingsControls';

type DetailTab = 'overview' | 'machine' | 'standort' | 'settings';

interface MachineDetailProps {
  machine: MachineConfig;
  notifications: Notification[];
  notifSettings: NotificationSettings;
  onBack: () => void;
  onUpdateMachine: (updated: MachineConfig) => void;
  onUpdateNotification: (updated: Notification) => void;
  onUpdateNotifSettings: (updated: NotificationSettings) => void;
  initialPositionSelectorOpen?: boolean;
  onPositionSelectorOpened?: () => void;
}

function pad(n: number): string { return n.toString().padStart(2, '0'); }

/** dd.MM.yyyy, HH:mm */
function formatStand(date: Date): string {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** dd.MM.yyyy HH:mm:ss (machine data rows) */
function formatSec(date: Date): string {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatFull(date: Date): string {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())} Uhr`;
}

function getWindLevel(speed: number, threshold: number | null): 'safe' | 'warning' | 'danger' {
  if (threshold === null) return 'safe';
  if (speed >= threshold) return 'danger';
  if (speed >= threshold * 0.8) return 'warning';
  return 'safe';
}

/** Peak forecast speed within the next `hours` window. */
function peakWithin(hourly: ForecastHour[], from: Date, hours: number): ForecastHour | null {
  const cutoff = from.getTime() + hours * 3600_000;
  const within = hourly.filter((h) => h.timestamp.getTime() <= cutoff);
  if (within.length === 0) return null;
  return within.reduce((a, h) => (h.speed > a.speed ? h : a), within[0]);
}

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'overview', label: 'Übersicht' },
  { id: 'machine', label: 'Maschine' },
  { id: 'standort', label: 'Standort' },
  { id: 'settings', label: 'Settings' },
];

const BOOM_CONFIG_OPTIONS = [
  'mit Nadelausleger (feststehend)',
  'mit Nadelausleger (wippbar)',
  'ohne Nadelausleger',
  'Hauptausleger',
];

export function MachineDetail({
  machine, notifications, notifSettings, onUpdateMachine, onUpdateNotifSettings,
  initialPositionSelectorOpen, onPositionSelectorOpened,
}: MachineDetailProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [showPositionSelector, setShowPositionSelector] = useState(false);

  useEffect(() => {
    if (initialPositionSelectorOpen) {
      setActiveTab('settings');
      setShowPositionSelector(true);
      onPositionSelectorOpened?.();
    }
  }, [initialPositionSelectorOpen, onPositionSelectorOpened]);

  const isOnline = machine.status === 'online';
  const threshold = machineThreshold(machine);
  const windNow = Math.max(machine.wind.needleBoom, machine.wind.mainBoom);

  const peak24 = peakWithin(machine.forecast.hourly, machine.forecast.timestamp, 24);
  const peak48 = peakWithin(machine.forecast.hourly, machine.forecast.timestamp, 48);
  const peak72 = peakWithin(machine.forecast.hourly, machine.forecast.timestamp, 72);

  function handleSetPosition(pos: BoomPosition) {
    onUpdateMachine({
      ...machine,
      position: { ...machine.position, position: pos, timestamp: new Date(), manuallySet: true },
    });
    setShowPositionSelector(false);
  }

  function handleConfigChange(cfg: string) {
    onUpdateMachine({ ...machine, specs: { ...machine.specs, boomConfiguration: cfg } });
  }

  const machineEnabled = machine.id in notifSettings.machineOverrides
    ? notifSettings.machineOverrides[machine.id]
    : notifSettings.globalEnabled;

  function setMachineEnabled(enabled: boolean) {
    onUpdateNotifSettings({
      ...notifSettings,
      machineOverrides: { ...notifSettings.machineOverrides, [machine.id]: enabled },
    });
  }

  const overridePrefs: NotifyPrefs | null = notifSettings.machinePrefs[machine.id] ?? null;
  const overrideOn = overridePrefs !== null;

  function setOverrideOn(on: boolean) {
    const next = { ...notifSettings.machinePrefs };
    if (on) next[machine.id] = { ...notifSettings.prefs };
    else delete next[machine.id];
    onUpdateNotifSettings({ ...notifSettings, machinePrefs: next });
  }

  function updateOverridePrefs(prefs: NotifyPrefs) {
    onUpdateNotifSettings({
      ...notifSettings,
      machinePrefs: { ...notifSettings.machinePrefs, [machine.id]: prefs },
    });
  }

  const gps = `GPS: ${Math.abs(machine.location.lat).toFixed(4)}° ${machine.location.lat >= 0 ? 'N' : 'S'}, ${Math.abs(machine.location.lng).toFixed(4)}°`;
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${machine.location.lng - 0.008},${machine.location.lat - 0.005},${machine.location.lng + 0.008},${machine.location.lat + 0.005}&layer=mapnik`;

  return (
    <div className="mdetail">
      {/* ===== Header: name + accent, Stand · Status ===== */}
      <div className="mdetail__head">
        <h1 className="mdetail__name">{machine.name} - {machine.serialNumber}</h1>
        <span className="mdetail__accent" />
        <div className="mdetail__standrow">
          <span className="mdetail__stand">
            <strong>Stand:</strong> {formatStand(machine.wind.timestamp)} Uhr
          </span>
          <span className={`mdetail__status ${isOnline ? 'is-online' : 'is-offline'}`}>
            <span className="mdetail__status-dot" />
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* ===== Tabs ===== */}
      <div className="mdetail__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            className={`mdetail__tab ${activeTab === t.id ? 'mdetail__tab--active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mdetail__panel">
        {/* ========================= ÜBERSICHT ========================= */}
        {activeTab === 'overview' && (
          <div className="mdt-overview">
            {/* Windinformationen */}
            <section className="mdt-card">
              <div className="mdt-card__header">Windinformationen</div>
              <div className="mdt-card__body">
                <div className="windinfo__row windinfo__row--top">
                  <span className="windinfo__label">Wind aktuell:</span>
                  <span className="windinfo__value">{windNow.toFixed(1)} m/s</span>
                </div>
                <div className="windinfo__subtitle">Windspitzen je Zeitpunkt:</div>
                {[
                  { label: '24 Stunden', peak: peak24 },
                  { label: '48 Stunden', peak: peak48 },
                  { label: '72 Stunden', peak: peak72 },
                ].map(({ label, peak }) => (
                  <div className="windinfo__peak" key={label}>
                    <div className="windinfo__peak-left">
                      <span className="windinfo__peak-label">{label}</span>
                      {peak && <span className="windinfo__peak-time">{formatSec(peak.timestamp)}</span>}
                    </div>
                    <span className={`windinfo__peak-value windinfo__peak-value--${getWindLevel(peak?.speed ?? 0, threshold)}`}>
                      {(peak?.speed ?? 0).toFixed(1)} m/s
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Windgeschwindigkeit (Diagramm) */}
            <section className="mdt-card">
              <div className="mdt-card__header">Windgeschwindigkeit</div>
              <div className="mdt-card__body">
                <WindChart hourly={machine.forecast.hourly} threshold={threshold} />
              </div>
            </section>

            {/* Benachrichtigungen für diese Maschine */}
            <section className="mdetail__notifs">
              <h2 className="mdetail__notifs-title">Benachrichtigungen</h2>
              {notifications.length === 0 ? (
                <p className="mdetail__notifs-empty">Keine Benachrichtigungen für diese Maschine.</p>
              ) : (
                <div className="mdetail__notifs-list">
                  {notifications
                    .slice()
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((n) => {
                      const levelClass = n.level === 1 ? 'kritisch' : 'warnung';
                      return (
                        <div className={`notif2 notif2--${levelClass}`} key={n.id}>
                          <div className="notif2__pillrow">
                            <div className="notif2__pillleft">
                              <span className={`notif2__pill notif2__pill--${levelClass}`}>
                                {n.level === 1 ? 'Kritisch' : 'Warnung'}
                              </span>
                            </div>
                            <div className="notif2__status">
                              <span className={`m-card__dot ${isOnline ? 'm-card__dot--online' : 'm-card__dot--offline'}`} />
                              <span>{isOnline ? 'Online' : 'Offline'}</span>
                            </div>
                          </div>
                          <div className="notif2__time">
                            <img src={`${import.meta.env.BASE_URL}icon-clock.svg`} alt="" width={14} height={14} className="m-icon" />
                            <span>{formatFull(n.timestamp)}</span>
                          </div>
                          <h3 className="notif2__title">{n.title}</h3>
                          <div className="notif2__facts">
                            {threshold !== null && <span>Position akt. bis: <strong>{threshold} m/s</strong></span>}
                            <span>Prognose max.: <strong>{machine.forecast.max72h.toFixed(1)} m/s</strong></span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================= MASCHINE ========================= */}
        {activeTab === 'machine' && (
          <>
            <section className="mdt-card">
              <div className="mdt-card__header">Detailansicht</div>
              <div className="mdt-table">
                <DataRow label="Maschinenstatus" sub="Aktueller Maschinenstatus" value={isOnline ? 'Online' : 'Offline'} />
                <DataRow label="Letzter Erfassungszeitpunkt" sub="Zeitpunkt, zu dem das Datenpaket der letzten 10 Minuten geschrieben wurde" value={formatSec(machine.wind.timestamp)} />
                <DataRow label="Letzter Empfang von Maschinendaten" value={formatSec(machine.position.reportedAt ?? machine.position.timestamp)} />
                <DataRow label="Außentemperatur" sub="Aktuelle Temperatur anhand des Standorts der Maschine" value={machine.specs.outsideTemperature !== null ? `${machine.specs.outsideTemperature.toFixed(1)} °C` : '—'} />
                <DataRow label="Status der Bordnetzbatterie" sub="Aktueller Batteriestatus" value="Ok" valueOk />
                <DataRow label="Auslegerkonfiguration" sub="Letzte aufgezeichnete Auslegerkonfiguration" value={machine.specs.boomConfiguration} />
                <DataRow label="Hauptausleger" sub="Länge / Winkel" value={machine.specs.mainBoomLength !== null ? `${machine.specs.mainBoomLength} m` : '—'} />
                <DataRow label="Auslegerkopfhöhe" sub="Hauptausleger / Nadelausleger" value={`${machine.specs.boomHeadHeight !== null ? machine.specs.boomHeadHeight.toLocaleString('de-DE') + ' m' : '—'} / ${machine.specs.jibLength !== null ? machine.specs.jibLength.toLocaleString('de-DE') + ' m' : '—'}`} />
                <DataRow label="Windlogger-IMEI" sub="Aktuell gekoppelter Windlogger" value={machine.specs.windloggerImei} />
                <DataRow label="Auslegerposition" value={BOOM_POSITION_LABELS[machine.position.position]} />
                <DataRow label="Max. zulässige Windgeschwindigkeit" value={threshold !== null ? `${threshold} m/s` : '—'} last />
              </div>
            </section>

            <section className="mdt-card">
              <div className="mdt-card__header">Lizenz</div>
              <div className="mdt-card__body">
                <div className="mdt-pricinghint">
                  <span className="mdt-pricinghint__title">MyNotifier Lizenz</span>
                  <span className="mdt-pricinghint__text">
                    Inklusive Echtzeit-SMS/Push-Alarmen und 72h Windprognose für beide Ausleger.
                  </span>
                </div>
                {machine.license === 'active' ? (
                  <span className="mdt-license-active">● Lizenz aktiv</span>
                ) : (
                  <button className="m-btn m-btn--primary m-btn--block">
                    <img src={`${import.meta.env.BASE_URL}license-acquire.svg`} alt="" width={18} height={18} />
                    LIZENZ JETZT ERWERBEN
                  </button>
                )}
              </div>
            </section>
          </>
        )}

        {/* ========================= STANDORT ========================= */}
        {activeTab === 'standort' && (
          <>
            <div className="mdt-loc__addr">
              <img src={`${import.meta.env.BASE_URL}icon-home.svg`} alt="" width={18} height={18} className="mdt-loc__icon" />
              <span>{machine.location.address}</span>
            </div>
            <div className="mdt-loc__gps">
              <img src={`${import.meta.env.BASE_URL}icon-gps.svg`} alt="" width={16} height={16} />
              <span>{gps}</span>
            </div>
            <div className="mdt-loc__mapwrap">
              <iframe className="mdt-loc__map" src={mapEmbedUrl} title="Standort auf Karte" loading="lazy" />
              <img src={`${import.meta.env.BASE_URL}map-marker.svg`} alt="" className="mdt-loc__marker" />
            </div>
            <button className="m-btn m-btn--primary m-btn--block mdt-loc__btn">
              <Crosshair size={18} />
              LOGGERSTANDORT NUTZEN
            </button>
            <p className="mdt-loc__hint">
              Verwenden Sie den Standort des Loggers, wenn die Maschinenposition nicht verfügbar ist.
            </p>
          </>
        )}

        {/* ========================= SETTINGS ========================= */}
        {activeTab === 'settings' && (
          <>
            <section className="mdt-config">
              <h2 className="m-settings-group__title">Maschinen Konfiguration</h2>

              <div className="mdt-config__maxwind">
                <span className="mdt-config__maxwind-label">Maximal zulässige Windgeschwindigkeit:</span>
                <span className="mdt-config__maxwind-value">{threshold !== null ? `${threshold} m/s` : '—'}</span>
              </div>
              <p className="mdt-config__hint">Manuelle Eingaben gelten nur bis neue Maschinendaten empfangen werden</p>

              <label className="mdt-field">
                <span className="mdt-field__label">Auslegerkonfiguration</span>
                <div className="mdt-select">
                  <select value={machine.specs.boomConfiguration} onChange={(e) => handleConfigChange(e.target.value)}>
                    {[...new Set([machine.specs.boomConfiguration, ...BOOM_CONFIG_OPTIONS])].map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </label>
              {machine.position.manuallySet && (
                <p className="mdt-config__manual">ⓘ Manuell angepasst: {formatSec(machine.position.timestamp)}</p>
              )}

              <label className="mdt-field">
                <span className="mdt-field__label">Auslegerposition</span>
                <div className="mdt-select">
                  <select
                    value={machine.position.position}
                    onChange={(e) => handleSetPosition(e.target.value as BoomPosition)}
                  >
                    {(Object.keys(BOOM_POSITION_LABELS) as BoomPosition[]).map((p) => (
                      <option key={p} value={p}>{BOOM_POSITION_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
              </label>
            </section>

            <div className="mdt-override">
              <span className="mdt-override__label">Globale Einstellung überschreiben</span>
              <button
                className={`toggle-switch ${overrideOn ? 'toggle-switch--on' : ''}`}
                onClick={() => setOverrideOn(!overrideOn)}
                role="switch"
                aria-checked={overrideOn}
              >
                <span className="toggle-switch__thumb" />
              </button>
            </div>

            {overrideOn && overridePrefs && (
              <NotifyPrefsControls
                prefs={overridePrefs}
                onChange={updateOverridePrefs}
                thresholdMs={threshold}
              />
            )}

            <button
              className={`m-btn m-btn--block ${machineEnabled ? 'm-btn--danger' : 'm-btn--primary'} mdt-deactivate`}
              onClick={() => setMachineEnabled(!machineEnabled)}
            >
              <BellOff size={18} />
              {machineEnabled ? 'Benachrichtigung deaktivieren' : 'Benachrichtigung aktivieren'}
            </button>
          </>
        )}
      </div>

      {showPositionSelector && (
        <PositionSelector
          currentPosition={machine.position.position}
          onSelect={handleSetPosition}
          onClose={() => setShowPositionSelector(false)}
          forecastMax={machine.forecast.max72h}
          hasNeedle={configHasNeedle(machine.specs.boomConfiguration)}
        />
      )}
    </div>
  );
}

/* ----- machine-data table row ----- */
function DataRow({ label, sub, value, valueOk, last }: {
  label: string; sub?: string; value: string; valueOk?: boolean; last?: boolean;
}) {
  return (
    <div className={`mdt-row ${last ? 'mdt-row--last' : ''}`}>
      <div className="mdt-row__head">
        <span className="mdt-row__label">{label}</span>
        {sub && <span className="mdt-row__sub">{sub}</span>}
      </div>
      <div className="mdt-row__cell">
        <span className="mdt-row__value">{value}</span>
        {valueOk && <span className="mdt-row__ok" aria-hidden>✓</span>}
      </div>
    </div>
  );
}

/* ----- wind-speed bar chart (Übersicht) ----- */
function WindChart({ hourly, threshold }: { hourly: ForecastHour[]; threshold: number | null }) {
  if (hourly.length === 0) return null;
  const maxSpeed = Math.max(...hourly.map((h) => h.speed), threshold ?? 0, 1);
  const thresholdPct = threshold !== null ? (threshold / maxSpeed) * 100 : null;
  const warningPct = threshold !== null ? ((threshold * 0.8) / maxSpeed) * 100 : null;
  const labelHours = hourly.filter((_, i) => i % 12 === 0);
  return (
    <div className="windchart">
      <div className="windchart__plot">
        <div className="windchart__bars">
          {hourly.map((h, i) => {
            const level = getWindLevel(h.speed, threshold);
            return (
              <div
                key={i}
                className={`windchart__bar windchart__bar--${level}`}
                style={{ height: `${(h.speed / maxSpeed) * 100}%` }}
                title={`${h.timestamp.toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit' })} Uhr: ${h.speed.toFixed(1)} m/s`}
              />
            );
          })}
        </div>
        {thresholdPct !== null && (
          <div className="windchart__threshold" style={{ bottom: `${thresholdPct}%` }}>
            <span className="windchart__threshold-label">{threshold} m/s</span>
          </div>
        )}
        {warningPct !== null && (
          <div className="windchart__warning" style={{ bottom: `${warningPct}%` }} />
        )}
      </div>
      <div className="windchart__labels">
        {labelHours.map((h, i) => (
          <span key={i} className="windchart__label">
            {h.timestamp.toLocaleString('de-DE', { weekday: 'short' })} {pad(h.timestamp.getHours())}h
          </span>
        ))}
      </div>
      <div className="windchart__legend">
        <span className="windchart__legend-item windchart__legend-item--safe">Sicher</span>
        <span className="windchart__legend-item windchart__legend-item--warning">80 % Schwelle</span>
        <span className="windchart__legend-item windchart__legend-item--danger">Überschritten</span>
      </div>
    </div>
  );
}
