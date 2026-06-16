import type { MachineConfig, ForecastHour, MachineSpecs } from './types';

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}


// Generate 72 sinusoidal hourly forecast values peaking at peakValue at peakHour
function generateHourlyForecast(peakValue: number, peakHour: number): ForecastHour[] {
  const now = new Date();
  const baseValue = peakValue * 0.3;
  return Array.from({ length: 72 }, (_, i) => {
    const phase = ((i - peakHour) / 72) * Math.PI * 2;
    const sine = Math.cos(phase);
    const speed = Math.max(0, baseValue + (peakValue - baseValue) * ((sine + 1) / 2));
    return {
      timestamp: new Date(now.getTime() + i * 60 * 60 * 1000),
      speed: Math.round(speed * 10) / 10,
    };
  });
}

export const DEFAULT_MACHINES: MachineConfig[] = [
  {
    id: 'lr1130-137187',
    name: 'LR 1130.1 UNPLUGGED',
    serialNumber: '137187',
    type: 'LR 1130.1',
    status: 'online',
    license: 'active',
    position: {
      position: 'parkposition',
      timestamp: new Date(),
      manuallySet: false,
      fixedUntil: null,
      autoUpdate: true,
      reportedPosition: null,
      reportedAt: null,
    },
    wind: {
      needleBoom: 5.2,
      mainBoom: 4.1,
      timestamp: new Date(),
    },
    forecast: {
      max72h: 12.0,
      timestamp: hoursAgo(2),
      hourly: generateHourlyForecast(12.0, 18),
    },
    location: {
      lat: 47.6292,
      lng: 9.8965,
      address: 'Hans-Liebherr-Straße 45, 88400 Biberach an der Riß',
      shortAddress: '88400 Biberach',
    },
    notifications: { critical: 1, warning: 1 },
    specs: {
      outsideTemperature: 18.5,
      boomConfiguration: 'Hauptausleger + Nadelausleger',
      mainBoomLength: 84,
      jibLength: 42,
      boomHeadHeight: 108,
      windloggerImei: '356291040113471',
    } satisfies MachineSpecs,
  },
  {
    id: 'lr1250-135350',
    name: 'LR 1250.1 UNPLUGGED',
    serialNumber: '135350',
    type: 'LR 1250.1',
    status: 'offline',
    license: 'active',
    position: {
      position: 'withoutNeedle',
      timestamp: hoursAgo(1),
      manuallySet: false,
      fixedUntil: null,
      autoUpdate: false,
      reportedPosition: 'withNeedle',
      reportedAt: hoursAgo(0.5),
    },
    wind: {
      needleBoom: 8.3,
      mainBoom: 6.8,
      timestamp: hoursAgo(1),
    },
    forecast: {
      max72h: 14.5,
      timestamp: hoursAgo(2),
      hourly: generateHourlyForecast(14.5, 30),
    },
    location: {
      lat: 48.7758,
      lng: 9.1829,
      address: 'Hauptstätter Straße 12, 70173 Stuttgart',
      shortAddress: '70173 Stuttgart',
    },
    notifications: { critical: 0, warning: 0 },
    specs: {
      outsideTemperature: 14.2,
      boomConfiguration: 'Hauptausleger ohne Nadelausleger',
      mainBoomLength: 96,
      jibLength: null,
      boomHeadHeight: 97,
      windloggerImei: '356291040228764',
    } satisfies MachineSpecs,
  },
  {
    id: 'lr1110-133188',
    name: 'LR 1110',
    serialNumber: '133188',
    type: 'LR 1110',
    status: 'offline',
    license: 'active',
    position: {
      position: 'withNeedle',
      timestamp: hoursAgo(2),
      manuallySet: true,
      fixedUntil: null,
      autoUpdate: false,
      reportedPosition: null,
      reportedAt: null,
    },
    wind: {
      needleBoom: 16.8,
      mainBoom: 14.2,
      timestamp: hoursAgo(48),
    },
    forecast: {
      max72h: 18.5,
      timestamp: hoursAgo(2),
      hourly: generateHourlyForecast(18.5, 12),
    },
    location: {
      lat: 48.1351,
      lng: 11.5820,
      address: 'Arnulfstraße 60, 80335 München',
      shortAddress: '80335 München',
    },
    notifications: { critical: 1, warning: 0 },
    specs: {
      outsideTemperature: 11.8,
      boomConfiguration: 'Hauptausleger ohne Nadelausleger',
      mainBoomLength: 72,
      jibLength: null,
      boomHeadHeight: 73,
      windloggerImei: '356291040334951',
    } satisfies MachineSpecs,
  },
  {
    id: 'lr1300-142501',
    name: 'LR 1300 SX',
    serialNumber: '142501',
    type: 'LR 1300',
    status: 'offline',
    license: 'none',
    position: {
      position: 'boomDown',
      timestamp: hoursAgo(0.5),
      manuallySet: false,
      fixedUntil: null,
      autoUpdate: true,
      reportedPosition: null,
      reportedAt: null,
    },
    wind: {
      needleBoom: 0,
      mainBoom: 0,
      timestamp: hoursAgo(0.5),
    },
    forecast: {
      max72h: 0,
      timestamp: hoursAgo(0.5),
      hourly: generateHourlyForecast(0, 36),
    },
    location: {
      lat: 47.3769,
      lng: 8.5417,
      address: 'Europaallee 21, 8004 Zürich, Schweiz',
      shortAddress: '8004 Zürich',
    },
    notifications: { critical: 0, warning: 0 },
    specs: {
      outsideTemperature: null,
      boomConfiguration: 'Ausleger abgelegt',
      mainBoomLength: 108,
      jibLength: 60,
      boomHeadHeight: null,
      windloggerImei: '356291040441237',
    } satisfies MachineSpecs,
  },
];
