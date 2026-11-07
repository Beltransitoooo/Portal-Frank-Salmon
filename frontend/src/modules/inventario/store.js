/* Inventario: existencias por producto, guardado en el backend (FastAPI).
 * Lo que se captura aquí lo ven todos los dispositivos.
 *
 * producto = { id, nombre, categoria, cantidad, unidad, actualizadoEn }
 */
import { useSyncExternalStore } from 'react';
import { api, nuevoId } from '../../lib/api';
import { createRemoteCollection } from '../../lib/remoteCollection';

const col = createRemoteCollection({ path: '/inventario', legacyKey: 'fs_inventario' });

/* Mismo criterio que el servidor: sin espacios de sobra y sin importar mayúsculas */
export const limpiar = (t) => String(t || '').trim().replace(/\s+/g, ' ');
export const nombreRepetido = (nombre, exceptoId) => {
  const n = limpiar(nombre).toLowerCase();
  return col.getState().some((p) => p.id !== exceptoId && p.nombre.toLowerCase() === n);
};

export function addProducto({ nombre, categoria, cantidad, unidad }) {
  const producto = {
    id: nuevoId(),
    nombre: limpiar(nombre),
    categoria: limpiar(categoria),
    cantidad,
    unidad,
    actualizadoEn: new Date().toISOString(),
  };
  col.mutate({
    apply: (s) => [...s, producto],
    request: () => api('/inventario', { method: 'POST', body: producto }),
    revert: (s) => s.filter((p) => p.id !== producto.id),
  });
}

export function editarProducto(id, cambios) {
  const previo = col.getState().find((p) => p.id === id);
  if (!previo) return;
  const limpio = {
    ...cambios,
    ...(cambios.nombre !== undefined && { nombre: limpiar(cambios.nombre) }),
    ...(cambios.categoria !== undefined && { categoria: limpiar(cambios.categoria) }),
  };
  col.mutate({
    apply: (s) => s.map((p) => (p.id === id ? { ...p, ...limpio, actualizadoEn: new Date().toISOString() } : p)),
    request: () => api(`/inventario/${encodeURIComponent(id)}`, { method: 'PATCH', body: limpio }),
    revert: (s) => s.map((p) => (p.id === id ? previo : p)),
  });
}

export function borrarProducto(id) {
  const previo = col.getState().find((p) => p.id === id);
  if (!previo) return;
  col.mutate({
    apply: (s) => s.filter((p) => p.id !== id),
    request: () => api(`/inventario/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    revert: (s) => (s.some((p) => p.id === id) ? s : [...s, previo]),
  });
}

export const useInventario = () => useSyncExternalStore(col.subscribe, col.getSnapshot);

/* 'cargando' | 'listo' | 'error' */
export const useInventarioEstado = () => useSyncExternalStore(col.subscribe, col.getStatus);

/* Vuelve a pedir la lista al servidor; devuelve true si respondió */
export const recargarInventario = () => col.refresh();
