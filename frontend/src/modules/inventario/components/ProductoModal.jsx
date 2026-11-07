import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import { UNIDADES } from '../../unidades';
import { addProducto, editarProducto, nombreRepetido } from '../store';

/* Alta (sin producto) o edición (con producto) de un artículo del inventario */
export default function ProductoModal({ producto, categorias, onClose, onSaved }) {
  const editando = Boolean(producto);
  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [categoria, setCategoria] = useState(producto?.categoria ?? '');
  const [cantidad, setCantidad] = useState(producto ? String(producto.cantidad) : '');
  const [unidad, setUnidad] = useState(producto?.unidad ?? 'kg');
  const [error, setError] = useState('');
  // Al corregir cualquier campo se quita el aviso de error
  const cambia = (set) => (e) => { set(e.target.value); setError(''); };

  const submit = (e) => {
    e.preventDefault();
    const n = Number(cantidad);
    if (!nombre.trim()) return setError('Escribe el nombre del producto.');
    if (nombreRepetido(nombre, producto?.id)) return setError('Ya existe un producto con ese nombre.');
    if (cantidad === '' || Number.isNaN(n) || n < 0) return setError('Indica una existencia de 0 o más.');

    const datos = { nombre, categoria, cantidad: n, unidad };
    if (editando) editarProducto(producto.id, datos);
    else addProducto(datos);
    onSaved(editando ? 'editado' : 'agregado', nombre.trim());
    return undefined;
  };

  return (
    <Modal
      title={editando ? 'Editar producto' : 'Agregar producto'}
      subtitle={editando ? producto.nombre : 'Nuevo artículo del inventario'}
      onClose={onClose}
    >
      <form className="inv-form" onSubmit={submit} noValidate>
        <label className="fld">
          <span>Nombre</span>
          <input value={nombre} onChange={cambia(setNombre)} placeholder="Camarón 21/25, limón…" autoFocus={!editando} />
        </label>
        <label className="fld">
          <span>Categoría (opcional)</span>
          <input
            value={categoria}
            onChange={cambia(setCategoria)}
            placeholder="Mariscos, abarrotes, bebidas…"
            list="inv-categorias"
          />
          <datalist id="inv-categorias">
            {categorias.map((c) => <option key={c} value={c} />)}
          </datalist>
        </label>
        <div className="inv-row2">
          <label className="fld">
            <span>Existencia actual</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={cantidad}
              onChange={cambia(setCantidad)}
              placeholder="0"
            />
          </label>
          <label className="fld">
            <span>Unidad</span>
            <select value={unidad} onChange={cambia(setUnidad)}>
              {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
        </div>

        {error && <p className="inv-error" role="alert">{error}</p>}

        <div className="inv-actions">
          <button type="button" className="inv-btn ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="inv-btn">{editando ? 'Guardar cambios' : 'Agregar producto'}</button>
        </div>
      </form>
    </Modal>
  );
}
