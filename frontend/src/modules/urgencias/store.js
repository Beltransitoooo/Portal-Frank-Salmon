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

export const useUrgencias = () => useSyncExternalStore(col.subscribe, col.getSnapshot);
