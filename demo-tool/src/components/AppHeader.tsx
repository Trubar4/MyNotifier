import { User } from 'lucide-react';

interface AppHeaderProps {
  onAvatarClick?: () => void;
}

export function AppHeader({ onAvatarClick }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo">LIEBHERR</span>
        <span className="app-header__product">MyNotifier</span>
      </div>
      <button className="app-header__avatar" onClick={onAvatarClick} aria-label="Benutzerkonto">
        <User size={24} strokeWidth={1.75} />
      </button>
    </header>
  );
}
