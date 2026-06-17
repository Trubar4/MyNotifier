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

export interface NotificationSettings {
  email: string;
  phone: string;
  globalEnabled: boolean;
  machineOverrides: Record<string, boolean>;
  forecastWindowHours: number;
  forecastWindowOverrides: Record<string, number>;
}

export const DEMO_USER = 'Max Mustermann';
