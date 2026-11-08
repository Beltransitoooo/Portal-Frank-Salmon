import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
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

const IconOjo = ({ abierto }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
    {!abierto && <path d="M4 4l16 16" />}
  </svg>
);

/* Mensaje claro para cada error del servidor */
const mensajeDe = (err) => {
  if (err.detalle) return err.detalle;
  if (err.status) return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
  return 'No hay conexión con el servidor. Revisa tu internet.';
};

export default function Login({ onLoginSuccess, aviso }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [servidor, setServidor] = useState('revisando'); // revisando | activo | caido
  // Paso 2: el primer acceso pide crear una contraseña propia
  const [pendiente, setPendiente] = useState(null); // sesión que debe cambiar contraseña
  const [nueva, setNueva] = useState('');
  const [confirma, setConfirma] = useState('');

  useEffect(() => {
    let vivo = true;
    fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')}/health`)
      .then((r) => vivo && setServidor(r.ok ? 'activo' : 'caido'))
      .catch(() => vivo && setServidor('caido'));
    return () => { vivo = false; };
  }, []);

  const entrar = async (e) => {
    e.preventDefault();
    if (!usuario.trim() || !password) return setError('Escribe tu usuario y tu contraseña.');
    setError('');
    setEnviando(true);
    try {
      const sesion = await api('/auth/login', { method: 'POST', body: { usuario: usuario.trim(), password } });
      if (sesion.usuario.debeCambiarPassword) {
        setPendiente(sesion);
        setEnviando(false);
      } else {
        onLoginSuccess(sesion);
      }
    } catch (err) {
      setError(mensajeDe(err));
      setEnviando(false);
    }
    return undefined;
  };

  const crearPassword = async (e) => {
    e.preventDefault();
    if (nueva.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (nueva !== confirma) return setError('Las dos contraseñas no coinciden.');
    if (nueva === password) return setError('Usa una contraseña distinta a la temporal.');
    setError('');
    setEnviando(true);
    try {
      // La petición necesita el token de esta sesión: se guarda un momento para mandarlo
      localStorage.setItem('fs_sesion', JSON.stringify(pendiente));
      const sesion = await api('/auth/cambiar-password', { method: 'POST', body: { actual: password, nueva } });
      onLoginSuccess(sesion);
    } catch (err) {
      localStorage.removeItem('fs_sesion');
      setError(mensajeDe(err));
      setEnviando(false);
    }
    return undefined;
  };

  return (
    <div className="login">
      {/* ---------- Lado del formulario ---------- */}
      <section className="login-side">
        <div className="login-bar">
          <span className={`status ${servidor}`}>
            <i />
            {servidor === 'activo' ? 'Servidor activo' : servidor === 'caido' ? 'Sin conexión' : 'Conectando…'}
          </span>
          <span className="version">v1.1.0</span>
        </div>

        <div className="login-card">
          <img className="login-logo" src={logo} alt="Frank Salmón" />

          {!pendiente ? (
            <>
              <h1>Bienvenido</h1>
              <p className="sub">Portal de gestión y operaciones</p>

              <form className="login-form" onSubmit={entrar} noValidate>
                {aviso && !error && <p className="login-aviso" role="status">{aviso}</p>}
                <label className="campo">
                  <span>Usuario</span>
                  <span className="campo-in">
                    <IconUser />
                    <input
                      value={usuario}
                      onChange={(e) => { setUsuario(e.target.value); setError(''); }}
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      autoFocus
                    />
                  </span>
                </label>
                <label className="campo">
                  <span>Contraseña</span>
                  <span className="campo-in">
                    <IconShield />
                    <input
                      type={ver ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      autoComplete="current-password"
                    />
                    <button type="button" className="ojo" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      <IconOjo abierto={ver} />
                    </button>
                  </span>
                </label>

                {error && <p className="login-error" role="alert">{error}</p>}

                <button type="submit" className="btn-primary" disabled={enviando}>
                  <span>{enviando ? 'Entrando…' : 'Entrar'}</span>
                  <IconArrow />
                </button>
              </form>
            </>
          ) : (
            <>
              <h1>Crea tu contraseña</h1>
              <p className="sub">Hola, {pendiente.usuario.nombre}. Cambia la contraseña temporal por una tuya.</p>

              <form className="login-form" onSubmit={crearPassword} noValidate>
                <label className="campo">
                  <span>Nueva contraseña (mínimo 8 caracteres)</span>
                  <span className="campo-in">
                    <IconShield />
                    <input
                      type={ver ? 'text' : 'password'}
                      value={nueva}
                      onChange={(e) => { setNueva(e.target.value); setError(''); }}
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button type="button" className="ojo" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      <IconOjo abierto={ver} />
                    </button>
                  </span>
                </label>
                <label className="campo">
                  <span>Repítela</span>
                  <span className="campo-in">
                    <IconShield />
                    <input
                      type={ver ? 'text' : 'password'}
                      value={confirma}
                      onChange={(e) => { setConfirma(e.target.value); setError(''); }}
                      autoComplete="new-password"
                    />
                  </span>
                </label>

                {error && <p className="login-error" role="alert">{error}</p>}

                <button type="submit" className="btn-primary" disabled={enviando}>
                  <span>{enviando ? 'Guardando…' : 'Guardar y entrar'}</span>
                  <IconArrow />
                </button>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => { setPendiente(null); setPassword(''); setNueva(''); setConfirma(''); setError(''); }}
                >
                  Volver
                </button>
              </form>
            </>
          )}

          <p className="secure">Acceso seguro · Sesión de 12 horas</p>
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
          <span className="conn"><i />Conectado a Vercel &amp; Supabase</span>
          <span>FRANK SALMÓN © 2026</span>
        </div>
      </section>
    </div>
  );
}