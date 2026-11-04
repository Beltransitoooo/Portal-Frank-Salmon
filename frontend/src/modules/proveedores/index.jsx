import React, { useEffect, useState } from 'react';
import ModuleHeader from '../../components/Moduleheader';
import ProveedorCard from './components/Proveedorcard';
import DetallesModal from './components/Detallesmodal';
import FechasModal from './components/Fechasmodal';
import ArriboModal from './components/Arribomodal';
import AgregarProveedorModal from './components/Agregarproveedormodal';
import { useProveedores } from './api';
import { SkeletonCards } from '../../components/Skeleton';
import './proveedores.css';

export default function Proveedores({ onBack, onOpenModule }) {
  const [modal, setModal] = useState(null); // { tipo, proveedor? }
  const [toast, setToast] = useState(null); // { texto, verArribos? }
  const { proveedores, cargando, error } = useProveedores();

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 6000);
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

      {!cargando && !error && n === 0 && (
        <div className="prov-empty">
          <b>Aún no hay proveedores</b>
          <p>Usa el botón «Agregar proveedor» para dar de alta el primero.</p>
        </div>
      )}

      {cargando && <SkeletonCards count={3} />}

      <div className="prov-grid">
        {proveedores.map((p) => (
          <ProveedorCard
            key={p.id}
            proveedor={p}
            onAction={(tipo, proveedor) => setModal({ tipo, proveedor })}
          />
        ))}
      </div>

      {!error && (
        <button type="button" className="prov-fab" onClick={() => setModal({ tipo: 'alta' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Agregar proveedor
        </button>
      )}

      {modal?.tipo === 'alta' && (
        <AgregarProveedorModal
          onClose={close}
          onSaved={(nuevo) => { close(); setToast({ texto: `${nuevo.nombre} se agregó a proveedores.` }); }}
        />
      )}
      {modal?.tipo === 'detalles' && <DetallesModal proveedor={modal.proveedor} onClose={close} />}
      {modal?.tipo === 'fechas' && <FechasModal proveedor={modal.proveedor} onClose={close} />}
      {modal?.tipo === 'arribo' && (
        <ArriboModal
          proveedor={modal.proveedor}
          onClose={close}
          onSaved={() => { close(); setToast({ texto: 'Arribo agregado a pendientes.', verArribos: true }); }}
        />
      )}

      {toast && (
        <div className="prov-toast" role="status">
          <span>{toast.texto}</span>
          {toast.verArribos && onOpenModule && (
            <button type="button" onClick={() => { setToast(null); onOpenModule('arribos'); }}>
              Ver arribos
            </button>
          )}
        </div>
      )}
    </div>
  );
}
