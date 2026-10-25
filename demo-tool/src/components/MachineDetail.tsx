import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Crosshair, BellOff } from 'lucide-react';
import type {
  MachineConfig, BoomPosition, Notification, NotificationSettings, NotifyPrefs, ForecastHour,
} from '../data/types';
import { BOOM_POSITION_LABELS, machineThreshold, configHasNeedle, forecastPeakTime, DEMO_USER } from '../data/types';
import { useLang, boomLabel, configLabel } from '../i18n';
import { PositionSelector } from './PositionSelector';
import { NotifyPrefsControls } from './SettingsControls';
import { NotificationCard } from './NotificationCard';
import { AssignModal } from './AssignModal';
import { InfoPopover } from './InfoPopover';

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

const TABS: { id: DetailTab; de: string; en: string }[] = [
  { id: 'overview', de: 'Übersicht', en: 'Overview' },
  { id: 'machine', de: 'Maschine', en: 'Machine' },
  { id: 'standort', de: 'Standort', en: 'Location' },
  { id: 'settings', de: 'Settings', en: 'Settings' },
];

const BOOM_CONFIG_OPTIONS = [
  'mit Nadelausleger (feststehend)',
  'mit Nadelausleger (wippbar)',
  'ohne Nadelausleger',
  'Hauptausleger',
];

export function MachineDetail({
  machine, notifications, notifSettings, onUpdateMachine, onUpdateNotification, onUpdateNotifSettings,
  initialPositionSelectorOpen, onPositionSelectorOpened,
}: MachineDetailProps) {
  const { lang, t, fmtSpeed, fmtThreshold, fmtTemp, fmtLen } = useLang();
  const loc = lang === 'en' ? 'en-US' : 'de-DE';
  const fmt2 = (v: number) => v.toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const wlOffline = machine.windloggerStatus === 'offline';
  const wlFault = machine.windloggerStatus === 'fault';
  const fcStale = machine.forecastStatus === 'unavailable';
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [showPositionSelector, setShowPositionSelector] = useState(false);
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null);
  const [assigningNotif, setAssigningNotif] = useState<Notification | null>(null);
  const [anpassenNotif, setAnpassenNotif] = useState<Notification | null>(null);

  function handleNotifAssignConfirm(comment: string) {
    if (!assigningNotif) return;
    onUpdateNotification({ ...assigningNotif, assignedTo: DEMO_USER, assignedAt: new Date(), assignedComment: comment || null });
    setExpandedNotifId(assigningNotif.id);
    setAssigningNotif(null);
  }

  function handleNotifAnpassenConfirm(pos: BoomPosition | null) {
    if (!anpassenNotif) return;
    if (pos) {
      onUpdateMachine({
        ...machine,
        position: { ...machine.position, position: pos, timestamp: new Date(), manuallySet: true },
      });
    }
    onUpdateNotification({ ...anpassenNotif, read: true });
    setAnpassenNotif(null);
  }

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

  // Per-machine prefs: start from the global defaults; any change writes a
  // machine-specific override for this one machine.
  const machinePrefs: NotifyPrefs = notifSettings.machinePrefs[machine.id] ?? notifSettings.prefs;

  function updateMachinePrefs(prefs: NotifyPrefs) {
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
            <strong>{t('Stand:', 'As of:')}</strong> {formatStand(machine.wind.timestamp)}{t(' Uhr', '')}
          </span>
          <span className={`mdetail__status ${isOnline ? 'is-online' : 'is-offline'}`}>
            <span className="mdetail__status-dot" />
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* ===== Tabs ===== */}
      <div className="mdetail__tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`mdetail__tab ${activeTab === tab.id ? 'mdetail__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {t(tab.de, tab.en)}
          </button>
        ))}
      </div>

      <div className="mdetail__panel">
        {/* ========================= ÜBERSICHT ========================= */}
        {activeTab === 'overview' && (
          <div className="mdt-overview">
            {/* Windinformationen */}
            <section className="mdt-card">
              <div className="mdt-card__header">{t('Windinformationen', 'Wind information')}</div>
              <div className="mdt-card__body">
                <div className="windinfo__row windinfo__row--top">
                  <div className="windinfo__peak-left">
                    <span className="windinfo__label">{t('Wind aktuell:', 'Current wind:')}</span>
                    <span className="windinfo__peak-time">{formatSec(machine.wind.timestamp)}</span>
                  </div>
                  <span className="windinfo__value">{fmtSpeed(windNow)}</span>
                </div>
                <div className="windinfo__subtitle">{t('Windspitzen je Zeitpunkt:', 'Wind peaks by time:')}</div>
                {[
                  { label: t('24 Stunden', '24 hours'), peak: peak24 },
                  { label: t('48 Stunden', '48 hours'), peak: peak48 },
                  { label: t('72 Stunden', '72 hours'), peak: peak72 },
                ].map(({ label, peak }) => (
                  <div className="windinfo__peak" key={label}>
                    <div className="windinfo__peak-left">
                      <span className="windinfo__peak-label">{label}</span>
                      {peak && <span className="windinfo__peak-time">{formatSec(peak.timestamp)}</span>}
                    </div>
                    <span className={`windinfo__peak-value windinfo__peak-value--${getWindLevel(peak?.speed ?? 0, threshold)}`}>
                      {fmtSpeed(peak?.speed ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Windgeschwindigkeit (Diagramm) */}
            <section className="mdt-card">
              <div className="mdt-card__header">{t('Windgeschwindigkeit Prognose', 'Wind speed forecast')}</div>
              <div className="mdt-card__body">
                <WindChart hourly={machine.forecast.hourly} threshold={threshold} />
              </div>
            </section>

            {/* Benachrichtigungen für diese Maschine */}
            <section className="mdetail__notifs">
              <h2 className="mdetail__notifs-title">{t('Benachrichtigungen', 'Notifications')}</h2>
              {notifications.length === 0 ? (
                <p className="mdetail__notifs-empty">{t('Keine Benachrichtigungen für diese Maschine.', 'No notifications for this machine.')}</p>
              ) : (
                <div className="mdetail__notifs-list">
                  {notifications
                    .slice()
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((n) => (
                      <NotificationCard
                        key={n.id}
                        n={n}
                        machine={machine}
                        showMachineName={false}
                        expanded={expandedNotifId === n.id}
                        onToggle={() => setExpandedNotifId(expandedNotifId === n.id ? null : n.id)}
                        onAssign={(x) => setAssigningNotif(x)}
                        onDone={(x) => onUpdateNotification({ ...x, read: true })}
                        onAdjust={(x) => setAnpassenNotif(x)}
                        onRelease={(x) => onUpdateNotification({ ...x, assignedTo: null, assignedAt: null, assignedComment: null })}
                        onReopen={(x) => onUpdateNotification({ ...x, read: false })}
                      />
                    ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================= MASCHINE ========================= */}
        {activeTab === 'machine' && (
          <>
            <section className="mdt-card">
              <div className="mdt-card__header">{t('Detailansicht', 'Details')}</div>
              <div className="mdt-table">
                <DataRow label={t('Maschinenstatus', 'Machine status')} sub={t('Aktueller Maschinenstatus', 'Current machine status')} value={isOnline ? 'Online' : 'Offline'} />
                <DataRow
                  label={t('Letzte Übertragung Maschine', 'Last machine transmission')}
                  sub={t('Zeitpunkt des letzten Empfangs von Maschinendaten', 'Time of the last receipt of machine data')}
                  value={formatSec(machine.position.reportedAt ?? machine.position.timestamp)}
                  info={t(
                    'Die Maschine überträgt keine Daten, wenn die Zündung aus ist. Nur der Windlogger ist trotzdem online.',
                    'The machine transmits no data while the ignition is off. Only the wind logger stays online.',
                  )}
                />
                <DataRow label={t('Auslegerposition', 'Boom position')} value={boomLabel(machine.position.position, lang)} />
                <DataRow label={t('Max. zulässige Windgeschwindigkeit', 'Max. permissible wind speed')} value={threshold !== null ? fmtThreshold(threshold) : '—'} />
                <DataRow label={t('Letzte Übertragung Prognose', 'Last forecast transmission')} sub={t('Zeitpunkt des letzten Prognose-Updates', 'Time of the last forecast update')} value={formatSec(machine.forecast.timestamp)} danger={fcStale} badge={fcStale ? t('Nicht mehr aktuell', 'Out of date') : undefined} />
                <DataRow label={t('Außentemperatur', 'Outside temperature')} sub={t('Aktuelle Temperatur anhand des Standorts der Maschine', 'Current temperature based on the machine location')} value={machine.specs.outsideTemperature !== null ? fmtTemp(machine.specs.outsideTemperature) : '—'} />
                <DataRow label={t('Status der Bordnetzbatterie', 'Auxiliary battery status')} sub={t('Aktueller Batteriestatus', 'Current battery status')} value="Ok" valueOk />
                <DataRow label={t('Auslegerkonfiguration', 'Boom configuration')} sub={t('Letzte aufgezeichnete Auslegerkonfiguration', 'Last recorded boom configuration')} value={configLabel(machine.specs.boomConfiguration, lang)} />
                <DataRow label={t('Hauptausleger', 'Main boom')} sub={t('Länge / Winkel', 'Length / angle')} value={machine.specs.mainBoomLength !== null ? `${fmtLen(machine.specs.mainBoomLength)} / ${fmt2(machine.specs.mainBoomAngle ?? 0)}°` : '—'} />
                {configHasNeedle(machine.specs.boomConfiguration) && (
                  <DataRow label={t('Nadelausleger', 'Jib')} sub={t('Länge / Winkel', 'Length / angle')} value={machine.specs.jibLength !== null ? `${fmtLen(machine.specs.jibLength)} / ${fmt2(machine.specs.jibAngle ?? 0)}°` : '—'} />
                )}
                <DataRow label={t('Auslegerkopfhöhe', 'Boom head height')} sub={t('Hauptausleger / Nadelausleger', 'Main boom / jib')} value={`${machine.specs.boomHeadHeight !== null ? fmtLen(machine.specs.boomHeadHeight, 2) : '—'} / ${machine.specs.jibHeadHeight !== null ? fmtLen(machine.specs.jibHeadHeight, 2) : '—'}`} />
                <DataRow
                  label={t('Windlogger-IMEI', 'Wind logger IMEI')}
                  sub={t('Aktuell gekoppelter Windlogger', 'Currently paired wind logger')}
                  value={machine.specs.windloggerImei}
                  danger={wlFault}
                  badge={wlFault ? t('Sensor defekt', 'Sensor faulty') : undefined}
                  info={t(
                    'Der Windlogger befindet sich am Hauptauslegerkopf und überträgt die vom Windsensor / von den Windsensoren gemessenen Windgeschwindigkeiten, solange der Batteriehauptschalter EIN ist.',
                    'The wind logger is located at the main boom head and transmits the wind speeds measured by the wind sensor(s) as long as the main battery switch is ON.',
                  )}
                />
                <DataRow label={t('Letzte Übertragung Windlogger', 'Last wind-logger transmission')} sub={t('Zeitpunkt der letzten vom Windlogger übertragenen Messung', "Time of the wind logger's last transmitted measurement")} value={formatSec(machine.wind.timestamp)} danger={wlOffline} badge={wlOffline ? t('Offline', 'Offline') : undefined} last />
              </div>
            </section>

            <section className="mdt-card">
              <div className="mdt-card__header">{t('Lizenz', 'Licence')}</div>
              <div className="mdt-card__body">
                <div className="mdt-pricinghint">
                  <span className="mdt-pricinghint__title">{t('MyNotifier Lizenz', 'MyNotifier licence')}</span>
                  <span className="mdt-pricinghint__text">
                    {t('Inklusive Echtzeit-SMS/Push-Alarmen und 72h Windprognose für beide Ausleger.', 'Includes real-time SMS/push alerts and a 72 h wind forecast for both booms.')}
                  </span>
                </div>
                {machine.license === 'active' ? (
                  <span className="mdt-license-active">● {t('Lizenz aktiv', 'Licence active')}</span>
                ) : (
                  <button className="m-btn m-btn--primary m-btn--block">
                    <img src={`${import.meta.env.BASE_URL}license-acquire.svg`} alt="" width={18} height={18} />
                    {t('LIZENZ JETZT ERWERBEN', 'ACQUIRE LICENCE NOW')}
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
              <iframe className="mdt-loc__map" src={mapEmbedUrl} title={t('Standort auf Karte', 'Location on map')} loading="lazy" />
              <img src={`${import.meta.env.BASE_URL}map-marker.svg`} alt="" className="mdt-loc__marker" />
            </div>
            <button className="m-btn m-btn--primary m-btn--block mdt-loc__btn">
              <Crosshair size={18} />
              {t('LOGGERSTANDORT NUTZEN', 'USE LOGGER LOCATION')}
            </button>
            <p className="mdt-loc__hint">
              {t('Verwenden Sie den Standort des Loggers, wenn die Maschinenposition nicht verfügbar ist.', 'Use the logger location when the machine position is not available.')}
            </p>
          </>
        )}

        {/* ========================= SETTINGS ========================= */}
        {activeTab === 'settings' && (
          <>
            <section className="mdt-config">
              <h2 className="m-settings-group__title">{t('Maschinen Konfiguration', 'Machine configuration')}</h2>

              <div className="mdt-config__maxwind">
                <span className="mdt-config__maxwind-label">{t('Maximal zulässige Windgeschwindigkeit:', 'Max. permissible wind speed:')}</span>
                <span className="mdt-config__maxwind-value">{threshold !== null ? fmtThreshold(threshold) : '—'}</span>
              </div>
              <p className="mdt-config__hint">{t('Manuelle Eingaben gelten nur bis neue Maschinendaten empfangen werden', 'Manual entries apply only until new machine data is received')}</p>

              <label className="mdt-field">
                <span className="mdt-field__label">{t('Auslegerkonfiguration', 'Boom configuration')}</span>
                <div className="mdt-select">
                  <select value={machine.specs.boomConfiguration} onChange={(e) => handleConfigChange(e.target.value)}>
                    {[...new Set([machine.specs.boomConfiguration, ...BOOM_CONFIG_OPTIONS])].map((o) => (
                      <option key={o} value={o}>{configLabel(o, lang)}</option>
                    ))}
                  </select>
                </div>
              </label>
              {machine.position.manuallySet && (
                <p className="mdt-config__manual">ⓘ {t('Manuell angepasst:', 'Manually adjusted:')} {formatSec(machine.position.timestamp)}</p>
              )}

              <label className="mdt-field">
                <span className="mdt-field__label">{t('Auslegerposition', 'Boom position')}</span>
                <div className="mdt-select">
                  <select
                    value={machine.position.position}
                    onChange={(e) => handleSetPosition(e.target.value as BoomPosition)}
                  >
                    {(Object.keys(BOOM_POSITION_LABELS) as BoomPosition[]).map((p) => (
                      <option key={p} value={p}>{boomLabel(p, lang)}</option>
                    ))}
                  </select>
                </div>
              </label>
            </section>

            <NotifyPrefsControls
              prefs={machinePrefs}
              onChange={updateMachinePrefs}
              thresholdMs={threshold}
            />

            <button
              className={`m-btn m-btn--block ${machineEnabled ? 'm-btn--danger' : 'm-btn--primary'} mdt-deactivate`}
              onClick={() => setMachineEnabled(!machineEnabled)}
            >
              <BellOff size={18} />
              {machineEnabled ? t('Benachrichtigung deaktivieren', 'Disable notifications') : t('Benachrichtigung aktivieren', 'Enable notifications')}
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
          forecastPeakAt={forecastPeakTime(machine)}
          hasNeedle={configHasNeedle(machine.specs.boomConfiguration)}
        />
      )}

      {assigningNotif && (
        <AssignModal
          notificationTitle={lang === 'en' ? (assigningNotif.titleEn ?? assigningNotif.title) : assigningNotif.title}
          onConfirm={handleNotifAssignConfirm}
          onCancel={() => setAssigningNotif(null)}
        />
      )}

      {anpassenNotif && (
        <PositionSelector
          title={t('Manuell anpassen', 'Adjust manually')}
          subtitle={t(
            `Auslegerposition für ${machine.name} - ${machine.serialNumber}`,
            `Boom position for ${machine.name} - ${machine.serialNumber}`,
          )}
          currentPosition={machine.position.position}
          forecastMax={machine.forecast.max72h}
          forecastPeakAt={forecastPeakTime(machine)}
          hasNeedle={configHasNeedle(machine.specs.boomConfiguration)}
          allowNoAction
          onSelect={(p) => handleNotifAnpassenConfirm(p)}
          onNoAction={() => handleNotifAnpassenConfirm(null)}
          onClose={() => setAnpassenNotif(null)}
        />
      )}
    </div>
  );
}

/* ----- machine-data table row ----- */
function DataRow({ label, sub, value, valueOk, last, info, danger, badge }: {
  label: string; sub?: string; value: string; valueOk?: boolean; last?: boolean; info?: ReactNode;
  danger?: boolean; badge?: string;
}) {
  return (
    <div className={`mdt-row ${last ? 'mdt-row--last' : ''}`}>
      <div className="mdt-row__head">
        <span className="mdt-row__label">
          {label}
          {info && <span className="mdt-row__info" onClick={(e) => e.stopPropagation()}><InfoPopover>{info}</InfoPopover></span>}
        </span>
        {sub && <span className="mdt-row__sub">{sub}</span>}
      </div>
      <div className="mdt-row__cell">
        <span className={`mdt-row__value ${danger ? 'mdt-row__value--danger' : ''}`}>{value}</span>
        {valueOk && <span className="mdt-row__ok" aria-hidden>✓</span>}
        {badge && <span className="mdt-row__badge">{badge}</span>}
      </div>
    </div>
  );
}

/* ----- wind-speed bar chart (Übersicht) ----- */
function WindChart({ hourly, threshold }: { hourly: ForecastHour[]; threshold: number | null }) {
  const { lang, t, fmtSpeed, fmtThreshold } = useLang();
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
                title={`${h.timestamp.toLocaleString(lang === 'en' ? 'en-GB' : 'de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit' })}${lang === 'en' ? '' : ' Uhr'}: ${fmtSpeed(h.speed)}`}
              />
            );
          })}
        </div>
        {thresholdPct !== null && (
          <div className="windchart__threshold" style={{ bottom: `${thresholdPct}%` }}>
            <span className="windchart__threshold-label">{fmtThreshold(threshold!)}</span>
          </div>
        )}
        {warningPct !== null && (
          <div className="windchart__warning" style={{ bottom: `${warningPct}%` }} />
        )}
      </div>
      <div className="windchart__labels">
        {labelHours.map((h, i) => (
          <span key={i} className="windchart__label">
            {h.timestamp.toLocaleString(lang === 'en' ? 'en-US' : 'de-DE', { weekday: 'short' })} {pad(h.timestamp.getHours())}h
          </span>
        ))}
      </div>
      <div className="windchart__legend">
        <span className="windchart__legend-item windchart__legend-item--safe">{t('Sicher', 'Safe')}</span>
        <span className="windchart__legend-item windchart__legend-item--warning">{t('80 % Schwelle', '80 % threshold')}</span>
        <span className="windchart__legend-item windchart__legend-item--danger">{t('Max. zulässig mit akt. Position', 'Max. permissible at current position')}</span>
      </div>
    </div>
  );
}
