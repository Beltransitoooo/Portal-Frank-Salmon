import React from 'react';
import Modal from '../../../components/Modal';
import { formatMomento } from '../../fechas';

export default function DetalleModal({ item, onClose }) {
  const pendiente = item.estado === 'pendiente';
  return (
    <Modal title="Detalles" subtitle={item.producto} onClose={onClose}>
      <dl className="urg-dl">
        <div><dt>Producto</dt><dd>{item.producto}</dd></div>
        <div><dt>Cantidad</dt><dd>{item.cantidad} {item.unidad}</dd></div>
        <div>
          <dt>Estado</dt>
          <dd><span className={`urg-state ${item.estado}`}>{pendiente ? 'Pendiente' : 'Surtido'}</span></dd>
        </div>
        <div><dt>Solicitado</dt><dd>{formatMomento(item.creadoEn)}</dd></div>
        {!pendiente && <div><dt>Surtido</dt><dd>{formatMomento(item.surtidoEn)}</dd></div>}
        <div><dt>Notas</dt><dd>{item.notas || 'Sin notas'}</dd></div>
      </dl>
    </Modal>
  );
}