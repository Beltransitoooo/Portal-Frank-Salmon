import React, { useEffect, useState } from 'react';
import ModuleHeader from '../../components/Moduleheader';
import KebabMenu from '../../components/Kebabmenu';
import Modal from '../../components/Modal';
import { SkeletonList } from '../../components/Skeleton';
import ColaboradorModal from './components/ColaboradorModal';
import { AREAS, antiguedad, nombreArea, nombreTurno, ordenArea } from './areas';
import {
  borrarColaborador, editarColaborador, recargarColaboradores, useColaboradores, useColaboradoresEstado,
} from './store';
import './colaboradores.css';

const TODAS = '__todas';

const Ico = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;
const ICON_EDITAR = <Ico><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z" /><path d="M13.5 8.5l3 3" /></Ico>;
const ICON_BORRAR = <Ico><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Ico>;
const ICON_PAUSA = <Ico><circle cx="12" cy="12" r="9" /><path d="M10 9v6M14 9v6" /></Ico>;
const ICON_OK = <Ico><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.8" /></Ico>;

/* Quita acentos para buscar «jose» y encontrar «José» */
const plano = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Colaboradores({ onBack }) {
  const gente = useColaboradores();
  const estado = useColaboradoresEstado();
  const [busca, setBusca] = useState('');
  const [area, setArea] = useState(TODAS);
  const [modal, setModal] = useState(null); // { tipo: 'agregar' } | { tipo: 'editar', id } | { tipo: 'borrar', id }
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Solo se ofrecen como filtro las áreas que ya tienen gente, en el orden fijo
  const conGente = AREAS.filter((a) => gente.some((c) => c.area === a.id));
  const areaActiva = area === TODAS || conGente.some((a) => a.id === area) ? area : TODAS;

  const q = plano(busca.trim());
  const visibles = gente
    .filter((c) => areaActiva === TODAS || c.area === areaActiva)
    .filter((c) => !q || plano(c.nombre).includes(q) || plano(c.puesto).includes(q))
    // Dentro de cada área, los activos primero
    .sort((a, b) => (a.activo === false) - (b.activo === false) || a.nombre.localeCompare(b.nombre, 'es'));

  const grupos = [...new Set(visibles.map((c) => c.area))]
    .sort((a, b) => ordenArea(a) - ordenArea(b))
    .map((id) => ({ id, nombre: nombreArea(id), items: visibles.filter((c) => c.area === id) }));

  const activos = gente.filter((c) => c.activo !== false).length;
  const bajas = gente.length - activos;
  const editando = modal?.tipo === 'editar' ? gente.find((c) => c.id === modal.id) : null;
  const aBorrar = modal?.tipo === 'borrar' ? gente.find((c) => c.id === modal.id) : null;

  const cambiarActivo = (c) => {
    const activo = c.activo === false;
    editarColaborador(c.id, { activo });
    setToast(activo ? `${c.nombre} está activo otra vez.` : `${c.nombre} quedó dado de baja.`);
  };

  return (
    <div className="mod col">
      <ModuleHeader
        title="Colaboradores"
        subtitle="Tu equipo por área: puesto, turno y antigüedad"
        onBack={onBack}
        onRefresh={recargarColaboradores}
      />

      <div className="lst-tools">
        <label className="lst-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nombre o puesto"
            aria-label="Buscar por nombre o puesto"
          />
        </label>
        <button type="button" className="lst-agregar" onClick={() => setModal({ tipo: 'agregar' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Agregar colaborador
        </button>
      </div>

      {estado === 'listo' && conGente.length > 0 && (
        <div className="lst-cats" role="group" aria-label="Filtrar por área">
          {[{ id: TODAS, nombre: 'Todas' }, ...conGente].map((a) => (
            <button key={a.id} type="button" aria-pressed={areaActiva === a.id} onClick={() => setArea(a.id)}>
              {a.nombre}
            </button>
          ))}
        </div>
      )}

      {estado === 'listo' && gente.length > 0 && (
        <p className="lst-resumen">
          <span>
            <b>{activos}</b> {activos === 1 ? 'activo' : 'activos'} en <b>{conGente.length}</b>{' '}
            {conGente.length === 1 ? 'área' : 'áreas'}
            {bajas > 0 && <> · <span className="lst-alerta">{bajas} de baja</span></>}
          </span>
        </p>
      )}

      {estado === 'cargando' && <SkeletonList count={5} />}

      {estado === 'error' && (
        <div className="lst-empty" role="alert">
          <b>No hay conexión con el servidor</b>
          <p>Revisa tu conexión; el equipo aparecerá en cuanto se recupere.</p>
        </div>
      )}

      {estado === 'listo' && gente.length === 0 && (
        <div className="lst-empty">
          <b>Todavía no hay colaboradores</b>
          <p>Usa «Agregar colaborador» para registrar a tu equipo por área: barras, caja, meseros, gerentes y dueños.</p>
        </div>
      )}

      {estado === 'listo' && gente.length > 0 && visibles.length === 0 && (
        <div className="lst-empty">
          <b>Sin resultados</b>
          <p>No hay colaboradores que coincidan con «{busca.trim()}».</p>
        </div>
      )}

      {estado === 'listo' && grupos.map((g) => (
        <section className="lst-grupo" key={g.id} aria-label={g.nombre}>
          <h2>{g.nombre} <span>{g.items.length}</span></h2>
          <ul className="lst-lista">
            {g.items.map((c) => {
              const activo = c.activo !== false;
              const ant = antiguedad(c.fechaIngreso);
              const detalle = [c.puesto, nombreTurno(c.turno) && `Turno ${nombreTurno(c.turno).toLowerCase()}`]
                .filter(Boolean).join(' · ');
              return (
                <li key={c.id} className={`lst-item${activo ? '' : ' off'}`}>
                  <span className="col-inicial" aria-hidden="true">{c.nombre.charAt(0).toUpperCase()}</span>
                  <div className="lst-main">
                    <h3>{c.nombre}</h3>
                    <p>{detalle || 'Sin puesto ni turno'}</p>
                    {!activo && <span className="lst-tag alerta">Baja</span>}
                  </div>
                  {ant && (
                    <div className="lst-cifra" title="Antigüedad">
                      <b>{ant.num}</b>
                      {ant.unidad && <span>{ant.unidad}</span>}
                    </div>
                  )}
                  <KebabMenu
                    label={`Opciones de ${c.nombre}`}
                    items={[
                      { id: 'editar', label: 'Editar', icon: ICON_EDITAR, onSelect: () => setModal({ tipo: 'editar', id: c.id }) },
                      {
                        id: 'activo',
                        label: activo ? 'Dar de baja' : 'Reactivar',
                        icon: activo ? ICON_PAUSA : ICON_OK,
                        onSelect: () => cambiarActivo(c),
                      },
                      { id: 'borrar', label: 'Borrar', icon: ICON_BORRAR, peligro: true, onSelect: () => setModal({ tipo: 'borrar', id: c.id }) },
                    ]}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {(modal?.tipo === 'agregar' || editando) && (
        <ColaboradorModal
          colaborador={editando}
          areaInicial={areaActiva === TODAS ? '' : areaActiva}
          onClose={() => setModal(null)}
          onSaved={(accion, nombre) => {
            setModal(null);
            setToast(accion === 'agregado' ? `Se agregó a ${nombre}.` : `Se guardaron los cambios de ${nombre}.`);
          }}
        />
      )}

      {aBorrar && (
        <Modal title="Borrar colaborador" subtitle={`${aBorrar.nombre} · ${nombreArea(aBorrar.area)}`} onClose={() => setModal(null)}>
          <p className="lst-confirma">
            Úsalo solo si se capturó por error: se borrará para siempre. Si la persona dejó de trabajar, mejor dala de baja.
          </p>
          <div className="lst-actions">
            <button type="button" className="lst-btn ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button
              type="button"
              className="lst-btn"
              onClick={() => { borrarColaborador(aBorrar.id); setModal(null); setToast(`Se borró a ${aBorrar.nombre}.`); }}
            >
              Sí, borrar
            </button>
          </div>
        </Modal>
      )}

      {toast && <div className="lst-toast" role="status"><span>{toast}</span></div>}
    </div>
  );
}
