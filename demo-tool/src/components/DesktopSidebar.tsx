import type { Page } from './AppSidebar';
import { useLang } from '../i18n';

const BASE = import.meta.env.BASE_URL;

interface DesktopSidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  unreadCount: number;
  hasCritical: boolean;
}

const ITEMS: { page: Page; icon: string; de: string; en: string }[] = [
  { page: 'notifications', icon: 'nav/bell.svg', de: 'Benachrichtigungen', en: 'Notifications' },
  { page: 'machines', icon: 'crane-lwn.svg', de: 'Maschinen', en: 'Machines' },
  { page: 'reports', icon: 'nav/chart.svg', de: 'Berichte', en: 'Reports' },
  { page: 'settings', icon: 'nav/gear.svg', de: 'Einstellungen', en: 'Settings' },
];

export function DesktopSidebar({ activePage, onNavigate, unreadCount, hasCritical }: DesktopSidebarProps) {
  const { t } = useLang();
  return (
    <nav className="desk-sidebar" aria-label={t('Hauptnavigation', 'Main navigation')}>
      {ITEMS.map((item) => (
        <button
          key={item.page}
          className={`desk-sidebar__item ${activePage === item.page ? 'desk-sidebar__item--active' : ''}`}
          onClick={() => onNavigate(item.page)}
        >
          <span className="desk-sidebar__icon-wrap">
            <img src={BASE + item.icon} alt="" className="desk-sidebar__icon" />
            {item.page === 'notifications' && unreadCount > 0 && (
              <span className={`desk-sidebar__badge ${hasCritical ? 'desk-sidebar__badge--critical' : ''}`}>
                {unreadCount}
              </span>
            )}
          </span>
          <span className="desk-sidebar__label">{t(item.de, item.en)}</span>
        </button>
      ))}
    </nav>
  );
}
