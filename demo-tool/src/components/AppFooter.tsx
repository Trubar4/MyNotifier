import { ArrowUp } from 'lucide-react';
import { useLang } from '../i18n';

export function AppFooter() {
  const { t } = useLang();
  return (
    <footer className="app-footer">
      <span className="app-footer__logo">LIEBHERR</span>
      <span className="app-footer__link">{t('Nutzungsbedingungen', 'Terms of use')}</span>
      <span className="app-footer__link">{t('Datenschutzerklärung', 'Privacy policy')}</span>
      <span className="app-footer__link">{t('Datenschutzeinstellungen', 'Privacy settings')}</span>
      <span className="app-footer__spacer" />
      <button
        className="app-footer__scroll-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label={t('Nach oben scrollen', 'Scroll to top')}
      >
        <ArrowUp size={18} />
      </button>
    </footer>
  );
}
