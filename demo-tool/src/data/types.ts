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
  parkposition: 75,
  withNeedle: 35,
  withoutNeedle: 55,
  jackknife: 90,
  boomDown: null,
};

export interface WindData {
  needleBoom: number;
  mainBoom: number;
  timestamp: Date;
}

export interface ForecastData {
  max72h: number;
  timestamp: Date;
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
}

export interface NotificationSettings {
  email: string;
  phone: string;
  globalEnabled: boolean;
  machineOverrides: Record<string, boolean>;
}

export const DEMO_USER = 'Max Mustermann';
