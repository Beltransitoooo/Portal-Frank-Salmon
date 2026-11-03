import React from 'react';
import Modal from '../../../components/Modal';
import { DIAS, DIAS_LARGO, formatHora } from '../../fechas';

export default function FechasModal({ proveedor, onClose }) {
  const lista = proveedor.dias.map((d) => DIAS_LARGO[d]).join(', ');
  return (
    <Modal title="Fechas" subtitle={proveedor.nombre} onClose={onClose}>
      <p className="prov-label">Días que surte</p>
      <div className="prov-week" aria-label={`Surte los días: ${lista}`}>
        {DIAS.map((d, i) => (
          <span key={d} className={proveedor.dias.includes(i) ? 'on' : ''}>{d}</span>
        ))}
      </div>

      <p className="prov-label">Hora aproximada de llegada</p>
      <p className="prov-hour">{formatHora(proveedor.hora)}</p>
    </Modal>
  );
}