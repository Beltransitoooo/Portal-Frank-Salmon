import React, { useRef, useState } from 'react';
import Modal from '../../../components/Modal';
import { addProveedor, cambiarActivoProveedor, updateProveedor } from '../api';
import { DIAS } from '../../fechas';
import { UNIDADES } from '../../unidades';

/* Alta de proveedor; si recibe `proveedor`, abre en modo edición con sus datos ya llenos */
export default function AgregarProveedorModal({ proveedor, onClose, onSaved }) {
  const editando = Boolean(proveedor);
  const [nombre, setNombre] = useState(proveedor?.nombre ?? '');
  const [categoria, setCategoria] = useState(proveedor?.categoria ?? '');
  const [rows, setRows] = useState(() =>
    proveedor?.productos?.length
      ? proveedor.productos.map((p, i) => ({ k: i + 1, nombre: p.nombre, unidad: p.unidad }))
      : [{ k: 1, nombre: '', unidad: 'kg' }]
  );
  const [dias, setDias] = useState(proveedor?.dias ?? []);
  const [hora, setHora] = useState(proveedor?.hora || '07:00');
  const [activo, setActivo] = useState(proveedor ? proveedor.activo !== false : true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const nextKey = useRef(rows.length + 1);

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
      const datos = {
        nombre: nombre.trim(),
        categoria: categoria.trim(),
        productos,
        dias: [...dias].sort((a, b) => a - b),
        hora,
      };
      let guardado = editando ? await updateProveedor(proveedor.id, datos) : await addProveedor(datos);
      if (editando && activo !== (proveedor.activo !== false)) {
        guardado = await cambiarActivoProveedor(proveedor.id, activo);
      }
      onSaved(guardado);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
    return undefined;
  };

  return (
    <Modal
      title={editando ? 'Editar proveedor' : 'Agregar proveedor'}
      subtitle={editando ? proveedor.nombre : 'Alta de un proveedor nuevo'}
      onClose={onClose}
    >
      <form className="frm" onSubmit={submit} noValidate>
        <div className="frm-row2 mitad">
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

        <p className="frm-label">Productos que surte</p>
        <div className="frm-items">
          {rows.map((r) => (
            <div className="frm-item alta" key={r.k}>
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
                className="frm-rm"
                aria-label="Quitar producto"
                disabled={rows.length === 1}
                onClick={() => removeRow(r.k)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="frm-add" onClick={addRow}>+ Agregar otro producto</button>

        <p className="frm-label">Días de entrega</p>
        <div className="frm-semana" role="group" aria-label="Días de entrega">
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

        <label className="fld frm-hora">
          <span>Hora aproximada de entrega</span>
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </label>

        {editando && (
          <label className="frm-switch">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            <span className="frm-switch-ui" aria-hidden="true" />
            <span>{activo ? 'Habilitado' : 'Deshabilitado: no se le pueden registrar arribos'}</span>
          </label>
        )}

        {error && <p className="frm-error" role="alert">{error}</p>}

        <div className="lst-actions">
          <button type="button" className="lst-btn ghost" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button type="submit" className="lst-btn" disabled={guardando}>
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar proveedor'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
