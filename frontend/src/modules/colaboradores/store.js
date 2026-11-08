/* Colaboradores: solo datos de trabajo, guardados en el backend (FastAPI).
 * Lo que se captura aquí lo ven todos los dispositivos.
 *
 * colaborador = { id, nombre, area, puesto, turno, fechaIngreso, activo, actualizadoEn }
 */
import { useSyncExternalStore } from 'react';
import { api, nuevoId } from '../../lib/api';
import { createRemoteCollection } from '../../lib/remoteCollection';

const col = createRemoteCollection({ path: '/colaboradores', legacyKey: 'fs_colaboradores' });

const limpiar = (t) => String(t || '').trim().replace(/\s+/g, ' ');

export function addColaborador({ nombre, area, puesto, turno, fechaIngreso, activo = true }) {
  const colaborador = {
    id: nuevoId(),
    nombre: limpiar(nombre),
    area,
    puesto: limpiar(puesto),
    turno: turno || '',
    fechaIngreso: fechaIngreso || null,
    activo,
    actualizadoEn: new Date().toISOString(),
  };
  col.mutate({
    apply: (s) => [...s, colaborador],
    request: () => api('/colaboradores', { method: 'POST', body: colaborador }),
    revert: (s) => s.filter((c) => c.id !== colaborador.id),
  });
}

export function editarColaborador(id, cambios) {
  const previo = col.getState().find((c) => c.id === id);
  if (!previo) return;
  const limpio = {
    ...cambios,
    ...(cambios.nombre !== undefined && { nombre: limpiar(cambios.nombre) }),
    ...(cambios.puesto !== undefined && { puesto: limpiar(cambios.puesto) }),
    ...(cambios.fechaIngreso !== undefined && { fechaIngreso: cambios.fechaIngreso || null }),
  };
  col.mutate({
    apply: (s) => s.map((c) => (c.id === id ? { ...c, ...limpio, actualizadoEn: new Date().toISOString() } : c)),
    request: () => api(`/colaboradores/${encodeURIComponent(id)}`, { method: 'PATCH', body: limpio }),
    revert: (s) => s.map((c) => (c.id === id ? previo : c)),
  });
}

export function borrarColaborador(id) {
  const previo = col.getState().find((c) => c.id === id);
  if (!previo) return;
  col.mutate({
    apply: (s) => s.filter((c) => c.id !== id),
    request: () => api(`/colaboradores/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    revert: (s) => (s.some((c) => c.id === id) ? s : [...s, previo]),
  });
}

export const useColaboradores = () => useSyncExternalStore(col.subscribe, col.getSnapshot);

/* 'cargando' | 'listo' | 'error' */
export const useColaboradoresEstado = () => useSyncExternalStore(col.subscribe, col.getStatus);

/* Vuelve a pedir la lista al servidor; devuelve true si respondió */
export const recargarColaboradores = () => col.refresh();
