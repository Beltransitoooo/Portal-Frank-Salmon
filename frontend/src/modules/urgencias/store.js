/* Almacén de compras urgentes.
 *
 * POR AHORA guarda en localStorage del navegador (solo se ve en esta computadora).
 * Cuando conectemos FastAPI, solo cambia el interior de estas funciones.
 *
 * urgencia = { id, producto, cantidad, unidad, notas, estado:'pendiente'|'surtido',
 *              creadoEn, surtidoEn? }
 */
import { useSyncExternalStore } from 'react';

const KEY = 'fs_urgencias';
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

window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    state = load();
    listeners.forEach((l) => l());
  }
});

const newId = () =>
  (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : `u${Date.now()}${Math.random()}`);

export function addUrgencia({ producto, cantidad, unidad, notas }) {
  const item = {
    id: newId(),
    producto,
    cantidad,
    unidad,
    notas,
    estado: 'pendiente',
    creadoEn: new Date().toISOString(),
  };
  commit([item, ...state]);
  return item;
}

/* Cambia el estado; al pasar a «surtido» guarda cuándo, y al regresar lo borra */
export function setEstado(id, estado) {
  commit(
    state.map((u) => {
      if (u.id !== id) return u;
      if (estado === 'surtido') return { ...u, estado, surtidoEn: new Date().toISOString() };
      const { surtidoEn, ...resto } = u;
      return { ...resto, estado };
    })
  );
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

export const useUrgencias = () => useSyncExternalStore(subscribe, getSnapshot);