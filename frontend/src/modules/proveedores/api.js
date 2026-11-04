/* Proveedores desde el backend (FastAPI).
 * La lista se comparte entre pantallas y se vuelve a pedir cada vez que se abre el módulo,
 * para ver los proveedores que se dieron de alta desde otros dispositivos. */
import { useEffect, useSyncExternalStore } from 'react';
import { api } from '../../lib/api';

let state = { proveedores: null, error: false };
const listeners = new Set();
const set = (patch) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

/* Pide la lista al servidor. Devuelve true si se pudo (lo usa el botón «Actualizar»). */
export async function recargarProveedores() {
  try {
    set({ proveedores: await api('/proveedores'), error: false });
    return true;
  } catch (err) {
    console.error('No se pudieron cargar los proveedores:', err);
    // Si ya había una lista, se sigue mostrando; solo se marca error si no hay nada
    if (!state.proveedores) set({ error: true });
    return false;
  }
}

const ordenar = (lista) => [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

/* Envía el alta o la edición y traduce los errores a un mensaje listo para mostrarse */
async function enviar(path, method, datos) {
  try {
    return await api(path, { method, body: datos });
  } catch (err) {
    const msg = String(err.message || '');
    if (msg.includes('409')) throw new Error('Ya existe un proveedor con ese nombre.');
    if (msg.includes('404')) throw new Error('Este proveedor ya no existe. Actualiza la lista.');
    if (msg.includes('422')) throw new Error('Revisa los datos: falta algún campo o no es válido.');
    throw new Error('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.');
  }
}

/* Da de alta un proveedor. Devuelve el proveedor guardado o lanza un Error con mensaje. */
export async function addProveedor(datos) {
  const nuevo = await enviar('/proveedores', 'POST', datos);
  set({ proveedores: ordenar([...(state.proveedores || []), nuevo]), error: false });
  return nuevo;
}

/* Reemplaza los datos de un proveedor (mismos campos que el alta). */
export async function updateProveedor(id, datos) {
  const editado = await enviar(`/proveedores/${encodeURIComponent(id)}`, 'PATCH', datos);
  set({ proveedores: ordenar((state.proveedores || []).map((p) => (p.id === id ? editado : p))) });
  return editado;
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

export function useProveedores() {
  const s = useSyncExternalStore(subscribe, getSnapshot);
  useEffect(() => {
    recargarProveedores();
  }, []);
  return { proveedores: s.proveedores || [], cargando: !s.proveedores && !s.error, error: s.error };
}
