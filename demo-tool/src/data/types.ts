export type MachineStatus = 'online' | 'offline';
export type LicenseStatus = 'active' | 'none' | 'expired';

export type BoomPosition =
  | 'parkposition'
  | 'arbeitsposition'
  | 'jackknife'
  | 'boomDown';

/**
 * Canonical order for every position list in the UI:
 * Arbeitsposition → Parkposition → Klappmesser → Ausleger abgelegt.
 * All lists iterate Object.keys(BOOM_POSITION_LABELS), so this key order
 * is the single source of truth for that order.
 */
export const BOOM_POSITION_LABELS: Record<BoomPosition, string> = {
  arbeitsposition: 'Arbeitsposition',
  parkposition: 'Parkposition',
  jackknife: 'Klappmesser-Position',
  boomDown: 'Ausleger abgelegt',
};

/**
 * Base max. permissible wind per position. For the Arbeitsposition the
 * limit depends on whether a Nadelausleger is configured (that is a matter
 * of the Auslegerkonfiguration, not the position) — see positionThreshold.
 * The value here is the Arbeitsposition limit WITHOUT Nadelausleger.
 */
export const BOOM_THRESHOLDS: Record<BoomPosition, number | null> = {
  parkposition: 20,
  arbeitsposition: 16,
  jackknife: 25,
  boomDown: null,
};

/** Arbeitsposition limit (same with or without Nadelausleger). */
export const ARBEITSPOSITION_NEEDLE_THRESHOLD = 16;

/** True when the boom configuration includes a Nadelausleger. */
export function configHasNeedle(boomConfiguration: string): boolean {
  const c = boomConfiguration.toLowerCase();
  return c.includes('nadelausleger') && !c.includes('ohne nadelausleger');
}

/** Max. permissible wind for a position, accounting for the Nadelausleger config. */
export function positionThreshold(position: BoomPosition, hasNeedle: boolean): number | null {
  if (position === 'arbeitsposition' && hasNeedle) return ARBEITSPOSITION_NEEDLE_THRESHOLD;
  return BOOM_THRESHOLDS[position];
}

/** Convenience: threshold for a machine's current position + configuration. */
export function machineThreshold(machine: MachineConfig): number | null {
  return positionThreshold(machine.position.position, configHasNeedle(machine.specs.boomConfiguration));
}

/** Timestamp of the highest forecast wind speed in the machine's forecast. */
export function forecastPeakTime(machine: MachineConfig): Date | null {
  const h = machine.forecast.hourly;
  if (!h.length) return null;
  return h.reduce((a, x) => (x.speed > a.speed ? x : a), h[0]).timestamp;
}

export interface WindData {
  needleBoom: number;
  mainBoom: number;
  timestamp: Date;
}

export interface ForecastHour {
  timestamp: Date;
  speed: number;
}

export interface ForecastData {
  max72h: number;
  timestamp: Date;
  hourly: ForecastHour[];
}

export interface PositionData {
  position: BoomPosition;
  timestamp: Date;
  manuallySet: boolean;
  fixedUntil: Date | null;
  autoUpdate: boolean;
  reportedPosition: BoomPosition | null;
  reportedAt: Date | null;
}

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  shortAddress: string;
}

export interface NotificationData {
  critical: number;
  warning: number;
}

export interface MachineSpecs {
  outsideTemperature: number | null;   // °C
  boomConfiguration: string;           // z.B. "Hauptausleger + Nadelausleger"
  mainBoomLength: number | null;       // m
  mainBoomAngle: number | null;        // ° (Winkel des Hauptauslegers)
  jibLength: number | null;            // m
  jibAngle: number | null;             // ° (Winkel des Nadelauslegers)
  boomHeadHeight: number | null;       // m (Kopfhöhe Hauptausleger)
  jibHeadHeight: number | null;        // m (Kopfhöhe Nadelausleger; 0 ohne Nadel)
  windloggerImei: string;
}

export interface MachineConfig {
  id: string;
  name: string;
  serialNumber: string;
  type: string;
  status: MachineStatus;
  license: LicenseStatus;
  position: PositionData;
  wind: WindData;
  forecast: ForecastData;
  location: LocationData;
  notifications: NotificationData;
  specs: MachineSpecs;
  /** Data source 2 — wind logger (own GSM link). Undefined = online. */
  windloggerStatus?: 'online' | 'offline' | 'fault';
  /** Data source 3 — wind forecast. Undefined = available. */
  forecastStatus?: 'ok' | 'unavailable';
  /** Manually entered VMax from the operating manual (m/s); fallback while inactive. */
  manualVmax?: number | null;
}

export type NotificationLevel = 1 | 2;

/**
 * Kind drives the (expanded) headline:
 * - exceedance        → "Überschreitung: X m/s" where X = (forecast max − limit)
 * - forecast          → "WARNUNG" (threshold at 50 %, not exceeded)
 * - positionDeviation → "Auslegerposition aktualisiert"
 * - noData            → keeps its own title
 * Failures of the three data sources (2 = wind logger, 3 = forecast):
 * - windloggerOffline → "Windlogger offline seit <ts>"
 * - noForecast        → "Keine Windprognose seit <ts>"
 * - windloggerFault   → "Windlogger Sensor defekt seit <ts>"
 */
export type NotificationKind =
  | 'exceedance' | 'forecast' | 'positionDeviation' | 'noData'
  | 'windloggerOffline' | 'noForecast' | 'windloggerFault';

export interface Notification {
  id: string;
  machineId: string;
  level: NotificationLevel;
  kind: NotificationKind;
  title: string;
  /** English title (for the compact machine-detail list). */
  titleEn?: string;
  /** Text shown behind the (i) info icon. */
  body: string;
  /** English (i) info text. */
  bodyEn?: string;
  /** English "MASSNAHMEN" text. */
  actionTextEn?: string;
  /** "MASSNAHMEN ERFORDERLICH" body (one or more lines). */
  actionText?: string;
  /** Overrides the machine's forecast max for this notification's "Prognostizierte Windgeschwindigkeit" / headline. */
  forecastDisplay?: number;
  /** When set, the forecast line reads "Prognostizierte max. Windgeschwindigkeit: … - <this>". */
  forecastPeakAt?: Date;
  timestamp: Date;
  read: boolean;
  assignedTo: string | null;
  assignedAt: Date | null;
  assignedComment: string | null;
}

export type WeekDay = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';
export const WEEKDAYS: WeekDay[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

/* Slider step values (Figma Settings) */
export const PROGNOSE_STEPS = [1, 6, 12, 24, 48, 72];        // Stunden
export const VORWARN_STEPS = [50, 60, 70, 80, 90, 100];       // Prozent der Grenze
export const REPEAT_STEPS = [5, 15, 30, 60];                  // Minuten

/** Warn/notification preferences — used globally and per machine (override). */
export interface NotifyPrefs {
  prognoseWindowH: number;   // one of PROGNOSE_STEPS
  notifyDays: WeekDay[];
  vorwarnPercent: number;    // one of VORWARN_STEPS
  repeatMin: number;         // one of REPEAT_STEPS
  sms: boolean;
  email: boolean;
}

export interface NotificationSettings {
  email: string;
  phone: string;
  globalEnabled: boolean;
  machineOverrides: Record<string, boolean>;      // receive on/off per machine
  prefs: NotifyPrefs;                              // global preferences
  machinePrefs: Record<string, NotifyPrefs>;      // per-machine override (presence = override enabled)
}

export const DEMO_USER = 'Max Mustermann';
