import { Bell, BarChart3, Settings } from 'lucide-react';
import type { Page } from './AppSidebar';

const BASE = import.meta.env.BASE_URL;

interface BottomNavProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  unreadCount: number;
  hasCritical: boolean;
}

function CraneIcon({ active }: { active: boolean }) {
  return (
    <img
      src={BASE + 'crane-lwn.svg'}
      alt=""
      width={28}
      height={28}
      style={{ display: 'block', opacity: active ? 1 : 0.9 }}
    />
  );
}

export function BottomNav({ activePage, onNavigate, unreadCount, hasCritical }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Hauptnavigation">
      <button
        className={`bottom-nav__item ${activePage === 'notifications' ? 'bottom-nav__item--active' : ''}`}
        onClick={() => onNavigate('notifications')}
        aria-label="Benachrichtigungen"
      >
        <Bell size={28} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className={`bottom-nav__badge ${hasCritical ? 'bottom-nav__badge--critical' : ''}`}>
            {unreadCount}
          </span>
        )}
      </button>

      <button
        className={`bottom-nav__item ${activePage === 'machines' ? 'bottom-nav__item--active' : ''}`}
        onClick={() => onNavigate('machines')}
        aria-label="Maschinen"
      >
        <CraneIcon active={activePage === 'machines'} />
      </button>

      <button
        className={`bottom-nav__item ${activePage === 'reports' ? 'bottom-nav__item--active' : ''}`}
        onClick={() => onNavigate('reports')}
        aria-label="Berichte"
      >
        <BarChart3 size={28} strokeWidth={1.75} />
      </button>

      <button
        className={`bottom-nav__item ${activePage === 'settings' ? 'bottom-nav__item--active' : ''}`}
        onClick={() => onNavigate('settings')}
        aria-label="Einstellungen"
      >
        <Settings size={28} strokeWidth={1.75} />
      </button>
    </nav>
  );
}
