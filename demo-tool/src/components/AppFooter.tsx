import { ArrowUp } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="app-footer">
      <span className="app-footer__logo">LIEBHERR</span>
      <span className="app-footer__link">Nutzungsbedingungen</span>
      <span className="app-footer__link">Datenschutzerklärung</span>
      <span className="app-footer__link">Datenschutzeinstellungen</span>
      <span className="app-footer__spacer" />
      <button
        className="app-footer__scroll-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Nach oben scrollen"
      >
        <ArrowUp size={18} />
      </button>
    </footer>
  );
}
