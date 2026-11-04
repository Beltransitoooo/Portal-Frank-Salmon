/* Almacén de arribos compartido entre Proveedores (agrega) y Arribos (consulta y recepciona),
 * guardado en el backend (FastAPI). Lo que se captura aquí lo ven todos los dispositivos.
 *
 * arribo = { id, proveedorId, proveedorNombre, fecha:'YYYY-MM-DD', hora:'HH:MM',
 *            items:[{producto, cantidad, unidad}], notas, estado:'pendiente'|'recepcionado',
 *            creadoEn, recepcionadoEn? }
 */
import { useSyncExternalStore } from 'react';
import { api, nuevoId } from '../../lib/api';
import { createRemoteCollection } from '../../lib/remoteCollection';

const col = createRemoteCollection({ path: '/arribos', legacyKey: 'fs_arribos' });

export function addArribo(data) {
  const arribo = {
    ...data,
    id: nuevoId(),
    estado: 'pendiente',
    creadoEn: new Date().toISOString(),
    recepcionadoEn: null,
  };
  const { proveedorId, fecha, hora, items, notas } = arribo;
  col.mutate({
    apply: (s) => [arribo, ...s],
    request: () =>
      api('/arribos', {
        method: 'POST',
        body: { id: arribo.id, proveedorId, fecha, hora, items, notas },
      }),
    revert: (s) => s.filter((a) => a.id !== arribo.id),
  });
  return arribo;
}

function cambiarEstado(id, estado) {
  const previo = col.getState().find((a) => a.id === id);
  if (!previo) return;
  col.mutate({
    apply: (s) =>
      s.map((a) =>
        a.id === id
          ? { ...a, estado, recepcionadoEn: estado === 'recepcionado' ? new Date().toISOString() : null }
          : a
      ),
    request: () => api(`/arribos/${encodeURIComponent(id)}`, { method: 'PATCH', body: { estado } }),
    revert: (s) => s.map((a) => (a.id === id ? previo : a)),
  });
}

export const recepcionar = (id) => cambiarEstado(id, 'recepcionado');
export const regresarAPendiente = (id) => cambiarEstado(id, 'pendiente');

export const useArribos = () => useSyncExternalStore(col.subscribe, col.getSnapshot);
