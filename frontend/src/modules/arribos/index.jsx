import React, { useState } from 'react';
import ModuleHeader from '../../components/Moduleheader';
import ArriboCard from './components/ArriboCard';
import { useArribos } from './store';
import './arribos.css';

const TABS = [
  { id: 'pendientes', label: 'Arribos pendientes' },
  { id: 'recepcionados', label: 'Arribos recepcionados' },
];

export default function Arribos({ onBack, onOpenModule }) {
  const [tab, setTab] = useState('pendientes');
  const todos = useArribos();

  const pendientes = todos
    .filter((a) => a.estado === 'pendiente')
    .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
  const recepcionados = todos
    .filter((a) => a.estado === 'recepcionado')
    .sort((a, b) => b.recepcionadoEn.localeCompare(a.recepcionadoEn));

  const lista = tab === 'pendientes' ? pendientes : recepcionados;

  return (
    <div className="mod arr">
      <ModuleHeader
        title="Arribos"
        subtitle="Lo que esperas de tus proveedores y lo que ya llegó"
        onBack={onBack}
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

      {lista.length ? (
        <div className="arr-grid" role="tabpanel">
          {lista.map((a) => <ArriboCard key={a.id} arribo={a} />)}
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
      )}
    </div>
  );
}