import React, { useEffect, useRef, useState } from 'react';
import logo from '../assets/logo-frank-salmon.png';
import './Loading.css';

/* Frases según la dirección: entrando al panel o volviendo al login */
const PHRASES = {
  in: ['Revisando la pesca del día', 'Verificando la trazabilidad', 'Poniendo la mesa'],
  out: ['Cerrando tu sesión', 'Guardando tus cambios', 'Hasta pronto'],
};

const STEP_MS = 850;
const FADE_MS = 300;

/**
 * mode: 'in' | 'out'
 * onCovered: se llama cuando empieza el fundido de salida (ya se puede cambiar
 *            la pantalla de fondo sin que se note)
 * onDone: se llama al terminar y desmontar la pantalla de carga
 */
export default function Loading({ mode = 'in', onCovered, onDone }) {
  const phrases = PHRASES[mode] || PHRASES.in;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fillMs = STEP_MS * phrases.length;
  const total = reduce ? 900 : fillMs + FADE_MS;

  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);

  // Guardamos los callbacks en refs para que los temporizadores no se reinicien
  const covered = useRef(onCovered);
  const done = useRef(onDone);
  covered.current = onCovered;
  done.current = onDone;

  useEffect(() => {
    const timers = [];
    for (let i = 1; i < phrases.length; i += 1) {
      timers.push(setTimeout(() => setStep(i), i * STEP_MS));
    }
    timers.push(
      setTimeout(() => {
        if (covered.current) covered.current();
        setLeaving(true);
      }, total - FADE_MS)
    );
    timers.push(setTimeout(() => done.current && done.current(), total));
    return () => timers.forEach(clearTimeout);
  }, [phrases, total]);

  return (
    <div
      className={`loading${leaving ? ' leaving' : ''}`}
      role="status"
      aria-live="polite"
      style={{ '--fill': `${fillMs}ms` }}
    >
      {/* El logo real "se dibuja" de izquierda a derecha, como una firma */}
      <div className="logo-wrap">
        <img className="logo-base" src={logo} alt="" aria-hidden="true" />
        <img className="logo-fill" src={logo} alt="Frank Salmón" />
      </div>

      <div className="bar" aria-hidden="true"><span /></div>
      <p className="phrase" key={step}>{phrases[step]}</p>
    </div>
  );
}