import React, { useEffect, useState } from 'react';
import ModuleHeader from '../../components/Moduleheader';
import UrgenciaItem from './components/Urgenciaitem';
import DetalleModal from './components/Detallemodal';
import AgregarCompraModal from './components/Agregarmodalcompra';
import { setEstado, useUrgencias } from './store';
import './urgencias.css';

const TABS = [
  { id: 'pendientes', label: 'Pendientes', estado: 'pendiente' },
  { id: 'surtidos', label: 'Surtidos', estado: 'surtido' },
];

export default function Urgencias({ onBack }) {
  const [tab, setTab] = useState('pendientes');
  const [modal, setModal] = useState(null); // { tipo: 'agregar' } | { tipo: 'detalle', id }
  const [toast, setToast] = useState(null); // { texto, deshacer }
  const todas = useUrgencias();

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Los más antiguos primero en pendientes (llevan más tiempo esperando)
  const pendientes = todas
    .filter((u) => u.estado === 'pendiente')
    .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
  const surtidos = todas
    .filter((u) => u.estado === 'surtido')
    .sort((a, b) => b.surtidoEn.localeCompare(a.surtidoEn));
  const lista = tab === 'pendientes' ? pendientes : surtidos;

  const cambiarEstado = (u) => {
    const nuevo = u.estado === 'pendiente' ? 'surtido' : 'pendiente';
    setEstado(u.id, nuevo);
    setToast({
      texto: `${u.producto} pasó a ${nuevo === 'surtido' ? 'Surtidos' : 'Pendientes'}.`,
      deshacer: () => setEstado(u.id, u.estado),
    });
  };

  const detalle = modal?.tipo === 'detalle' ? todas.find((u) => u.id === modal.id) : null;

  return (
    <div className="mod urg">
      <ModuleHeader
        title="Urgencias"
        subtitle="Compras urgentes que necesitan surtirse"
        onBack={onBack}
      />

      <div className="urg-tabs" role="tablist">
        {TABS.map((t) => {
          const n = t.estado === 'pendiente' ? pendientes.length : surtidos.length;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {n > 0 && <span className="urg-badge">{n}</span>}
            </button>
          );
        })}
      </div>

      {lista.length ? (
        <ul className="urg-list" role="tabpanel">
          {lista.map((u) => (
            <UrgenciaItem
              key={u.id}
              item={u}
              onToggleEstado={cambiarEstado}
              onDetalles={(item) => setModal({ tipo: 'detalle', id: item.id })}
            />
          ))}
        </ul>
      ) : (
        <div className="urg-empty" role="tabpanel">
          <b>{tab === 'pendientes' ? 'No hay compras urgentes pendientes' : 'Todavía no hay compras surtidas'}</b>
          <p>
            {tab === 'pendientes'
              ? 'Usa el botón «Agregar compra» para registrar un artículo de urgencia.'
              : 'Cuando surtas una compra pendiente, aparecerá aquí.'}
          </p>
        </div>
      )}

      <button type="button" className="urg-fab" onClick={() => setModal({ tipo: 'agregar' })}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        Agregar compra
      </button>

      {modal?.tipo === 'agregar' && (
        <AgregarCompraModal
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); setTab('pendientes'); }}
        />
      )}
      {detalle && <DetalleModal item={detalle} onClose={() => setModal(null)} />}

      {toast && (
        <div className="urg-toast" role="status">
          <span>{toast.texto}</span>
          <button type="button" onClick={() => { toast.deshacer(); setToast(null); }}>Deshacer</button>
        </div>
      )}
    </div>
  );
}