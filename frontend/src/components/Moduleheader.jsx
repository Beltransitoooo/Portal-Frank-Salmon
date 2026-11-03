import React from 'react';
import './ModuleHeader.css';

/* Encabezado común de las pantallas de cada módulo */
export default function ModuleHeader({ title, subtitle, onBack }) {
  return (
    <header className="mod-head">
      {onBack && (
        <button type="button" className="mod-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          Módulos
        </button>
      )}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}