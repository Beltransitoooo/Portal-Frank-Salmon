import React, { useEffect, useState } from 'react';
import ModuleHeader from '../../components/ModuleHeader';
import ProveedorCard from './components/ProveedorCard';
import DetallesModal from './components/DetallesModal';
import FechasModal from './components/FechasModal';
import ArriboModal from './components/ArriboModal';
import { PROVEEDORES } from './data';
import './proveedores.css';

export default function Proveedores({ onBack, onOpenModule }) {
  const [modal, setModal] = useState(null); // { tipo, proveedor }
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(false), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const close = () => setModal(null);
  const n = PROVEEDORES.length;

  return (
    <div className="mod prov">
      <ModuleHeader
        title="Proveedores"
        subtitle={`${n} ${n === 1 ? 'proveedor registrado' : 'proveedores registrados'}`}
        onBack={onBack}
      />

      <div className="prov-grid">
        {PROVEEDORES.map((p) => (
          <ProveedorCard
            key={p.id}
            proveedor={p}
            onAction={(tipo, proveedor) => setModal({ tipo, proveedor })}
          />
        ))}
      </div>

      {modal?.tipo === 'detalles' && <DetallesModal proveedor={modal.proveedor} onClose={close} />}
      {modal?.tipo === 'fechas' && <FechasModal proveedor={modal.proveedor} onClose={close} />}
      {modal?.tipo === 'arribo' && (
        <ArriboModal
          proveedor={modal.proveedor}
          onClose={close}
          onSaved={() => { close(); setToast(true); }}
        />
      )}

      {toast && (
        <div className="prov-toast" role="status">
          <span>Arribo agregado a pendientes.</span>
          {onOpenModule && (
            <button type="button" onClick={() => { setToast(false); onOpenModule('arribos'); }}>
              Ver arribos
            </button>
          )}
        </div>
      )}
    </div>
  );
}