/* Almacén de arribos compartido entre Proveedores (agrega) y Arribos (consulta y recepciona).
 *
 * POR AHORA guarda en localStorage del navegador, así que solo se ven los datos de esta
 * computadora. Cuando conectemos FastAPI, solo hay que cambiar el interior de estas
 * funciones por llamadas a la API; los módulos no se enteran.
 */
import { useSyncExternalStore } from 'react';

const KEY = 'fs_arribos';
const listeners = new Set();

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

let state = load();

function commit(next) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* sin almacenamiento disponible */
  }
  listeners.forEach((l) => l());
}

// Mantener sincronizadas varias pestañas abiertas
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    state = load();
    listeners.forEach((l) => l());
  }
});

const newId = () =>
  (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : `a${Date.now()}${Math.random()}`);

/* arribo = { proveedorId, proveedorNombre, fecha:'YYYY-MM-DD', hora:'HH:MM',
 *            items:[{producto, cantidad, unidad}], notas } */
export function addArribo(data) {
  const arribo = {
    ...data,
    id: newId(),
    estado: 'pendiente',
    creadoEn: new Date().toISOString(),
  };
  commit([arribo, ...state]);
  return arribo;
}

export function recepcionar(id) {
  commit(
    state.map((a) =>
      a.id === id ? { ...a, estado: 'recepcionado', recepcionadoEn: new Date().toISOString() } : a
    )
  );
}

export function regresarAPendiente(id) {
  commit(
    state.map((a) => {
      if (a.id !== id) return a;
      const { recepcionadoEn, ...resto } = a;
      return { ...resto, estado: 'pendiente' };
    })
  );
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

export const useArribos = () => useSyncExternalStore(subscribe, getSnapshot);