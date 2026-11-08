/* Proveedores desde el backend (FastAPI).
 * La lista se comparte entre pantallas y se vuelve a pedir cada vez que se abre el módulo,
 * para ver los proveedores que se dieron de alta desde otros dispositivos. */
import { useEffect, useSyncExternalStore } from 'react';
import { api } from '../../lib/api';
import { leerToken } from '../../lib/sesion';

let state = { proveedores: null, error: false };
const listeners = new Set();
const set = (patch) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

/* Pide la lista al servidor. Devuelve true si se pudo (lo usa el botón «Actualizar»). */
export async function recargarProveedores() {
  if (!leerToken()) return false; // sin sesión no se consulta
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

/* Vacía la lista (al cambiar de sesión); se vuelve a pedir al abrir el módulo o el inicio */
export function reiniciarProveedores() {
  set({ proveedores: null, error: false });
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
    if (err.status === 403 || err.status === 401) throw new Error(err.detalle || 'No tienes permiso para hacer este cambio.');
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

/* Habilita o deshabilita un proveedor. El cambio se ve al instante; si el servidor falla,
 * se deshace y lanza un Error con mensaje. */
export async function cambiarActivoProveedor(id, activo) {
  const previo = (state.proveedores || []).find((p) => p.id === id);
  if (!previo || previo.activo === activo) return previo;
  const poner = (p) => set({ proveedores: (state.proveedores || []).map((x) => (x.id === id ? p : x)) });
  poner({ ...previo, activo });
  try {
    const guardado = await enviar(`/proveedores/${encodeURIComponent(id)}/activo`, 'PATCH', { activo });
    poner(guardado);
    return guardado;
  } catch (err) {
    poner(previo);
    throw err;
  }
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
