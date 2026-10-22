import type { Page } from './AppSidebar';
import { useLang } from '../i18n';

const BASE = import.meta.env.BASE_URL;

interface BottomNavProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  unreadCount: number;
  hasCritical: boolean;
}

const NAV_ITEMS: { page: Page; icon: string; de: string; en: string }[] = [
  { page: 'notifications', icon: 'nav/bell.svg', de: 'Benachrichtigungen', en: 'Notifications' },
  { page: 'machines', icon: 'crane-lwn.svg', de: 'Maschinen', en: 'Machines' },
  { page: 'reports', icon: 'nav/chart.svg', de: 'Berichte', en: 'Reports' },
  { page: 'settings', icon: 'nav/gear.svg', de: 'Einstellungen', en: 'Settings' },
];

export function BottomNav({ activePage, onNavigate, unreadCount, hasCritical }: BottomNavProps) {
  const { t } = useLang();
  return (
    <nav className="bottom-nav" aria-label={t('Hauptnavigation', 'Main navigation')}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.page}
          className={`bottom-nav__item ${activePage === item.page ? 'bottom-nav__item--active' : ''}`}
          onClick={() => onNavigate(item.page)}
          aria-label={t(item.de, item.en)}
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
