import React from 'react';
import Modal from '../../../components/Modal';

export default function DetallesModal({ proveedor, onClose }) {
  return (
    <Modal title="Detalles" subtitle={proveedor.nombre} onClose={onClose}>
      <p className="frm-label">Lo que surte en general</p>
      <ul className="frm-lista">
        {proveedor.productos.map((p) => (
          <li key={p.nombre}>
            <span>{p.nombre}</span>
            <em>{p.unidad}</em>
          </li>
        ))}
      </ul>
    </Modal>
  );
}