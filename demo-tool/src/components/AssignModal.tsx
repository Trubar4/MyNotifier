import { useState } from 'react';
import { useLang } from '../i18n';

interface AssignModalProps {
  notificationTitle: string;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}

export function AssignModal({ notificationTitle, onConfirm, onCancel }: AssignModalProps) {
  const { t } = useLang();
  const [comment, setComment] = useState('');

  return (
    <div className="config-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="assign-modal">
        <div className="assign-modal__header">
          <h2 className="config-modal__title">{t('Aufgabe übernehmen', 'Accept task')}</h2>
          <button className="config-modal__close" onClick={onCancel}>&times;</button>
        </div>
        <div className="assign-modal__body">
          <p className="assign-modal__info">
            {t('Sie übernehmen die Aufgabe für:', 'You are accepting the task for:')} <strong>{notificationTitle}</strong>
          </p>
          <label className="assign-modal__label" htmlFor="assign-comment">
            {t('Kommentar (optional)', 'Comment (optional)')}
          </label>
          <textarea
            id="assign-comment"
            className="assign-modal__textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('z.B. Ich kümmere mich darum...', 'e.g. I will take care of it...')}
            rows={3}
          />
        </div>
        <div className="assign-modal__footer">
          <button className="lds-btn lds-btn--ghost lds-btn--sm" onClick={onCancel}>
            {t('Abbrechen', 'Cancel')}
          </button>
          <button className="lds-btn lds-btn--primary lds-btn--sm" onClick={() => onConfirm(comment)}>
            {t('Übernehmen', 'Accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
