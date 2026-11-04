import React, { useRef, useState } from 'react';
import Modal from '../../../components/Modal';
import { addArribo } from '../../arribos/store';
import { proximaFecha, toISO } from '../../fechas';
import { UNIDADES } from '../../unidades';

export default function ArriboModal({ proveedor, onClose, onSaved }) {
  const [fecha, setFecha] = useState(() => proximaFecha(proveedor.dias));
  const [hora, setHora] = useState(proveedor.hora);
  const [rows, setRows] = useState([{ k: 1, producto: '', cantidad: '', unidad: 'kg' }]);
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const nextKey = useRef(2);

  const setRow = (k, patch) => setRows((r) => r.map((x) => (x.k === k ? { ...x, ...patch } : x)));

  const pickProducto = (k, nombre) => {
    const p = proveedor.productos.find((x) => x.nombre === nombre);
    setRow(k, { producto: nombre, unidad: p ? p.unidad : 'kg' });
  };

  const addRow = () => {
    setRows((r) => [...r, { k: nextKey.current, producto: '', cantidad: '', unidad: 'kg' }]);
    nextKey.current += 1;
  };
  const removeRow = (k) => setRows((r) => r.filter((x) => x.k !== k));

  const submit = (e) => {
    e.preventDefault();
    const items = rows
      .filter((r) => r.producto && Number(r.cantidad) > 0)
      .map(({ producto, cantidad, unidad }) => ({ producto, cantidad: Number(cantidad), unidad }));

    if (!fecha || !hora) return setError('Indica la fecha y la hora esperadas.');
    if (!items.length) return setError('Agrega al menos un producto con su cantidad.');

    addArribo({
      proveedorId: proveedor.id,
      proveedorNombre: proveedor.nombre,
      fecha,
      hora,
      items,
      notas: notas.trim(),
    });
    onSaved();
    return undefined;
  };

  return (
    <Modal title="Agregar arribo" subtitle={proveedor.nombre} onClose={onClose}>
      <form className="prov-form" onSubmit={submit} noValidate>
        <div className="prov-row2">
          <label className="fld">
            <span>Fecha esperada</span>
            <input type="date" value={fecha} min={toISO(new Date())} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label className="fld">
            <span>Hora aproximada</span>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </label>
        </div>

        <p className="prov-label">Productos esperados</p>
        <div className="prov-items">
          {rows.map((r) => (
            <div className="prov-item" key={r.k}>
              <select
                aria-label="Producto"
                value={r.producto}
                onChange={(e) => pickProducto(r.k, e.target.value)}
              >
                <option value="">Producto…</option>
                {proveedor.productos.map((p) => (
                  <option key={p.nombre} value={p.nombre}>{p.nombre}</option>
                ))}
              </select>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="Cant."
                aria-label="Cantidad"
                value={r.cantidad}
                onChange={(e) => setRow(r.k, { cantidad: e.target.value })}
              />
              <select aria-label="Unidad" value={r.unidad} onChange={(e) => setRow(r.k, { unidad: e.target.value })}>
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <button
                type="button"
                className="prov-rm"
                aria-label="Quitar producto"
                disabled={rows.length === 1}
                onClick={() => removeRow(r.k)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="prov-add" onClick={addRow}>+ Agregar otro producto</button>

        <label className="fld">
          <span>Notas (opcional)</span>
          <textarea rows="2" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </label>

        {error && <p className="prov-error" role="alert">{error}</p>}

        <div className="prov-actions">
          <button type="button" className="prov-btn ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="prov-btn">Guardar arribo</button>
        </div>
      </form>
    </Modal>
  );
}