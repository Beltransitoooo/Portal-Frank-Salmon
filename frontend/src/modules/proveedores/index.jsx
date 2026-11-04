import React, { useEffect, useState } from 'react';
import ModuleHeader from '../../components/Moduleheader';
import ProveedorCard from './components/Proveedorcard';
import DetallesModal from './components/Detallesmodal';
import FechasModal from './components/Fechasmodal';
import ArriboModal from './components/Arribomodal';
import { useProveedores } from './api';
import './proveedores.css';

export default function Proveedores({ onBack, onOpenModule }) {
  const [modal, setModal] = useState(null); // { tipo, proveedor }
  const [toast, setToast] = useState(false);
  const { proveedores, cargando, error } = useProveedores();

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(false), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const close = () => setModal(null);
  const n = proveedores.length;
  let subtitle = `${n} ${n === 1 ? 'proveedor registrado' : 'proveedores registrados'}`;
  if (cargando) subtitle = 'Cargando proveedores…';
  if (error) subtitle = 'No se pudieron cargar los proveedores';

  return (
    <div className="mod prov">
      <ModuleHeader title="Proveedores" subtitle={subtitle} onBack={onBack} />

      {error && (
        <div className="prov-empty" role="alert">
          <b>No hay conexión con el servidor</b>
          <p>Revisa tu conexión y vuelve a abrir este módulo.</p>
        </div>
      )}

      <div className="prov-grid">
        {proveedores.map((p) => (
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