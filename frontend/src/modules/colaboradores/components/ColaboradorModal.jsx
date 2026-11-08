import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import { toISO } from '../../fechas';
import { AREAS, TURNOS } from '../areas';
import { addColaborador, editarColaborador } from '../store';

/* Alta (sin colaborador) o edición (con colaborador). Solo datos de trabajo.
 * areaInicial: el área filtrada en pantalla, para no tener que elegirla otra vez. */
export default function ColaboradorModal({ colaborador, areaInicial, onClose, onSaved }) {
  const editando = Boolean(colaborador);
  const [nombre, setNombre] = useState(colaborador?.nombre ?? '');
  const [area, setArea] = useState(colaborador?.area ?? areaInicial ?? '');
  const [puesto, setPuesto] = useState(colaborador?.puesto ?? '');
  const [turno, setTurno] = useState(colaborador?.turno ?? '');
  const [fechaIngreso, setFechaIngreso] = useState(colaborador?.fechaIngreso ?? '');
  const [activo, setActivo] = useState(colaborador ? colaborador.activo !== false : true);
  const [error, setError] = useState('');

  // Al corregir cualquier campo se quita el aviso de error
  const cambia = (set) => (e) => { set(e.target.value); setError(''); };

  const submit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return setError('Escribe el nombre del colaborador.');
    if (!area) return setError('Elige el área.');
    if (fechaIngreso && fechaIngreso > toISO(new Date())) return setError('La fecha de ingreso no puede ser futura.');

    const datos = { nombre, area, puesto, turno, fechaIngreso: fechaIngreso || null, activo };
    if (editando) editarColaborador(colaborador.id, datos);
    else addColaborador(datos);
    onSaved(editando ? 'editado' : 'agregado', nombre.trim());
    return undefined;
  };

  return (
    <Modal
      title={editando ? 'Editar colaborador' : 'Agregar colaborador'}
      subtitle={editando ? colaborador.nombre : 'Solo datos de trabajo'}
      onClose={onClose}
    >
      <form className="frm" onSubmit={submit} noValidate>
        <label className="fld">
          <span>Nombre</span>
          <input value={nombre} maxLength={120} onChange={cambia(setNombre)} autoFocus={!editando} />
        </label>
        <div className="frm-row2 mitad">
          <label className="fld">
            <span>Área</span>
            <select value={area} onChange={cambia(setArea)}>
              <option value="" disabled>Elige un área…</option>
              {AREAS.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </label>
          <label className="fld">
            <span>Puesto (opcional)</span>
            <input value={puesto} maxLength={80} onChange={cambia(setPuesto)} placeholder="Cocinero, ayudante…" />
          </label>
        </div>
        <div className="frm-row2 mitad">
          <label className="fld">
            <span>Turno (opcional)</span>
            <select value={turno} onChange={cambia(setTurno)}>
              <option value="">Sin turno fijo</option>
              {TURNOS.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </label>
          <label className="fld">
            <span>Fecha de ingreso (opcional)</span>
            <input type="date" value={fechaIngreso} max={toISO(new Date())} onChange={cambia(setFechaIngreso)} />
          </label>
        </div>
        <label className="frm-switch">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          <span className="frm-switch-ui" aria-hidden="true" />
          <span>{activo ? 'Activo' : 'Dado de baja'}</span>
        </label>

        {error && <p className="frm-error" role="alert">{error}</p>}

        <div className="lst-actions">
          <button type="button" className="lst-btn ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="lst-btn">{editando ? 'Guardar cambios' : 'Agregar colaborador'}</button>
        </div>
      </form>
    </Modal>
  );
}
