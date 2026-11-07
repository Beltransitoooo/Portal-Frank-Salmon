/* Menú: platillos por sección, guardado en el backend (FastAPI).
 * Lo que se captura aquí lo ven todos los dispositivos.
 *
 * platillo = { id, nombre, seccion, precio, descripcion, disponible, actualizadoEn }
 */
import { useSyncExternalStore } from 'react';
import { api, nuevoId } from '../../lib/api';
import { createRemoteCollection } from '../../lib/remoteCollection';

const col = createRemoteCollection({ path: '/menu', legacyKey: 'fs_menu' });

/* Mismo criterio que el servidor: sin espacios de sobra y sin importar mayúsculas */
export const limpiar = (t) => String(t || '').trim().replace(/\s+/g, ' ');
export const nombreRepetido = (nombre, seccion, exceptoId) => {
  const n = limpiar(nombre).toLowerCase();
  return col.getState().some((p) => p.id !== exceptoId && p.seccion === seccion && p.nombre.toLowerCase() === n);
};

export function addPlatillo({ nombre, seccion, precio, descripcion, disponible = true }) {
  const platillo = {
    id: nuevoId(),
    nombre: limpiar(nombre),
    seccion,
    precio: Math.round(precio * 100) / 100,
    descripcion: String(descripcion || '').trim(),
    disponible,
    actualizadoEn: new Date().toISOString(),
  };
  col.mutate({
    apply: (s) => [...s, platillo],
    request: () => api('/menu', { method: 'POST', body: platillo }),
    revert: (s) => s.filter((p) => p.id !== platillo.id),
  });
}

export function editarPlatillo(id, cambios) {
  const previo = col.getState().find((p) => p.id === id);
  if (!previo) return;
  const limpio = {
    ...cambios,
    ...(cambios.nombre !== undefined && { nombre: limpiar(cambios.nombre) }),
    ...(cambios.descripcion !== undefined && { descripcion: String(cambios.descripcion).trim() }),
    ...(cambios.precio !== undefined && { precio: Math.round(cambios.precio * 100) / 100 }),
  };
  col.mutate({
    apply: (s) => s.map((p) => (p.id === id ? { ...p, ...limpio, actualizadoEn: new Date().toISOString() } : p)),
    request: () => api(`/menu/${encodeURIComponent(id)}`, { method: 'PATCH', body: limpio }),
    revert: (s) => s.map((p) => (p.id === id ? previo : p)),
  });
}

export function borrarPlatillo(id) {
  const previo = col.getState().find((p) => p.id === id);
  if (!previo) return;
  col.mutate({
    apply: (s) => s.filter((p) => p.id !== id),
    request: () => api(`/menu/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    revert: (s) => (s.some((p) => p.id === id) ? s : [...s, previo]),
  });
}

export const useMenu = () => useSyncExternalStore(col.subscribe, col.getSnapshot);

/* 'cargando' | 'listo' | 'error' */
export const useMenuEstado = () => useSyncExternalStore(col.subscribe, col.getStatus);

/* Vuelve a pedir la lista al servidor; devuelve true si respondió */
export const recargarMenu = () => col.refresh();
