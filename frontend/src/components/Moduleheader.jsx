import React, { useEffect, useRef, useState } from 'react';
import './Moduleheader.css';

const MIN_GIRO_MS = 600; // para que el giro se alcance a ver aunque el servidor responda rápido

/* Encabezado común de las pantallas de cada módulo.
 * onRefresh (opcional): función que vuelve a pedir los datos y devuelve true/false;
 * si se pasa, aparece el botón «Actualizar». */
export default function ModuleHeader({ title, subtitle, onBack, onRefresh }) {
  const [estado, setEstado] = useState('idle'); // idle | cargando | ok | error
  const timer = useRef(null);
  const vivo = useRef(true);

  useEffect(() => () => {
    vivo.current = false;
    clearTimeout(timer.current);
  }, []);

  const actualizar = async () => {
    if (estado === 'cargando') return;
    clearTimeout(timer.current);
    setEstado('cargando');
    const [ok] = await Promise.all([
      Promise.resolve(onRefresh()).catch(() => false),
      new Promise((r) => setTimeout(r, MIN_GIRO_MS)),
    ]);
    if (!vivo.current) return;
    setEstado(ok ? 'ok' : 'error');
    timer.current = setTimeout(() => setEstado('idle'), ok ? 2000 : 4000);
  };

  const texto = {
    idle: 'Actualizar',
    cargando: 'Actualizando…',
    ok: 'Actualizado',
    error: 'Sin conexión',
  }[estado];

  return (
    <header className="mod-head">
      {onBack && (
        <button type="button" className="mod-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          Módulos
        </button>
      )}
      <div className="mod-row">
        <div className="mod-titles">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {onRefresh && (
          <button
            type="button"
            className={`mod-refresh ${estado}`}
            onClick={actualizar}
            disabled={estado === 'cargando'}
            aria-live="polite"
            title="Traer lo más reciente sin recargar la página"
          >
            {estado === 'ok' ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v4h4" />
                <path d="M4 13a8 8 0 0 0 14.6 4.5M20 20v-4h-4" />
              </svg>
            )}
            {texto}
          </button>
        )}
      </div>
    </header>
  );
}
