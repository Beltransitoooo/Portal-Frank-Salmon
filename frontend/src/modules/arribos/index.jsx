import React, { useState } from 'react';
import ModuleHeader from '../../components/Moduleheader';
import ArriboCard from './components/ArriboCard';
import { cancelarArribo, limpiarRecepcionados, recargarArribos, useArribos, useArribosEstado } from './store';
import Modal from '../../components/Modal';
import { SkeletonCards } from '../../components/Skeleton';
import { formatFecha } from '../fechas';
import './arribos.css';

const TABS = [
  { id: 'pendientes', label: 'Arribos pendientes' },
  { id: 'recepcionados', label: 'Arribos recepcionados' },
];

export default function Arribos({ onBack, onOpenModule }) {
  const [tab, setTab] = useState('pendientes');
  const [modal, setModal] = useState(null); // { tipo: 'cancelar', id } | { tipo: 'limpiar' }
  const todos = useArribos();
  const estado = useArribosEstado();

  const pendientes = todos
    .filter((a) => a.estado === 'pendiente')
    .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
  const recepcionados = todos
    .filter((a) => a.estado === 'recepcionado')
    .sort((a, b) => b.recepcionadoEn.localeCompare(a.recepcionadoEn));

  const lista = tab === 'pendientes' ? pendientes : recepcionados;
  const aCancelar = modal?.tipo === 'cancelar' ? todos.find((a) => a.id === modal.id) : null;

  return (
    <div className="mod arr">
      <ModuleHeader
        title="Arribos"
        subtitle="Lo que esperas de tus proveedores y lo que ya llegó"
        onBack={onBack}
        onRefresh={recargarArribos}
      />

      <div className="arr-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'pendientes' && pendientes.length > 0 && <span className="arr-badge">{pendientes.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'recepcionados' && estado === 'listo' && recepcionados.length > 0 && (
        <div className="arr-acciones">
          <button type="button" className="arr-limpiar" onClick={() => setModal({ tipo: 'limpiar' })}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
            </svg>
            Limpiar arribos
          </button>
        </div>
      )}

      {estado === 'cargando' && <SkeletonCards count={2} />}

      {estado === 'error' && (
        <div className="arr-empty" role="alert">
          <b>No hay conexión con el servidor</b>
          <p>Revisa tu conexión; los arribos aparecerán en cuanto se recupere.</p>
        </div>
      )}

      {estado === 'listo' && (lista.length ? (
        <div className="arr-grid" role="tabpanel">
          {lista.map((a) => (
            <ArriboCard key={a.id} arribo={a} onCancelar={(x) => setModal({ tipo: 'cancelar', id: x.id })} />
          ))}
        </div>
      ) : (
        <div className="arr-empty" role="tabpanel">
          <b>{tab === 'pendientes' ? 'No hay arribos pendientes' : 'Aún no hay arribos recepcionados'}</b>
          <p>
            {tab === 'pendientes'
              ? 'Los arribos que agregues desde un proveedor aparecerán aquí.'
              : 'Cuando marques un arribo como recepcionado, aparecerá aquí.'}
          </p>
          {tab === 'pendientes' && onOpenModule && (
            <button type="button" className="arr-btn" onClick={() => onOpenModule('proveedores')}>
              Ir a Proveedores
            </button>
          )}
        </div>
      ))}

      {aCancelar && (
        <Modal
          title="Cancelar arribo"
          subtitle={`${aCancelar.proveedorNombre} · ${formatFecha(aCancelar.fecha)}`}
          onClose={() => setModal(null)}
        >
          <p className="arr-confirma">
            El arribo se borrará para siempre de todos los dispositivos.
          </p>
          <div className="arr-acts">
            <button type="button" className="arr-btn ghost" onClick={() => setModal(null)}>Volver</button>
            <button
              type="button"
              className="arr-btn"
              onClick={() => { cancelarArribo(aCancelar.id); setModal(null); }}
            >
              Sí, cancelar
            </button>
          </div>
        </Modal>
      )}

      {modal?.tipo === 'limpiar' && (
        <Modal
          title="Limpiar arribos"
          subtitle={`${recepcionados.length} ${recepcionados.length === 1 ? 'arribo recepcionado' : 'arribos recepcionados'}`}
          onClose={() => setModal(null)}
        >
          <p className="arr-confirma">
            Se borrarán para siempre de todos los dispositivos. Los arribos pendientes no se tocan.
          </p>
          <div className="arr-acts">
            <button type="button" className="arr-btn ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button
              type="button"
              className="arr-btn"
              onClick={() => { limpiarRecepcionados(); setModal(null); }}
            >
              Sí, limpiar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
