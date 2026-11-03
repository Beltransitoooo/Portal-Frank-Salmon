import React from 'react';
import './ComingSoon.css';

/**
 * Pantalla para módulos en desarrollo.
 * Props: icon (componente), title, message, onBack
 */
export default function ComingSoon({ icon: Icon, title, message, onBack }) {
  return (
    <div className="soon-view">
      <div className="soon-art" aria-hidden="true">
        <span className="soon-ring" />
        <span className="soon-ring soon-ring-2" />
        <div className="soon-tile">{Icon && <Icon />}</div>
      </div>
      <span className="soon-chip">En desarrollo</span>
      <h2>{title}</h2>
      <p className="soon-msg">{message}</p>
      <p className="soon-sub">Muy pronto estará disponible en tu portal.</p>
      {onBack && (
        <button type="button" className="soon-btn" onClick={onBack}>
          Volver a los módulos
        </button>
      )}
    </div>
  );
}