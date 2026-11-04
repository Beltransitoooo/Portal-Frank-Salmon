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

async function cargar() {
  try {
    set({ proveedores: await api('/proveedores'), error: false });
  } catch (err) {
    console.error('No se pudieron cargar los proveedores:', err);
    // Si ya había una lista, se sigue mostrando; solo se marca error si no hay nada
    if (!state.proveedores) set({ error: true });
  }
}

const ordenar = (lista) => [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

/* Da de alta un proveedor. Devuelve el proveedor guardado o lanza un Error con un
 * mensaje listo para mostrarse. */
export async function addProveedor(datos) {
  let nuevo;
  try {
    nuevo = await api('/proveedores', { method: 'POST', body: datos });
  } catch (err) {
    const msg = String(err.message || '');
    if (msg.includes('409')) throw new Error('Ya existe un proveedor con ese nombre.');
    if (msg.includes('422')) throw new Error('Revisa los datos: falta algún campo o no es válido.');
    throw new Error('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.');
  }
  set({ proveedores: ordenar([...(state.proveedores || []), nuevo]), error: false });
  return nuevo;
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

export function useProveedores() {
  const s = useSyncExternalStore(subscribe, getSnapshot);
  useEffect(() => {
    cargar();
  }, []);
  return { proveedores: s.proveedores || [], cargando: !s.proveedores && !s.error, error: s.error };
}
