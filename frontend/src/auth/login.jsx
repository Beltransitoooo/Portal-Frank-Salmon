import React from 'react';
import logo from '../assets/logo-frank-salmon.png';
import './login.css';

/* Genera una ola continua que se repite cada `period` px */
const wavePath = (y, amp, width = 2400, period = 200) => {
  let d = `M0 ${y}`;
  for (let x = 0; x < width; x += period) {
    d += ` q${period / 4} ${-amp} ${period / 2} 0 t${period / 2} 0`;
  }
  return d;
};

const WAVES = [
  { y: 120, amp: 38, dur: 46, op: 0.06 },
  { y: 230, amp: 30, dur: 38, op: 0.09 },
  { y: 340, amp: 42, dur: 54, op: 0.06 },
  { y: 450, amp: 34, dur: 42, op: 0.1 },
  { y: 560, amp: 40, dur: 60, op: 0.07 },
  { y: 670, amp: 32, dur: 36, op: 0.11 },
];

const IconArrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" />
  </svg>
);
const IconUser = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></svg>
);

export default function Login({ onLoginSuccess }) {
  return (
    <div className="login">
      {/* ---------- Lado del formulario ---------- */}
      <section className="login-side">
        <div className="login-bar">
          <span className="status"><i />Servidor activo</span>
          <span className="version">v1.0.0</span>
        </div>

        <div className="login-card">
          <img className="login-logo" src={logo} alt="Frank Salmón" />
          <h1>Bienvenido</h1>
          <p className="sub">Portal de gestión y operaciones</p>

          <button type="button" className="btn-primary" onClick={() => onLoginSuccess('admin')}>
            <IconShield />
            <span>Ingresar como administrador</span>
            <IconArrow />
          </button>

          <div className="or"><span>o</span></div>

          <button type="button" className="btn-ghost" onClick={() => onLoginSuccess('basic')}>
            <IconUser />
            <span>Acceso básico</span>
          </button>

          <p className="secure">Acceso seguro · Sesión corporativa</p>
        </div>

        <p className="login-foot">© Frank Salmón 2026 ®</p>
      </section>

      {/* ---------- Lado visual ---------- */}
      <section className="login-hero">
        <svg className="waves" viewBox="0 0 2400 800" preserveAspectRatio="xMinYMid slice" aria-hidden="true">
          {WAVES.map((w, i) => (
            <path
              key={i}
              d={wavePath(w.y, w.amp)}
              className="wave"
              style={{ opacity: w.op, animationDuration: `${w.dur}s` }}
            />
          ))}
        </svg>

        <div className="hero-body">
          <span className="pill">Portal de gestión de logística y trazabilidad</span>
          <h2>Frescura y tradición, desde Culiacán hasta tu mesa.</h2>
        </div>

        <div className="hero-foot">
          <span className="conn"><i />Conectado a FastAPI &amp; PostgreSQL</span>
          <span>FRANK SALMÓN © 2026</span>
        </div>
      </section>
    </div>
  );
}