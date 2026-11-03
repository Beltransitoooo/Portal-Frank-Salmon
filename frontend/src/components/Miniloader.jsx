import React from 'react';
import './MiniLoader.css';

/* Duración de la mini pantalla de carga entre módulos (ms) */
export const MINI_MS = 650;

/**
 * Mini pantalla de carga que aparece dentro del panel al cambiar de módulo.
 * icon: icono del módulo (se "dibuja" mientras carga), name: nombre, caption: texto pequeño
 */
export default function MiniLoader({ icon: Icon, name, caption = 'Abriendo' }) {
  return (
    <div className="mini" role="status" aria-live="polite" style={{ '--mini-ms': `${MINI_MS}ms` }}>
      <div className="mini-art" aria-hidden="true">
        <span className="mini-ring" />
        <div className="mini-tile">{Icon && <Icon />}</div>
      </div>
      <p className="mini-caption">{caption}</p>
      <p className="mini-name">{name}</p>
      <div className="mini-bar" aria-hidden="true"><span /></div>
    </div>
  );
}