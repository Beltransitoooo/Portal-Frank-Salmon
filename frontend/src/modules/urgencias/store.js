/* Almacén de compras urgentes, guardado en el backend (FastAPI).
 * Lo que se captura aquí lo ven todos los dispositivos.
 *
 * urgencia = { id, producto, cantidad, unidad, notas, estado:'pendiente'|'surtido',
 *              creadoEn, surtidoEn? }
 */
import { useSyncExternalStore } from 'react';
import { api, nuevoId } from '../../lib/api';
import { createRemoteCollection } from '../../lib/remoteCollection';

const col = createRemoteCollection({ path: '/urgencias', legacyKey: 'fs_urgencias' });

export function addUrgencia({ producto, cantidad, unidad, notas }) {
  const item = {
    id: nuevoId(),
    producto,
    cantidad,
    unidad,
    notas,
    estado: 'pendiente',
    creadoEn: new Date().toISOString(),
    surtidoEn: null,
  };
  col.mutate({
    apply: (s) => [item, ...s],
    request: () =>
      api('/urgencias', { method: 'POST', body: { id: item.id, producto, cantidad, unidad, notas } }),
    revert: (s) => s.filter((u) => u.id !== item.id),
  });
  return item;
}

/* Cambia el estado; al pasar a «surtido» el servidor guarda cuándo, y al regresar lo borra */
export function setEstado(id, estado) {
  const previo = col.getState().find((u) => u.id === id);
  if (!previo) return;
  col.mutate({
    apply: (s) =>
      s.map((u) =>
        u.id === id
          ? { ...u, estado, surtidoEn: estado === 'surtido' ? new Date().toISOString() : null }
          : u
      ),
    request: () => api(`/urgencias/${encodeURIComponent(id)}`, { method: 'PATCH', body: { estado } }),
    revert: (s) => s.map((u) => (u.id === id ? previo : u)),
  });
}

/* Borra una urgencia pendiente capturada por error */
export function borrarUrgencia(id) {
  const previo = col.getState().find((u) => u.id === id);
  if (!previo || previo.estado !== 'pendiente') return;
  col.mutate({
    apply: (s) => s.filter((u) => u.id !== id),
    request: () => api(`/urgencias/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    revert: (s) => (s.some((u) => u.id === id) ? s : [...s, previo]),
  });
}

/* Borra para siempre las surtidas que se ven en pantalla (las pendientes no se tocan) */
export function limpiarSurtidos() {
  const quitadas = col.getState().filter((u) => u.estado === 'surtido');
  if (!quitadas.length) return;
  const ids = new Set(quitadas.map((u) => u.id));
  col.mutate({
    apply: (s) => s.filter((u) => !ids.has(u.id)),
    request: () => api('/urgencias/limpiar-surtidos', { method: 'POST', body: { ids: [...ids] } }),
    revert: (s) => [...s, ...quitadas.filter((u) => !s.some((x) => x.id === u.id))],
  });
}

export const useUrgencias = () => useSyncExternalStore(col.subscribe, col.getSnapshot);

/* 'cargando' | 'listo' | 'error' */
export const useUrgenciasEstado = () => useSyncExternalStore(col.subscribe, col.getStatus);

/* Vuelve a pedir la lista al servidor; devuelve true si respondió */
export const recargarUrgencias = () => col.refresh();
