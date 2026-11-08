/* Colección sincronizada con el backend, para usar con useSyncExternalStore.
 *
 * - Carga la lista de la API la primera vez que un componente la usa.
 * - Vuelve a pedirla cada POLL_MS (y al regresar a la pestaña) para ver lo que
 *   capturaron otros dispositivos.
 * - Los cambios se muestran al instante y se guardan en segundo plano; si el servidor
 *   falla, el cambio se deshace y se avisa.
 * - Si el navegador tenía datos de la versión anterior (localStorage), los sube una
 *   sola vez a la API y después los borra del navegador.
 */
import { api } from './api';
import { leerToken } from './sesion';

// Todas las colecciones, para poder reiniciarlas al entrar o salir de sesión
const COLECCIONES = new Set();

/* Vacía los datos de todas las colecciones (al cerrar sesión) y, si hay sesión, los vuelve a pedir */
export function reiniciarColecciones() {
  COLECCIONES.forEach((c) => c.reiniciar());
}

const POLL_MS = 15000;

export function createRemoteCollection({ path, legacyKey }) {
  let state = [];
  // 'cargando' hasta la primera respuesta; 'error' si nunca se pudo cargar; luego 'listo'
  let status = 'cargando';
  let pending = 0; // cambios enviados que todavía no responde el servidor
  let stale = false; // llegó una recarga mientras había cambios pendientes
  let started = false;
  const listeners = new Set();

  const notify = () => listeners.forEach((l) => l());
  const set = (next) => {
    state = next;
    notify();
  };

  /* Devuelve true si el servidor respondió (lo usa el botón «Actualizar») */
  async function refresh() {
    // Sin sesión no se consulta nada (el servidor respondería 401)
    if (!leerToken()) return false;
    // No pisar cambios que todavía se están guardando; se recarga al terminar
    if (pending > 0) {
      stale = true;
      return true;
    }
    try {
      const data = await api(path);
      if (pending > 0) {
        stale = true;
      } else {
        status = 'listo';
        set(data);
      }
      return true;
    } catch (err) {
      console.error(`No se pudo cargar ${path}:`, err);
      // Si ya había datos se siguen mostrando; el error solo importa si nunca cargó
      if (status !== 'listo') {
        status = 'error';
        notify();
      }
      return false;
    }
  }

  async function migrateLegacy() {
    let viejos;
    try {
      viejos = JSON.parse(localStorage.getItem(legacyKey));
    } catch {
      return;
    }
    if (!Array.isArray(viejos) || viejos.length === 0) return;
    try {
      await api(`${path}/importar`, { method: 'POST', body: viejos });
      localStorage.removeItem(legacyKey);
    } catch (err) {
      // Se queda en el navegador y se reintenta la próxima vez que se abra el portal
      console.error(`No se pudieron subir los datos guardados en este navegador (${legacyKey}):`, err);
    }
  }

  function start() {
    if (started) return;
    started = true;
    migrateLegacy().finally(refresh);
    setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refresh();
    });
  }

  /* apply: muestra el cambio al instante · request: lo guarda y devuelve el registro
   * del servidor · revert: deshace el cambio si falla */
  async function mutate({ apply, request, revert }) {
    set(apply(state));
    pending += 1;
    try {
      const saved = await request();
      set(state.map((x) => (x.id === saved.id ? saved : x)));
    } catch (err) {
      console.error(`No se pudo guardar en ${path}:`, err);
      set(revert(state));
      if (err.status !== 401) {
        window.alert(err.detalle || 'No se pudo guardar el cambio. Revisa tu conexión e inténtalo de nuevo.');
      }
    } finally {
      pending -= 1;
      if (pending === 0 && stale) {
        stale = false;
        refresh();
      }
    }
  }

  const subscribe = (l) => {
    start();
    listeners.add(l);
    return () => listeners.delete(l);
  };
  const getSnapshot = () => state;
  const getStatus = () => status;

  function reiniciar() {
    state = [];
    status = 'cargando';
    notify();
    if (started) refresh();
  }

  const coleccion = { subscribe, getSnapshot, getStatus, mutate, refresh, reiniciar, getState: () => state };
  COLECCIONES.add(coleccion);
  return coleccion;
}
