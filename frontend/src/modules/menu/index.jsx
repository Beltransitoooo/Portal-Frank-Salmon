import React, { useEffect, useState } from 'react';
import ModuleHeader from '../../components/Moduleheader';
import KebabMenu from '../../components/Kebabmenu';
import Modal from '../../components/Modal';
import { SkeletonList } from '../../components/Skeleton';
import PlatilloModal from './components/PlatilloModal';
import { SECCIONES, nombreSeccion, ordenSeccion, precioMXN } from './secciones';
import { borrarPlatillo, editarPlatillo, recargarMenu, useMenu, useMenuEstado } from './store';
import './menu.css';

const TODAS = '__todas';

const Ico = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;
const ICON_EDITAR = <Ico><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z" /><path d="M13.5 8.5l3 3" /></Ico>;
const ICON_BORRAR = <Ico><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Ico>;
const ICON_PAUSA = <Ico><circle cx="12" cy="12" r="9" /><path d="M10 9v6M14 9v6" /></Ico>;
const ICON_OK = <Ico><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.8" /></Ico>;

/* Quita acentos para buscar «camaron» y encontrar «Camarón» */
const plano = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Menu({ onBack }) {
  const platillos = useMenu();
  const estado = useMenuEstado();
  const [busca, setBusca] = useState('');
  const [sec, setSec] = useState(TODAS);
  const [modal, setModal] = useState(null); // { tipo: 'agregar' } | { tipo: 'editar', id } | { tipo: 'borrar', id }
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Solo se ofrecen como filtro las secciones que ya tienen platillos, en el orden del menú
  const conPlatillos = SECCIONES.filter((s) => platillos.some((p) => p.seccion === s.id));
  const secActiva = sec === TODAS || conPlatillos.some((s) => s.id === sec) ? sec : TODAS;

  const q = plano(busca.trim());
  const visibles = platillos
    .filter((p) => secActiva === TODAS || p.seccion === secActiva)
    .filter((p) => !q || plano(p.nombre).includes(q) || plano(p.descripcion).includes(q))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const grupos = [...new Set(visibles.map((p) => p.seccion))]
    .sort((a, b) => ordenSeccion(a) - ordenSeccion(b))
    .map((id) => ({ id, nombre: nombreSeccion(id), items: visibles.filter((p) => p.seccion === id) }));

  const editando = modal?.tipo === 'editar' ? platillos.find((p) => p.id === modal.id) : null;
  const aBorrar = modal?.tipo === 'borrar' ? platillos.find((p) => p.id === modal.id) : null;
  const noDisponibles = platillos.filter((p) => !p.disponible).length;

  const cambiarDisponible = (p) => {
    editarPlatillo(p.id, { disponible: !p.disponible });
    setToast(p.disponible ? `${p.nombre} quedó como no disponible.` : `${p.nombre} está disponible otra vez.`);
  };

  return (
    <div className="mod mnu">
      <ModuleHeader
        title="Menú"
        subtitle="Platillos, precios y secciones del restaurante"
        onBack={onBack}
        onRefresh={recargarMenu}
      />

      <div className="mnu-tools">
        <label className="mnu-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar platillo"
            aria-label="Buscar platillo"
          />
        </label>
        <button type="button" className="mnu-agregar" onClick={() => setModal({ tipo: 'agregar' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Agregar platillo
        </button>
      </div>

      {estado === 'listo' && conPlatillos.length > 0 && (
        <div className="mnu-cats" role="group" aria-label="Filtrar por sección">
          {[{ id: TODAS, nombre: 'Todas' }, ...conPlatillos].map((s) => (
            <button key={s.id} type="button" aria-pressed={secActiva === s.id} onClick={() => setSec(s.id)}>
              {s.nombre}
            </button>
          ))}
        </div>
      )}

      {estado === 'listo' && platillos.length > 0 && (
        <p className="mnu-resumen">
          <b>{platillos.length}</b> {platillos.length === 1 ? 'platillo' : 'platillos'} en <b>{conPlatillos.length}</b>{' '}
          {conPlatillos.length === 1 ? 'sección' : 'secciones'}
          {noDisponibles > 0 && <> · <span className="mnu-off-txt">{noDisponibles} no {noDisponibles === 1 ? 'disponible' : 'disponibles'}</span></>}
        </p>
      )}

      {estado === 'cargando' && <SkeletonList count={5} />}

      {estado === 'error' && (
        <div className="mnu-empty" role="alert">
          <b>No hay conexión con el servidor</b>
          <p>Revisa tu conexión; el menú aparecerá en cuanto se recupere.</p>
        </div>
      )}

      {estado === 'listo' && platillos.length === 0 && (
        <div className="mnu-empty">
          <b>Todavía no hay platillos</b>
          <p>Usa «Agregar platillo» para armar el menú por secciones: tostadas, tacos, aguachiles…</p>
        </div>
      )}

      {estado === 'listo' && platillos.length > 0 && visibles.length === 0 && (
        <div className="mnu-empty">
          <b>Sin resultados</b>
          <p>No hay platillos que coincidan con «{busca.trim()}».</p>
        </div>
      )}

      {estado === 'listo' && grupos.map((g) => (
        <section className="mnu-grupo" key={g.id} aria-label={g.nombre}>
          <h2>{g.nombre} <span>{g.items.length}</span></h2>
          <ul className="mnu-lista">
            {g.items.map((p) => (
              <li key={p.id} className={`mnu-item${p.disponible ? '' : ' off'}`}>
                <div className="mnu-main">
                  <h3>{p.nombre}</h3>
                  {p.descripcion && <p>{p.descripcion}</p>}
                  {!p.disponible && <span className="mnu-off-tag">No disponible</span>}
                </div>
                <b className="mnu-precio">{precioMXN(p.precio)}</b>
                <KebabMenu
                  label={`Opciones de ${p.nombre}`}
                  items={[
                    { id: 'editar', label: 'Editar', icon: ICON_EDITAR, onSelect: () => setModal({ tipo: 'editar', id: p.id }) },
                    {
                      id: 'disp',
                      label: p.disponible ? 'Marcar no disponible' : 'Marcar disponible',
                      icon: p.disponible ? ICON_PAUSA : ICON_OK,
                      onSelect: () => cambiarDisponible(p),
                    },
                    { id: 'borrar', label: 'Borrar', icon: ICON_BORRAR, peligro: true, onSelect: () => setModal({ tipo: 'borrar', id: p.id }) },
                  ]}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {(modal?.tipo === 'agregar' || editando) && (
        <PlatilloModal
          platillo={editando}
          seccionInicial={secActiva === TODAS ? '' : secActiva}
          onClose={() => setModal(null)}
          onSaved={(accion, nombre) => {
            setModal(null);
            setToast(accion === 'agregado' ? `Se agregó ${nombre}.` : `Se guardaron los cambios de ${nombre}.`);
          }}
        />
      )}

      {aBorrar && (
        <Modal title="Borrar platillo" subtitle={`${aBorrar.nombre} · ${nombreSeccion(aBorrar.seccion)}`} onClose={() => setModal(null)}>
          <p className="mnu-confirma">
            Se borrará para siempre del menú en todos los dispositivos. Si solo se acabó por hoy, mejor márcalo como no disponible.
          </p>
          <div className="mnu-actions">
            <button type="button" className="mnu-btn ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button
              type="button"
              className="mnu-btn"
              onClick={() => { borrarPlatillo(aBorrar.id); setModal(null); setToast(`Se borró ${aBorrar.nombre}.`); }}
            >
              Sí, borrar
            </button>
          </div>
        </Modal>
      )}

      {toast && <div className="mnu-toast" role="status">{toast}</div>}
    </div>
  );
}
