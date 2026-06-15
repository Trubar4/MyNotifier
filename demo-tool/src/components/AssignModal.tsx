import { useState } from 'react';

interface AssignModalProps {
  notificationTitle: string;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}

export function AssignModal({ notificationTitle, onConfirm, onCancel }: AssignModalProps) {
  const [comment, setComment] = useState('');

  return (
    <div className="config-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="assign-modal">
        <div className="assign-modal__header">
          <h2 className="config-modal__title">Aufgabe übernehmen</h2>
          <button className="config-modal__close" onClick={onCancel}>&times;</button>
        </div>
        <div className="assign-modal__body">
          <p className="assign-modal__info">
            Sie übernehmen die Aufgabe für: <strong>{notificationTitle}</strong>
          </p>
          <label className="assign-modal__label" htmlFor="assign-comment">
            Kommentar (optional)
          </label>
          <textarea
            id="assign-comment"
            className="assign-modal__textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="z.B. Ich kümmere mich darum..."
            rows={3}
          />
        </div>
        <div className="assign-modal__footer">
          <button className="lds-btn lds-btn--ghost lds-btn--sm" onClick={onCancel}>
            Abbrechen
          </button>
          <button className="lds-btn lds-btn--primary lds-btn--sm" onClick={() => onConfirm(comment)}>
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}
