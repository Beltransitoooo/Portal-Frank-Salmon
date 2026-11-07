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
  // Al corregir cualquier campo se quita el aviso de error
  const cambia = (set) => (e) => { set(e.target.value); setError(''); };

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
    onSaved(producto.trim());
    return undefined;
  };

  return (
    <Modal title="Agregar compra" subtitle="Artículo de urgencia" onClose={onClose}>
      <form className="frm" onSubmit={submit} noValidate>
        <label className="fld">
          <span>Producto</span>
          <input type="text" value={producto} onChange={cambia(setProducto)} placeholder="Limón, hielo, servilletas…" autoFocus />
        </label>

        <div className="frm-row2">
          <label className="fld">
            <span>Cantidad</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={cantidad}
              onChange={cambia(setCantidad)}
            />
          </label>
          <label className="fld">
            <span>Unidad</span>
            <select value={unidad} onChange={cambia(setUnidad)}>
              {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
        </div>

        <label className="fld">
          <span>Notas (opcional)</span>
          <textarea rows="2" value={notas} onChange={cambia(setNotas)} />
        </label>

        {error && <p className="frm-error" role="alert">{error}</p>}

        <div className="lst-actions">
          <button type="button" className="lst-btn ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="lst-btn">Agregar compra</button>
        </div>
      </form>
    </Modal>
  );
}