import React, { useCallback, useEffect, useState } from 'react';
import KebabMenu from '../components/Kebabmenu';
import Modal from '../components/Modal';
import { SkeletonList } from '../components/Skeleton';
import { api } from '../lib/api';
import { roleLabel, useSesion } from '../lib/sesion';
import { haceCuanto } from '../modules/fechas';

const Ico = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;
const ICON_EDITAR = <Ico><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z" /><path d="M13.5 8.5l3 3" /></Ico>;
const ICON_LLAVE = <Ico><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l3 3M15 8l2 2" /></Ico>;
const ICON_PAUSA = <Ico><circle cx="12" cy="12" r="9" /><path d="M10 9v6M14 9v6" /></Ico>;
const ICON_OK = <Ico><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.8" /></Ico>;

const ROLES = [
  { id: 'basico', nombre: 'Solo consulta', ayuda: 'Puede ver todos los módulos, no modificar.' },
  { id: 'admin', nombre: 'Administrador', ayuda: 'Consulta, modifica y gestiona usuarios.' },
];

/* Contraseña temporal fácil de dictar: sin letras que se confunden (l, 1, O, 0) */
function temporal() {
  const letras = 'abcdefghjkmnpqrstuvwxyz23456789';
  const n = new Uint32Array(10);
  window.crypto.getRandomValues(n);
  const t = [...n].map((x) => letras[x % letras.length]).join('');
  return `${t.slice(0, 5)}-${t.slice(5)}`;
}

const bloqueado = (u) => u.bloqueadoHasta && new Date(u.bloqueadoHasta) > new Date();

/* Sección «Usuarios» del perfil (solo administrador) */
export default function Usuarios() {
  const { usuario: yo } = useSesion();
  const [lista, setLista] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { tipo: 'agregar' | 'editar' | 'restablecer' | 'desactivar', u? }
  const [temporalNueva, setTemporalNueva] = useState(null); // { usuario, password } para mostrarla una vez
  const [toast, setToast] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setLista(await api('/usuarios'));
      setError('');
    } catch (err) {
      if (err.status !== 401) setError(err.detalle || 'No se pudo cargar la lista de usuarios.');
    }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const cambiarActivo = async (u, activo) => {
    try {
      await api(`/usuarios/${encodeURIComponent(u.id)}`, { method: 'PATCH', body: { activo } });
      setModal(null);
      setToast(activo ? `${u.nombre} puede entrar otra vez.` : `${u.nombre} quedó desactivado y su sesión se cerró.`);
      cargar();
    } catch (err) {
      setModal(null);
      setToast(err.detalle || 'No se pudo cambiar la cuenta.');
    }
  };

  const ordenados = (lista || []).slice().sort((a, b) => (b.activo - a.activo) || a.nombre.localeCompare(b.nombre, 'es'));
  const activos = (lista || []).filter((u) => u.activo).length;

  return (
    <section className="lst-grupo perfil-seccion" aria-labelledby="perfil-usuarios">
      <h2 id="perfil-usuarios">Usuarios {lista && <span>{lista.length}</span>}</h2>

      <div className="lst-tools">
        <p className="perfil-nota">Crea las cuentas de tu equipo. Cada persona cambia su contraseña temporal la primera vez que entra.</p>
        <button type="button" className="lst-agregar" onClick={() => setModal({ tipo: 'agregar' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Agregar usuario
        </button>
      </div>

      {lista && (
        <p className="lst-resumen">
          <span><b>{activos}</b> {activos === 1 ? 'cuenta activa' : 'cuentas activas'}
            {lista.length > activos && <> · <span className="lst-alerta">{lista.length - activos} {lista.length - activos === 1 ? 'desactivada' : 'desactivadas'}</span></>}
          </span>
        </p>
      )}

      {!lista && !error && <SkeletonList count={2} />}
      {error && <div className="lst-empty" role="alert"><b>Sin conexión</b><p>{error}</p></div>}

      {lista && (
        <ul className="lst-lista">
          {ordenados.map((u) => {
            const propio = u.id === yo?.id;
            const acciones = [
              { id: 'editar', label: 'Editar', icon: ICON_EDITAR, onSelect: () => setModal({ tipo: 'editar', u }) },
              { id: 'restablecer', label: 'Restablecer contraseña', icon: ICON_LLAVE, onSelect: () => setModal({ tipo: 'restablecer', u }) },
            ];
            if (!propio) {
              acciones.push(u.activo
                ? { id: 'desactivar', label: 'Desactivar cuenta', icon: ICON_PAUSA, peligro: true, onSelect: () => setModal({ tipo: 'desactivar', u }) }
                : { id: 'reactivar', label: 'Reactivar cuenta', icon: ICON_OK, onSelect: () => cambiarActivo(u, true) });
            }
            return (
              <li key={u.id} className={`lst-item${u.activo ? '' : ' off'}`}>
                <span className="col-inicial" aria-hidden="true">{u.nombre.charAt(0).toUpperCase()}</span>
                <div className="lst-main">
                  <h3>{u.nombre}{propio && <small className="perfil-tu"> (tú)</small>}</h3>
                  <p>@{u.usuario} · {u.ultimoAcceso ? `entró ${haceCuanto(u.ultimoAcceso)}` : 'aún no entra'}</p>
                  <span className={`lst-tag ${u.rol === 'admin' ? 'naranja' : ''}`}>{roleLabel(u.rol)}</span>
                  {!u.activo && <span className="lst-tag alerta"> Desactivada</span>}
                  {u.activo && bloqueado(u) && <span className="lst-tag alerta"> Bloqueada 15 min</span>}
                  {u.activo && u.debeCambiarPassword && !propio && <span className="lst-tag"> Contraseña temporal</span>}
                </div>
                <KebabMenu label={`Opciones de ${u.nombre}`} items={acciones} />
              </li>
            );
          })}
        </ul>
      )}

      {(modal?.tipo === 'agregar' || modal?.tipo === 'editar') && (
        <UsuarioModal
          u={modal.u}
          propio={modal.u?.id === yo?.id}
          onClose={() => setModal(null)}
          onSaved={(guardado, password) => {
            setModal(null);
            cargar();
            if (password) setTemporalNueva({ usuario: guardado.usuario, nombre: guardado.nombre, password });
            else setToast(`Se guardaron los cambios de ${guardado.nombre}.`);
          }}
        />
      )}

      {modal?.tipo === 'restablecer' && (
        <RestablecerModal
          u={modal.u}
          onClose={() => setModal(null)}
          onSaved={(u, password) => { setModal(null); cargar(); setTemporalNueva({ usuario: u.usuario, nombre: u.nombre, password }); }}
        />
      )}

      {modal?.tipo === 'desactivar' && (
        <Modal title="Desactivar cuenta" subtitle={`${modal.u.nombre} · @${modal.u.usuario}`} onClose={() => setModal(null)}>
          <p className="lst-confirma">
            Ya no podrá entrar al portal y su sesión abierta se cerrará. Sus datos no se borran: puedes reactivarla cuando quieras.
          </p>
          <div className="lst-actions">
            <button type="button" className="lst-btn ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button type="button" className="lst-btn" onClick={() => cambiarActivo(modal.u, false)}>Sí, desactivar</button>
          </div>
        </Modal>
      )}

      {temporalNueva && (
        <Modal title="Contraseña temporal" subtitle={`${temporalNueva.nombre} · @${temporalNueva.usuario}`} onClose={() => setTemporalNueva(null)}>
          <p className="lst-confirma">
            Compártela con la persona en privado. Al entrar con ella, el portal le pedirá crear su propia contraseña.
            No se volverá a mostrar.
          </p>
          <p className="perfil-temporal"><code>{temporalNueva.password}</code></p>
          <div className="lst-actions">
            <button
              type="button"
              className="lst-btn ghost"
              onClick={() => {
                navigator.clipboard?.writeText(temporalNueva.password).then(
                  () => setToast('Contraseña copiada.'),
                  () => setToast('No se pudo copiar; anótala a mano.'),
                );
              }}
            >
              Copiar
            </button>
            <button type="button" className="lst-btn" onClick={() => setTemporalNueva(null)}>Listo</button>
          </div>
        </Modal>
      )}

      {toast && <div className="lst-toast" role="status"><span>{toast}</span></div>}
    </section>
  );
}

/* Alta o edición de una cuenta. Al crearla se le asigna una contraseña temporal. */
function UsuarioModal({ u, propio, onClose, onSaved }) {
  const editando = Boolean(u);
  const [nombre, setNombre] = useState(u?.nombre ?? '');
  const [usuario, setUsuario] = useState(u?.usuario ?? '');
  const [rol, setRol] = useState(u?.rol ?? 'basico');
  const [password] = useState(temporal);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const cambia = (set) => (e) => { set(e.target.value); setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return setError('Escribe el nombre de la persona.');
    if (!editando && !/^[a-z0-9._-]{3,40}$/.test(usuario.trim().toLowerCase())) {
      return setError('El usuario lleva de 3 a 40 letras minúsculas, números, punto, guion o guion bajo (sin espacios).');
    }
    setGuardando(true);
    try {
      if (editando) {
        const body = { nombre };
        if (!propio) body.rol = rol;
        onSaved(await api(`/usuarios/${encodeURIComponent(u.id)}`, { method: 'PATCH', body }));
      } else {
        const nuevo = await api('/usuarios', { method: 'POST', body: { nombre, usuario: usuario.trim().toLowerCase(), rol, password } });
        onSaved(nuevo, password);
      }
    } catch (err) {
      setError(err.detalle || 'No se pudo guardar. Revisa tu conexión.');
      setGuardando(false);
    }
    return undefined;
  };

  return (
    <Modal title={editando ? 'Editar usuario' : 'Agregar usuario'} subtitle={editando ? `@${u.usuario}` : 'Cuenta nueva para el portal'} onClose={onClose}>
      <form className="frm" onSubmit={submit} noValidate>
        <label className="fld">
          <span>Nombre</span>
          <input value={nombre} maxLength={120} onChange={cambia(setNombre)} autoFocus />
        </label>
        {!editando && (
          <label className="fld">
            <span>Usuario para entrar</span>
            <input
              value={usuario}
              maxLength={40}
              onChange={cambia(setUsuario)}
              placeholder="ej. gerente.culiacan"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </label>
        )}
        <div className="fld">
          <span>Rol</span>
          <div className="perfil-roles" role="radiogroup" aria-label="Rol">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={rol === r.id}
                className={rol === r.id ? 'on' : ''}
                disabled={propio}
                onClick={() => { setRol(r.id); setError(''); }}
              >
                <b>{r.nombre}</b>
                <small>{r.ayuda}</small>
              </button>
            ))}
          </div>
          {propio && <p className="perfil-nota perfil-nota-chica">No puedes cambiar tu propio rol.</p>}
        </div>
        {!editando && (
          <p className="perfil-nota perfil-nota-chica">Al guardar te mostraré una contraseña temporal para compartirla con la persona.</p>
        )}
        {error && <p className="frm-error" role="alert">{error}</p>}
        <div className="lst-actions">
          <button type="button" className="lst-btn ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="lst-btn" disabled={guardando}>
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* Pone una contraseña temporal nueva (por si la persona la olvidó o quedó bloqueada) */
function RestablecerModal({ u, onClose, onSaved }) {
  const [password] = useState(temporal);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const confirmar = async () => {
    setGuardando(true);
    try {
      const guardado = await api(`/usuarios/${encodeURIComponent(u.id)}/restablecer`, { method: 'POST', body: { password } });
      onSaved(guardado, password);
    } catch (err) {
      setError(err.detalle || 'No se pudo restablecer. Revisa tu conexión.');
      setGuardando(false);
    }
  };

  return (
    <Modal title="Restablecer contraseña" subtitle={`${u.nombre} · @${u.usuario}`} onClose={onClose}>
      <p className="lst-confirma">
        Se le asignará una contraseña temporal nueva, se quitará el bloqueo si lo tiene y se cerrará su sesión abierta.
      </p>
      {error && <p className="frm-error" role="alert">{error}</p>}
      <div className="lst-actions">
        <button type="button" className="lst-btn ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="lst-btn" onClick={confirmar} disabled={guardando}>{guardando ? 'Restableciendo…' : 'Restablecer'}</button>
      </div>
    </Modal>
  );
}
