import React, { useEffect, useRef, useState } from 'react';
import logo from '../assets/logo-frank-salmon.png';
import './Splash.css';

const SHOW_MS = 1200; // tiempo que dura el dibujo del logo
const FADE_MS = 300; // fundido de salida

/**
 * Pantalla de carga de la primera visita (al entrar a la URL).
 * Se queda opaca encima de la app hasta que termina, y luego se desvanece.
 */
export default function Splash({ onDone }) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const total = reduce ? 500 : SHOW_MS + FADE_MS;

  const [ready, setReady] = useState(false); // el logo ya cargó, empieza el dibujo
  const [leaving, setLeaving] = useState(false);
  const imgRef = useRef(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) setReady(true);
  }, []);

  useEffect(() => {
    const a = setTimeout(() => setLeaving(true), total - FADE_MS);
    const b = setTimeout(() => done.current && done.current(), total);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [total]);

  return (
    <div
      className={`splash${ready ? ' ready' : ''}${leaving ? ' leaving' : ''}`}
      role="status"
      aria-label="Cargando Frank Salmón"
      style={{ '--splash-ms': `${SHOW_MS - 300}ms`, '--splash-total': `${SHOW_MS}ms` }}
    >
      <div className="splash-logo">
        <img className="splash-base" src={logo} alt="" aria-hidden="true" />
        <img
          ref={imgRef}
          className="splash-fill"
          src={logo}
          alt="Frank Salmón"
          onLoad={() => setReady(true)}
        />
      </div>
      <div className="splash-bar" aria-hidden="true"><span /></div>
    </div>
  );
}