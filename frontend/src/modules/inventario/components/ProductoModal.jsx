import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import { UNIDADES } from '../../unidades';
import { CATEGORIAS, esCategoria } from '../categorias';
import { addProducto, editarProducto, nombreRepetido } from '../store';

/* Alta (sin producto) o edición (con producto) de un artículo del inventario.
 * categoriaInicial: la categoría filtrada en pantalla, para no tener que elegirla otra vez. */
export default function ProductoModal({ producto, categoriaInicial, onClose, onSaved }) {
  const editando = Boolean(producto);
  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  // Un producto con categoría vieja (texto libre) obliga a elegir una de la lista al editarlo
  const [categoria, setCategoria] = useState(
    producto ? (esCategoria(producto.categoria) ? producto.categoria : '') : (categoriaInicial || ''),
  );
  const [cantidad, setCantidad] = useState(producto ? String(producto.cantidad) : '');
  const [unidad, setUnidad] = useState(producto?.unidad ?? 'kg');
  const [error, setError] = useState('');
  // Al corregir cualquier campo se quita el aviso de error
  const cambia = (set) => (e) => { set(e.target.value); setError(''); };

  const submit = (e) => {
    e.preventDefault();
    const n = Number(cantidad);
    if (!nombre.trim()) return setError('Escribe el nombre del producto.');
    if (!categoria) return setError('Elige la categoría del producto.');
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
      <form className="frm" onSubmit={submit} noValidate>
        <label className="fld">
          <span>Nombre</span>
          <input value={nombre} onChange={cambia(setNombre)} placeholder="Camarón 21/25, Tecate, vasos…" autoFocus={!editando} />
        </label>
        <label className="fld">
          <span>Categoría</span>
          <select value={categoria} onChange={cambia(setCategoria)}>
            <option value="" disabled>Elige una categoría…</option>
            {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>
        <div className="frm-row2">
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

        {error && <p className="frm-error" role="alert">{error}</p>}

        <div className="lst-actions">
          <button type="button" className="lst-btn ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="lst-btn">{editando ? 'Guardar cambios' : 'Agregar producto'}</button>
        </div>
      </form>
    </Modal>
  );
}
