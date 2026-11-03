import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import { addUrgencia } from '../store';
import { UNIDADES } from '../../unidades';

export default function AgregarCompraModal({ onClose, onSaved }) {
  const [producto, setProducto] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('kg');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!producto.trim()) return setError('Escribe el nombre del producto.');
    if (!(Number(cantidad) > 0)) return setError('Indica la cantidad que necesitas.');

    addUrgencia({
      producto: producto.trim(),
      cantidad: Number(cantidad),
      unidad,
      notas: notas.trim(),
    });
    onSaved();
    return undefined;
  };

  return (
    <Modal title="Agregar compra" subtitle="Artículo de urgencia" onClose={onClose}>
      <form className="urg-form" onSubmit={submit} noValidate>
        <label className="fld">
          <span>Producto</span>
          <input type="text" value={producto} onChange={(e) => setProducto(e.target.value)} autoFocus />
        </label>

        <div className="urg-row">
          <label className="fld">
            <span>Cantidad</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </label>
          <label className="fld">
            <span>Unidad</span>
            <select value={unidad} onChange={(e) => setUnidad(e.target.value)}>
              {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
        </div>

        <label className="fld">
          <span>Notas (opcional)</span>
          <textarea rows="2" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </label>

        {error && <p className="urg-error" role="alert">{error}</p>}

        <div className="urg-actions">
          <button type="button" className="urg-btn ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="urg-btn">Agregar compra</button>
        </div>
      </form>
    </Modal>
  );
}