import React, { useState } from 'react';
import ModuleHeader from '../components/Moduleheader';
import { api } from '../lib/api';
import { roleLabel, useSesion } from '../lib/sesion';
import { formatMomento } from '../modules/fechas';
import './Perfil.css';

/* Datos de la cuenta con la que se inició sesión, cambio de contraseña y salida */
export default function Perfil({ onBack, onLogout }) {
  const { usuario, actualizarSesion } = useSesion();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirma, setConfirma] = useState('');
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  if (!usuario) return null;
  const admin = usuario.rol === 'admin';

  const cambia = (set) => (e) => { set(e.target.value); setError(''); setListo(false); };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    if (!actual) return setError('Escribe tu contraseña actual.');
    if (nueva.length < 8) return setError('La nueva contraseña debe tener al menos 8 caracteres.');
    if (nueva !== confirma) return setError('Las dos contraseñas nuevas no coinciden.');
    setGuardando(true);
    try {
      const sesion = await api('/auth/cambiar-password', { method: 'POST', body: { actual, nueva } });
      actualizarSesion(sesion); // la sesión nueva sigue abierta; las demás se cierran
      setActual(''); setNueva(''); setConfirma('');
      setListo(true);
    } catch (err) {
      setError(err.detalle || 'No se pudo cambiar la contraseña. Revisa tu conexión.');
    }
    setGuardando(false);
    return undefined;
  };

  return (
    <div className="mod perfil">
      <ModuleHeader title="Perfil" subtitle="Tu cuenta en el portal" onBack={onBack} />

      <section className="perfil-ficha" aria-label="Datos de la cuenta">
        <span className="perfil-av" aria-hidden="true">{usuario.nombre.charAt(0).toUpperCase()}</span>
        <div className="perfil-nombre">
          <h2>{usuario.nombre}</h2>
          <p>@{usuario.usuario}</p>
          <span className={`lst-tag ${admin ? 'naranja' : ''}`}>{roleLabel(usuario.rol)}</span>
        </div>
      </section>

      <dl className="lst-dl perfil-datos">
        <div><dt>Usuario</dt><dd>{usuario.usuario}</dd></div>
        <div><dt>Rol</dt><dd>{admin ? 'Administrador: consulta y modifica' : 'Solo consulta: puede ver, no modificar'}</dd></div>
        {usuario.ultimoAcceso && <div><dt>Último acceso</dt><dd>{formatMomento(usuario.ultimoAcceso)}</dd></div>}
        {usuario.creadoEn && <div><dt>Cuenta creada</dt><dd>{formatMomento(usuario.creadoEn)}</dd></div>}
      </dl>

      <section className="lst-grupo perfil-seccion" aria-labelledby="perfil-pass">
        <h2 id="perfil-pass">Cambiar contraseña</h2>
        <form className="frm perfil-form" onSubmit={cambiarPassword} noValidate>
          <label className="fld">
            <span>Contraseña actual</span>
            <input type="password" value={actual} onChange={cambia(setActual)} autoComplete="current-password" />
          </label>
          <div className="frm-row2 mitad">
            <label className="fld">
              <span>Nueva (mínimo 8 caracteres)</span>
              <input type="password" value={nueva} onChange={cambia(setNueva)} autoComplete="new-password" />
            </label>
            <label className="fld">
              <span>Repite la nueva</span>
              <input type="password" value={confirma} onChange={cambia(setConfirma)} autoComplete="new-password" />
            </label>
          </div>
          {error && <p className="frm-error" role="alert">{error}</p>}
          {listo && <p className="perfil-ok" role="status">Listo: tu contraseña cambió. Las demás sesiones abiertas se cerraron.</p>}
          <div className="lst-actions">
            <button type="submit" className="lst-btn" disabled={guardando}>{guardando ? 'Guardando…' : 'Cambiar contraseña'}</button>
          </div>
        </form>
      </section>

      <section className="lst-grupo perfil-seccion" aria-labelledby="perfil-salir">
        <h2 id="perfil-salir">Sesión</h2>
        <p className="perfil-nota">Tu sesión dura 12 horas. Si usas un equipo compartido, ciérrala al terminar.</p>
        <button type="button" className="lst-btn peligro perfil-salir" onClick={onLogout}>Cerrar sesión</button>
      </section>
    </div>
  );
}
