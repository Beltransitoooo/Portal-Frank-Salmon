import React, { useEffect, useState } from 'react';
import ModuleHeader from '../../components/Moduleheader';
import Modal from '../../components/Modal';
import { SkeletonList } from '../../components/Skeleton';
import { diaDe, rotuloDia } from '../fechas';
import UrgenciaItem from './components/Urgenciaitem';
import DetalleModal from './components/Detallemodal';
import AgregarCompraModal from './components/Agregarmodalcompra';
import { borrarUrgencia, limpiarSurtidos, recargarUrgencias, setEstado, useUrgencias, useUrgenciasEstado } from './store';
import './urgencias.css';

const TABS = [
  { id: 'pendientes', label: 'Pendientes', estado: 'pendiente' },
  { id: 'surtidos', label: 'Surtidos', estado: 'surtido' },
];

/* Quita acentos para buscar «limon» y encontrar «Limón» */
const plano = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const ICON_BASURA = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);

export default function Urgencias({ onBack }) {
  const [tab, setTab] = useState('pendientes');
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(null); // { tipo: 'agregar' } | { tipo: 'detalle', id } | { tipo: 'limpiar' } | { tipo: 'borrar', id }
  const [toast, setToast] = useState(null); // { texto, deshacer? }
  const todas = useUrgencias();
  const estado = useUrgenciasEstado();

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Los más antiguos primero en pendientes (llevan más tiempo esperando); los surtidos, los más recientes
  const pendientes = todas
    .filter((u) => u.estado === 'pendiente')
    .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
  const surtidos = todas
    .filter((u) => u.estado === 'surtido')
    .sort((a, b) => b.surtidoEn.localeCompare(a.surtidoEn));
  const enPestana = tab === 'pendientes' ? pendientes : surtidos;

  const q = plano(busca.trim());
  const lista = enPestana.filter((u) => !q || plano(u.producto).includes(q) || plano(u.notas).includes(q));

  // Agrupadas por día: cuándo se pidieron (pendientes) o cuándo se surtieron
  const fechaDe = (u) => diaDe(tab === 'pendientes' ? u.creadoEn : u.surtidoEn);
  const grupos = [...new Set(lista.map(fechaDe))].map((dia) => ({
    dia,
    nombre: rotuloDia(dia),
    items: lista.filter((u) => fechaDe(u) === dia),
  }));

  const cambiarEstado = (u) => {
    const nuevo = u.estado === 'pendiente' ? 'surtido' : 'pendiente';
    setEstado(u.id, nuevo);
    setToast({
      texto: `${u.producto} pasó a ${nuevo === 'surtido' ? 'Surtidos' : 'Pendientes'}.`,
      deshacer: () => setEstado(u.id, u.estado),
    });
  };

  const detalle = modal?.tipo === 'detalle' ? todas.find((u) => u.id === modal.id) : null;
  const aBorrar = modal?.tipo === 'borrar' ? todas.find((u) => u.id === modal.id) : null;

  return (
    <div className="mod urg">
      <ModuleHeader
        title="Urgencias"
        subtitle="Compras urgentes que necesitan surtirse"
        onBack={onBack}
        onRefresh={recargarUrgencias}
      />

      <div className="lst-tools">
        <label className="lst-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar compra"
            aria-label="Buscar compra"
          />
        </label>
        <button type="button" className="lst-agregar" onClick={() => setModal({ tipo: 'agregar' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Agregar compra
        </button>
      </div>

      <div className="lst-cats" role="tablist" aria-label="Estado de las compras">
        {TABS.map((t) => {
          const n = t.estado === 'pendiente' ? pendientes.length : surtidos.length;
          return (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
              {n > 0 && <span className="lst-n">{n}</span>}
            </button>
          );
        })}
      </div>

      {estado === 'listo' && enPestana.length > 0 && (
        <div className="lst-resumen">
          <span>
            {tab === 'pendientes' ? (
              <><b>{pendientes.length}</b> {pendientes.length === 1 ? 'compra por surtir' : 'compras por surtir'}</>
            ) : (
              <><b>{surtidos.length}</b> {surtidos.length === 1 ? 'compra surtida' : 'compras surtidas'}</>
            )}
          </span>
          {tab === 'surtidos' && (
            <button type="button" className="lst-peligro" onClick={() => setModal({ tipo: 'limpiar' })}>
              {ICON_BASURA}
              Limpiar surtidos
            </button>
          )}
        </div>
      )}

      {estado === 'cargando' && <SkeletonList count={4} />}

      {estado === 'error' && (
        <div className="lst-empty" role="alert">
          <b>No hay conexión con el servidor</b>
          <p>Revisa tu conexión; las compras aparecerán en cuanto se recupere.</p>
        </div>
      )}

      {estado === 'listo' && enPestana.length === 0 && (
        <div className="lst-empty" role="tabpanel">
          <b>{tab === 'pendientes' ? 'No hay compras urgentes pendientes' : 'Todavía no hay compras surtidas'}</b>
          <p>
            {tab === 'pendientes'
              ? 'Usa «Agregar compra» para registrar un artículo de urgencia.'
              : 'Cuando surtas una compra pendiente, aparecerá aquí.'}
          </p>
        </div>
      )}

      {estado === 'listo' && enPestana.length > 0 && lista.length === 0 && (
        <div className="lst-empty">
          <b>Sin resultados</b>
          <p>No hay compras que coincidan con «{busca.trim()}».</p>
        </div>
      )}

      {estado === 'listo' && grupos.map((g) => (
        <section className="lst-grupo" key={g.dia} role="tabpanel" aria-label={g.nombre}>
          <h2>{g.nombre} <span>{g.items.length}</span></h2>
          <ul className="lst-lista">
            {g.items.map((u) => (
              <UrgenciaItem
                key={u.id}
                item={u}
                onToggleEstado={cambiarEstado}
                onDetalles={(item) => setModal({ tipo: 'detalle', id: item.id })}
                onBorrar={(item) => setModal({ tipo: 'borrar', id: item.id })}
              />
            ))}
          </ul>
        </section>
      ))}

      {modal?.tipo === 'agregar' && (
        <AgregarCompraModal
          onClose={() => setModal(null)}
          onSaved={(producto) => { setModal(null); setTab('pendientes'); setToast({ texto: `Se agregó ${producto}.` }); }}
        />
      )}
      {detalle && <DetalleModal item={detalle} onClose={() => setModal(null)} />}

      {aBorrar && (
        <Modal title="Borrar compra" subtitle={`${aBorrar.producto} · ${aBorrar.cantidad} ${aBorrar.unidad}`} onClose={() => setModal(null)}>
          <p className="lst-confirma">
            Úsalo si la compra se capturó por error. Se borrará para siempre de todos los dispositivos.
          </p>
          <div className="lst-actions">
            <button type="button" className="lst-btn ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button
              type="button"
              className="lst-btn"
              onClick={() => { borrarUrgencia(aBorrar.id); setModal(null); setToast({ texto: `Se borró ${aBorrar.producto}.` }); }}
            >
              Sí, borrar
            </button>
          </div>
        </Modal>
      )}

      {modal?.tipo === 'limpiar' && (
        <Modal
          title="Limpiar surtidos"
          subtitle={`${surtidos.length} ${surtidos.length === 1 ? 'compra surtida' : 'compras surtidas'}`}
          onClose={() => setModal(null)}
        >
          <p className="lst-confirma">
            Se borrarán para siempre de todos los dispositivos. Las compras pendientes no se tocan.
          </p>
          <div className="lst-actions">
            <button type="button" className="lst-btn ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button
              type="button"
              className="lst-btn"
              onClick={() => { limpiarSurtidos(); setModal(null); setToast({ texto: 'Se limpiaron las compras surtidas.' }); }}
            >
              Sí, limpiar
            </button>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="lst-toast" role="status">
          <span>{toast.texto}</span>
          {toast.deshacer && (
            <button type="button" onClick={() => { toast.deshacer(); setToast(null); }}>Deshacer</button>
          )}
        </div>
      )}
    </div>
  );
}
