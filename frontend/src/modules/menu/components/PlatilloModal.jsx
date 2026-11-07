import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import { SECCIONES } from '../secciones';
import { addPlatillo, editarPlatillo, nombreRepetido } from '../store';

/* Alta (sin platillo) o edición (con platillo) de un platillo del menú.
 * seccionInicial: la sección filtrada en pantalla, para no tener que elegirla otra vez. */
export default function PlatilloModal({ platillo, seccionInicial, onClose, onSaved }) {
  const editando = Boolean(platillo);
  const [nombre, setNombre] = useState(platillo?.nombre ?? '');
  const [seccion, setSeccion] = useState(platillo?.seccion ?? seccionInicial ?? '');
  const [precio, setPrecio] = useState(platillo ? String(platillo.precio) : '');
  const [descripcion, setDescripcion] = useState(platillo?.descripcion ?? '');
  const [disponible, setDisponible] = useState(platillo?.disponible ?? true);
  const [error, setError] = useState('');

  // Al corregir cualquier campo se quita el aviso de error
  const cambia = (set) => (e) => { set(e.target.value); setError(''); };

  const submit = (e) => {
    e.preventDefault();
    const n = Number(precio);
    if (!nombre.trim()) return setError('Escribe el nombre del platillo.');
    if (!seccion) return setError('Elige la sección del menú.');
    if (precio === '' || Number.isNaN(n) || n < 0) return setError('Indica un precio de 0 o más.');
    if (nombreRepetido(nombre, seccion, platillo?.id)) return setError('Ya hay un platillo con ese nombre en esta sección.');

    const datos = { nombre, seccion, precio: n, descripcion, disponible };
    if (editando) editarPlatillo(platillo.id, datos);
    else addPlatillo(datos);
    onSaved(editando ? 'editado' : 'agregado', nombre.trim());
    return undefined;
  };

  return (
    <Modal
      title={editando ? 'Editar platillo' : 'Agregar platillo'}
      subtitle={editando ? platillo.nombre : 'Nuevo platillo del menú'}
      onClose={onClose}
    >
      <form className="frm" onSubmit={submit} noValidate>
        <label className="fld">
          <span>Nombre</span>
          <input value={nombre} onChange={cambia(setNombre)} placeholder="Aguachile negro, taco gobernador…" autoFocus={!editando} />
        </label>
        <div className="frm-row2">
          <label className="fld">
            <span>Sección</span>
            <select value={seccion} onChange={cambia(setSeccion)}>
              <option value="" disabled>Elige una sección…</option>
              {SECCIONES.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </label>
          <label className="fld">
            <span>Precio (MXN)</span>
            <span className="mnu-precio-in">
              <i aria-hidden="true">$</i>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={precio}
                onChange={cambia(setPrecio)}
                placeholder="0.00"
              />
            </span>
          </label>
        </div>
        <label className="fld">
          <span>Descripción (opcional)</span>
          <textarea
            rows="2"
            maxLength={500}
            value={descripcion}
            onChange={cambia(setDescripcion)}
            placeholder="Ingredientes o cómo se sirve"
          />
        </label>
        <label className="mnu-switch">
          <input type="checkbox" checked={disponible} onChange={(e) => setDisponible(e.target.checked)} />
          <span className="mnu-switch-ui" aria-hidden="true" />
          <span>{disponible ? 'Disponible' : 'No disponible por ahora'}</span>
        </label>

        {error && <p className="frm-error" role="alert">{error}</p>}

        <div className="lst-actions">
          <button type="button" className="lst-btn ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="lst-btn">{editando ? 'Guardar cambios' : 'Agregar platillo'}</button>
        </div>
      </form>
    </Modal>
  );
}
