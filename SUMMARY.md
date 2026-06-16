# MyNotifier WIND Demo — Projekt-Zusammenfassung

## Überblick

Demonstrator für **MyNotifier WIND** — eine Liebherr Web-Applikation zur Überwachung von Windbedingungen an Mobilkranen/Raupenkranen. Die Demo fühlt sich wie das echte Produktionstool an, zeigt 4 Maschinen mit konfigurierbaren Zuständen und nutzt das Liebherr Design System (LDS).

**Live-URL**: https://trubar4.github.io/MyNotifier/
**Branch**: `claude/confident-tesla-qw7wa7`
**Tech-Stack**: Vite + React + TypeScript, CSS-only (kein CSS-Framework, LDS-Tokens)
**Deploy**: GitHub Actions → GitHub Pages (Workflow: `.github/workflows/deploy-demo.yml`)

---

## Projektstruktur

```
MyNotifier/
├── .github/workflows/deploy-demo.yml    # Auto-Deploy auf Push
├── design-system/
│   ├── lds.css                          # Liebherr Design System Tokens
│   ├── tokens/                          # Design-Tokens
│   └── components/                      # LDS-Komponenten
├── mockups/
│   ├── Maschinenübersicht.png           # Mockup Übersicht
│   ├── MachinenDetails.png              # Mockup Details (inkl. Windhistogramm unten!)
│   ├── Benachrichtigungen.png           # Mockup Notifications
│   ├── Sensor Jib.svg                   # Liebherr draw.io Export
│   ├── Sensor boom.svg                  # Liebherr draw.io Export
│   ├── liebherr-crawler-crane-LWN-icon-rgb-64px.svg
│   └── liebherr-crawler-crane-main-boom-angle-icon-rgb-64px.svg
└── demo-tool/
    ├── vite.config.ts                   # base: '/MyNotifier/'
    ├── tsconfig.json                    # verbatimModuleSyntax → import type
    ├── public/
    │   ├── crane-lwn.svg               # Kran-Icon (Header, Sidebar, Cards)
    │   ├── boom-angle.svg              # Auslegerposition-Icon
    │   ├── sensor-jib.svg              # Nadelausleger-Sensor (Detail)
    │   ├── sensor-boom.svg             # Hauptausleger-Sensor (Detail)
    │   └── favicon.svg
    └── src/
        ├── App.tsx                      # Haupt-App, State, Routing
        ├── styles/app.css               # Alle CSS (~2500 Zeilen)
        ├── data/
        │   ├── types.ts                 # Alle Typen & Konstanten
        │   ├── machines.ts              # 4 Default-Maschinen
        │   └── notifications.ts         # 5 Default-Benachrichtigungen
        └── components/
            ├── AppHeader.tsx            # Liebherr Header mit Bell-Icon
            ├── AppSidebar.tsx           # Sidebar-Navigation
            ├── AppFooter.tsx            # Footer
            ├── MachineOverview.tsx       # Maschinenübersicht + Suche/Sortierung
            ├── MachineCard.tsx          # Übersichtskarte je Maschine
            ├── MachineDetail.tsx        # Detail-Ansicht einer Maschine
            ├── NotificationsPage.tsx    # Benachrichtigungen-Tab
            ├── SettingsPage.tsx         # Einstellungen-Tab
            ├── ScenarioConfig.tsx       # Demo-Konfiguration pro Maschine
            ├── PositionSelector.tsx     # Position-Auswahl Modal
            ├── AssignModal.tsx          # Aufgabe-Übernahme mit Kommentar
            ├── InfoPopover.tsx          # (i)-Popover
            └── CraneIcons.tsx           # [UNUSED] — war mal für inline SVGs
```

---

## Datenmodell (types.ts)

### BoomPosition & Schwellenwerte (realistische m/s)
```typescript
type BoomPosition = 'parkposition' | 'withNeedle' | 'withoutNeedle' | 'jackknife' | 'boomDown';

BOOM_THRESHOLDS: {
  parkposition: 20,      // 20 m/s
  withNeedle: 9,          // 9 m/s (empfindlichste)
  withoutNeedle: 15,      // 15 m/s
  jackknife: 25,          // 25 m/s
  boomDown: null,         // kein Limit
}

BOOM_POSITION_LABELS: {
  parkposition: 'Parkposition',
  withNeedle: 'Arbeitsposition mit Nadelausleger',
  withoutNeedle: 'Arbeitsposition ohne Nadelausleger',
  jackknife: 'Klappmesser-Position',
  boomDown: 'Ausleger abgelegt',
}
```

### MachineConfig
```typescript
interface MachineConfig {
  id: string; name: string; serialNumber: string; type: string;
  status: 'online' | 'offline';
  license: 'active' | 'none' | 'expired';
  position: PositionData;     // position, timestamp, manuallySet, fixedUntil, autoUpdate, reportedPosition, reportedAt
  wind: WindData;             // needleBoom, mainBoom, timestamp
  forecast: ForecastData;     // max72h, timestamp
  location: LocationData;     // lat, lng, address, shortAddress
  notifications: NotificationData;  // critical, warning (Zähler auf MachineConfig, NICHT die echten Notifications)
}
```

### Notification
```typescript
interface Notification {
  id: string; machineId: string;
  level: 1 | 2;              // 1 = kritisch/rot, 2 = warnung/gelb
  title: string; body: string; timestamp: Date;
  read: boolean;
  assignedTo: string | null;
  assignedAt: Date | null;
  assignedComment: string | null;  // Kommentar bei Aufgaben-Übernahme
}
```

### NotificationSettings
```typescript
interface NotificationSettings {
  email: string; phone: string;
  globalEnabled: boolean;
  machineOverrides: Record<string, boolean>;  // pro Maschine
}
```

### Konstanten
- `DEMO_USER = 'Max Mustermann'` (fester Demo-User, Avatar "MM")

---

## Die 4 Demo-Maschinen (machines.ts)

| # | Name | Serial | Status | Position | Wind (N/H) | Threshold | Forecast | Standort |
|---|------|--------|--------|----------|-----------|-----------|----------|----------|
| 1 | LR 1130.1 UNPLUGGED | 137187 | online | parkposition | 5.2/4.1 | 20 | 12.0 | 88400 Biberach |
| 2 | LR 1250.1 UNPLUGGED | 135350 | offline | withoutNeedle (manuell, fixiert+12h, autoUpdate:off, reportedPosition:withNeedle) | 8.3/6.8 | 15 | 14.5 | 70173 Stuttgart |
| 3 | LR 1110 | 133188 | offline 48h | withoutNeedle | 16.8/14.2 | 15 | 18.5 | 80335 München |
| 4 | LR 1300 SX | 142501 | offline | boomDown, keine Lizenz | 0/0 | null | 0 | 8004 Zürich |

**Maschine 3 überschreitet den Schwellenwert** (16.8 > 15) → zeigt rote Warnung auf Übersicht und Detail.

---

## 5 Demo-Benachrichtigungen (notifications.ts)

| ID | Maschine | Level | Titel | Status |
|----|----------|-------|-------|--------|
| n1 | LR 1130.1 | 1 (kritisch) | Hohe Windwarnung | unread |
| n2 | LR 1130.1 | 2 (warnung) | Windwarnung — Bestätigung erforderlich | unread |
| n3 | LR 1110 | 1 (kritisch) | Kritische Windwarnung | unread |
| n4 | LR 1110 | 2 (warnung) | Keine Daten des Windloggers | read |
| n5 | LR 1250.1 | 2 (warnung) | Positionsabweichung erkannt | unread |

---

## Implementierte Features

### 1. Maschinenübersicht (MachineOverview + MachineCard)
- **Suchfeld**: Filtert nach Name, Seriennummer, Standort
- **Sortierung**: "Neueste Meldung" (nach Wind-Timestamp) oder "Alphabetisch"
- **Karten** zeigen: Position, Status (Online/Offline), Wind (Nadel/Hauptausleger), Vorhersage 72h, Standort
- **Notification-Badge**: Anzahl ungelesener Benachrichtigungen, Farbe nach Schweregrad (rot/gelb), klickbar → Benachrichtigungs-Tab gefiltert
- **Assigned-User-Banner**: Grüner Streifen wenn Aufgabe übernommen
- **Wind-Warnung auf Karte**: Rote linke Border + rote Werte + "⚠ Schwellenwert überschritten (X m/s)" wenn Wind >= Threshold
- **Position-Buttons**: "Prüfen und setzen" (wenn offline, nicht manuell) / "Position bei Änderung aktualisieren" (wenn manuell gesetzt)
- **ScenarioConfig**: Zahnrad-Button pro Karte öffnet Demo-Konfiguration (Status, Lizenz, Position, Wind-Slider 0-30 m/s, Forecast, Datenalter)

### 2. Maschinendetails (MachineDetail)
- **Breadcrumb**: "← Zurück zur Übersicht"
- **Header**: Kran-Icon, Name, Status-Badge, Lizenz-Badge, Notification-Count
- **Maschinenstatus** (oben links): Online/Offline mit Dot, seit wann offline
- **Standort** (oben rechts): Adresse + OpenStreetMap-Embed (klickbar → vergrößerte Karte im Modal, Link zu OSM)
- **Aktuelle Windgeschwindigkeit**: Sensor-SVGs (Jib/Boom), Werte mit Threshold-Balken (80% Warnung, 100% Limit), Live-Indikator, Schwellenwert-Status (safe/warning/danger)
- **Auslegerposition**: Aktuelle Position + Threshold, Fixierung (datetime-picker + InfoPopover), Auto-Update-Toggle, Positions-Abweichungs-Warnung, "Position manuell setzen"-Button → PositionSelector Modal
- **Vorhersage 72h**: Max-Wert mit Threshold-Balken, Warnung wenn Forecast > Threshold
- **Benachrichtigungen** (inline):
  - Offene Notifications als klickbare Karten (wie NotificationsPage)
  - Klick → Detail-Ansicht mit Zurück-Button, Übernehmen/Abgeben, gelesen/ungelesen
  - AssignModal mit optionalem Kommentar
  - Kommentar-Anzeige (schwarze Schrift, italic)
  - Cross-Reference: "Username hat für [Titel] die Aufgabe übernommen" → klickbar
  - Settings-Toggle unten mit Settings-Icon: "Benachrichtigungen für diese Maschine empfangen"

### 3. Benachrichtigungen (NotificationsPage)
- **Zurück-Button**: Erscheint wenn von Maschinenübersicht navigiert (Breadcrumb-Stil)
- **Filter-Banner**: Bei Maschinen-Filter "Gefiltert nach: [Maschine]" mit "Filter aufheben"
- **Filter-Chips**: Offen / Gelesen / Alle
- **Akkordeon-Gruppierung** (Standard): Pro Maschine gruppiert, farbiger Header (rot/gelb), neueste/kritischste oben, Rest unter "X weitere anzeigen" einklappbar
- **Notification-Cards**:
  - Level-Badge (Kritisch rot / Warnung gelb), Zeitstempel, Titel, Body
  - Assigned-Info mit grünem Haken + Username
  - Kommentar-Anzeige (schwarze Schrift, italic, MessageSquare-Icon)
  - Cross-Reference: Hinweis wenn andere Notification derselben Maschine übernommen wurde (klickbar, expandiert Gruppe, scrollt hin)
  - 3 Buttons: **Übernehmen/Abgeben** | **Als gelesen/ungelesen markieren** | **Zur Maschine** (→ Maschinendetails)
- **AssignModal**: Popup bei Übernehmen, optionaler Kommentar, OK (leer möglich) / Abbrechen
- **Highlight**: Angeklickte Cross-Reference bekommt kurz gelben Rahmen (fade-out Animation)

### 4. Einstellungen (SettingsPage)
- **Globaler Toggle**: Benachrichtigungen ein/aus
- **Email + Telefon**: Input-Felder
- **Pro-Maschine-Toggles**: Individuell oder "Auf Global zurücksetzen"

### 5. App-Header (AppHeader)
- LIEBHERR Logo + "MyNotifier"
- Sprach-Button (DE), Bell-Icon mit Badge (Anzahl ungelesene, rot bei kritisch, gelb bei nur Warnungen)
- Avatar "MM" (Max Mustermann)
- Bell-Klick → Benachrichtigungen-Tab

### 6. Sidebar (AppSidebar)
- Icons für: Benachrichtigungen, Maschinen (crane-lwn.svg), Berichte, Benutzer, Einstellungen
- Aktive Seite hervorgehoben mit gelber Farbe

---

## Design-System & Styling

### LDS (Liebherr Design System)
- **Import**: `@import url("../../../design-system/lds.css")` in app.css
- **Tokens**: CSS Custom Properties (`--r-brand` = Liebherr gelb, `--r-error`, `--r-warning`, `--r-success`, `--r-surface-*`, `--r-on-surface-*`, `--s-1` bis `--s-8` Spacing, `--radius-*`, `--shadow-*`, `--font-text`, `--font-text-b`, `--font-text-m`)
- **Button-Konvention**: `text-transform: uppercase; letter-spacing: 0.04em`
- **Klassen**: `.lds-btn`, `.lds-btn--primary`, `.lds-btn--ghost`, `.lds-btn--sm`

### Wichtige CSS-Konventionen
- BEM-artige Namensgebung: `.machine-card__header`, `.notif-card--level-1`
- Info-Button (i): `background: none; border: none; color: var(--r-brand);` mit svg 18x18
- Toggle-Switch: 44x24px, Brand-Farbe wenn aktiv
- Config-Chips: `padding: 8px 20px`, Pill-Radius, Brand-Farbe aktiv
- Status-Dot: 8x8px, grün (online) / grau (offline)

### Responsive Breakpoints
- ≤640px: Mobile
- ≤380px: Kleine Phones
- ≤1024px: Tablet
- Landscape-spezifische Styles

### CSS-Datei Struktur (app.css ~2528 Zeilen)
```
Zeile   Sektion
1       LDS Import + Button Override
15      Layout (Grid)
47      Header
126     Sidebar Nav
163     Machine Overview (Toolbar, Search, Sort, Grid)
233     Machine Card
354     Data Field (Werte in Cards)
430     Info Button
459     Info Popover
481     Status Indicators
500     License Badge
521     Scenario Config Modal
579     Config Field
652     Wind Display
695     Footer
746     Detail View (Breadcrumb, Header, Grid, Sections)
1446    Notifications Page (Toolbar, Cards, Accordion, Accordion-Toggle)
1849    Settings Page
1973    Location / Map
2064    Utils
2076    Responsive: ≤1024px (Tablet)
2117    Responsive: ≤768px
2308    Responsive: ≤640px (Mobile)
2326    Responsive: ≤380px
2495    Responsive: Landscape + Short
2517    Responsive: Landscape Phone
```

---

## App-Routing (App.tsx)

State-basiert, kein Router:
- `activePage`: 'machines' | 'notifications' | 'settings' | 'reports' | 'users'
- `detailMachineId`: string | null (wenn gesetzt → MachineDetail statt Overview)
- `notifFilterMachineId`: Maschinenfilter für NotificationsPage
- `notifCameFromMachines`: Boolean für Zurück-Button
- `highlightNotifId`: Notification hervorheben bei Cross-Reference
- `openPositionSelector`: Position-Selektor beim Öffnen der Detail-Seite

### Navigation
- Sidebar → `handleNavigate(page)` setzt alles zurück
- Bell → `handleBellClick()` → Notifications ohne Filter
- Badge auf Card → `handleMachineNotifClick(machineId)` → Notifications gefiltert
- "Zur Maschine" Button → setzt `activePage='machines'` + `detailMachineId`

---

## Wichtige technische Details

### SVG-Icons
- Liebherr SVGs aus mockups/ als statische Dateien in public/ kopiert
- Eingebunden via `<img src={BASE + 'crane-lwn.svg'}>` mit `import.meta.env.BASE_URL`
- CraneIcons.tsx existiert aber wird NICHT mehr importiert (deprecated)

### TypeScript
- `verbatimModuleSyntax` in tsconfig → `import type` für Type-Only-Imports erforderlich
- Strenge Typisierung aller Props

### Vite
- `base: '/MyNotifier/'` für GitHub Pages
- `server.fs.allow: ['..']` für Zugriff auf design-system/

### GitHub Pages Deploy
- Workflow triggert auf Push zu `main` oder `claude/confident-tesla-qw7wa7`
- Baut demo-tool/, deployt dist/ zu Pages
- Nach Push 1-2 Min warten, dann Hard Refresh (Ctrl+Shift+R)

---

## Nächster Usecase: Vorhersage 72h erweitern

### Anforderungen
1. **Überschreitungs-Zeitpunkt anzeigen**: Wenn Forecast den Schwellenwert überschreitet, anzeigen WANN: "Erwartete Überschreitung am 16.06.26 10:33" — auf Detail-Seite UND Übersichtskarte
2. **Aufklappbare Prognose-Detail-Ansicht** (ähnlich der Karte mit Standort → Klick vergrößert):
   - Prognose in Stunden aufgelöst als Histogramm (Balkendiagramm)
   - Farbige Balken zeigen wann es für die gewählte Position kritisch wird (rot über Threshold, gelb bei 80%)
   - Referenz-Mockup: `/mockups/MachinenDetails.png` — unten ist ein Windgeschwindigkeits-Histogramm mit schwarzen Balken zu sehen

### Implementierungshinweise
- ForecastData in types.ts muss um stündliche Werte erweitert werden (z.B. `hourly: { timestamp: Date, speed: number }[]`)
- Histogramm kann mit reinem CSS (flexbox + Balken) oder einem leichten Chart-Lib gebaut werden
- Schwellenwert als horizontale Linie im Histogramm
- Klick-zum-Aufklappen wie bei der Karte: kleines Preview + Overlay für Detail
- Übersichtskarte: "Erwartete Überschreitung: [Datum/Uhrzeit]" als Warnzeile unter dem Forecast-Wert
- Dummy-Daten für stündliche Werte generieren (z.B. sinusförmig mit Peak)

---

## Bekannte Design-Entscheidungen
- Wind-Werte in den Übersichtskarten nur als Text (keine SVG-Icons), SVGs nur auf Detail-Seite
- Info (i) Icon: Kein Hintergrund, Liebherr-Gelb als Icon-Farbe
- Position auf Detail: Nur aktive Position + Schwellenwert, NICHT alle Positionen
- "Position manuell setzen": LDS-Button, nicht unterstrichener Text-Link
- Notification-Badge: Farbe des kritischsten (rot > gelb)
- Demo-User fix "Max Mustermann", Avatar "MM"
- Sortierung: Default "Neueste Meldung", Alternative "Alphabetisch"
- Notification-Gruppierung: Akkordeon (neueste/kritischste oben, Rest einklappbar)
