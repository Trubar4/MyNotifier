import type { Page } from './AppSidebar';

const BASE = import.meta.env.BASE_URL;

interface BottomNavProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  unreadCount: number;
  hasCritical: boolean;
}

const NAV_ITEMS: { page: Page; icon: string; label: string }[] = [
  { page: 'notifications', icon: 'nav/bell.svg', label: 'Benachrichtigungen' },
  { page: 'machines', icon: 'crane-lwn.svg', label: 'Maschinen' },
  { page: 'reports', icon: 'nav/chart.svg', label: 'Berichte' },
  { page: 'settings', icon: 'nav/gear.svg', label: 'Einstellungen' },
];

export function BottomNav({ activePage, onNavigate, unreadCount, hasCritical }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Hauptnavigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.page}
          className={`bottom-nav__item ${activePage === item.page ? 'bottom-nav__item--active' : ''}`}
          onClick={() => onNavigate(item.page)}
          aria-label={item.label}
        >
          <img src={BASE + item.icon} alt="" className="bottom-nav__icon" />
          {item.page === 'notifications' && unreadCount > 0 && (
            <span className={`bottom-nav__badge ${hasCritical ? 'bottom-nav__badge--critical' : ''}`}>
              {unreadCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
