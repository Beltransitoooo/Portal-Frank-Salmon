import React, { useRef, useState } from 'react';
import Modal from '../../../components/Modal';
import { addProveedor } from '../api';
import { DIAS } from '../../fechas';
import { UNIDADES } from '../../unidades';

export default function AgregarProveedorModal({ onClose, onSaved }) {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [rows, setRows] = useState([{ k: 1, nombre: '', unidad: 'kg' }]);
  const [dias, setDias] = useState([]);
  const [hora, setHora] = useState('07:00');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const nextKey = useRef(2);

  const setRow = (k, patch) => setRows((r) => r.map((x) => (x.k === k ? { ...x, ...patch } : x)));
  const addRow = () => {
    setRows((r) => [...r, { k: nextKey.current, nombre: '', unidad: 'kg' }]);
    nextKey.current += 1;
  };
  const removeRow = (k) => setRows((r) => r.filter((x) => x.k !== k));
  const toggleDia = (d) => setDias((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]));

  const submit = async (e) => {
    e.preventDefault();
    const productos = rows
      .map(({ nombre: n, unidad }) => ({ nombre: n.trim(), unidad }))
      .filter((p) => p.nombre);

    if (!nombre.trim()) return setError('Escribe el nombre del proveedor.');
    if (!productos.length) return setError('Agrega al menos un producto.');
    if (!dias.length) return setError('Elige al menos un día de entrega.');
    if (!hora) return setError('Indica la hora aproximada de entrega.');

    setError('');
    setGuardando(true);
    try {
      const nuevo = await addProveedor({
        nombre: nombre.trim(),
        categoria: categoria.trim(),
        productos,
        dias: [...dias].sort(),
        hora,
      });
      onSaved(nuevo);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
    return undefined;
  };

  return (
    <Modal title="Agregar proveedor" subtitle="Alta de un proveedor nuevo" onClose={onClose}>
      <form className="prov-form" onSubmit={submit} noValidate>
        <div className="prov-row2">
          <label className="fld">
            <span>Nombre</span>
            <input type="text" value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </label>
          <label className="fld">
            <span>Categoría (opcional)</span>
            <input
              type="text"
              value={categoria}
              maxLength={120}
              placeholder="Mariscos, abarrotes…"
              onChange={(e) => setCategoria(e.target.value)}
            />
          </label>
        </div>

        <p className="prov-label">Productos que surte</p>
        <div className="prov-items">
          {rows.map((r) => (
            <div className="prov-item prov-item-alta" key={r.k}>
              <input
                type="text"
                placeholder="Producto"
                aria-label="Nombre del producto"
                maxLength={200}
                value={r.nombre}
                onChange={(e) => setRow(r.k, { nombre: e.target.value })}
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

        <p className="prov-label">Días de entrega</p>
        <div className="prov-week prov-week-pick" role="group" aria-label="Días de entrega">
          {DIAS.map((d, i) => (
            <button
              key={d}
              type="button"
              className={dias.includes(i) ? 'on' : ''}
              aria-pressed={dias.includes(i)}
              onClick={() => toggleDia(i)}
            >
              {d}
            </button>
          ))}
        </div>

        <label className="fld prov-hora">
          <span>Hora aproximada de entrega</span>
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </label>

        {error && <p className="prov-error" role="alert">{error}</p>}

        <div className="prov-actions">
          <button type="button" className="prov-btn ghost" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button type="submit" className="prov-btn" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar proveedor'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
