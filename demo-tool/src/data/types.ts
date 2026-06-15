export type MachineStatus = 'online' | 'offline';
export type LicenseStatus = 'active' | 'none' | 'expired';

export type BoomPosition =
  | 'parkposition'
  | 'extended'
  | 'partial'
  | 'jackknife'
  | 'unknown';

export const BOOM_POSITION_LABELS: Record<BoomPosition, string> = {
  parkposition: 'Parkposition',
  extended: 'Voll ausgefahren',
  partial: 'Teilweise ausgefahren',
  jackknife: 'Eingefahren / Abgelegt',
  unknown: 'Unbekannt',
};

export const BOOM_THRESHOLDS: Record<BoomPosition, number | null> = {
  parkposition: 75,
  extended: 35,
  partial: 55,
  jackknife: 90,
  unknown: null,
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
  notifications: NotificationData;
}
