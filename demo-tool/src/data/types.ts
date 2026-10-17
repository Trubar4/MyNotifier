export type MachineStatus = 'online' | 'offline';
export type LicenseStatus = 'active' | 'none' | 'expired';

export type BoomPosition =
  | 'parkposition'
  | 'withNeedle'
  | 'withoutNeedle'
  | 'jackknife'
  | 'boomDown';

export const BOOM_POSITION_LABELS: Record<BoomPosition, string> = {
  parkposition: 'Parkposition',
  withNeedle: 'Arbeitsposition mit Nadelausleger',
  withoutNeedle: 'Arbeitsposition ohne Nadelausleger',
  jackknife: 'Klappmesser-Position',
  boomDown: 'Ausleger abgelegt',
};

export const BOOM_THRESHOLDS: Record<BoomPosition, number | null> = {
  parkposition: 20,
  withNeedle: 9,
  withoutNeedle: 15,
  jackknife: 25,
  boomDown: null,
};

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
  jibLength: number | null;            // m
  boomHeadHeight: number | null;       // m
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
}

export type NotificationLevel = 1 | 2;

export interface Notification {
  id: string;
  machineId: string;
  level: NotificationLevel;
  title: string;
  body: string;
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
