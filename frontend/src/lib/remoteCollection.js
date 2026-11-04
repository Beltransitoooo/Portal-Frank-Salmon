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

const POLL_MS = 15000;

export function createRemoteCollection({ path, legacyKey }) {
  let state = [];
  let pending = 0; // cambios enviados que todavía no responde el servidor
  let stale = false; // llegó una recarga mientras había cambios pendientes
  let started = false;
  const listeners = new Set();

  const set = (next) => {
    state = next;
    listeners.forEach((l) => l());
  };

  async function refresh() {
    // No pisar cambios que todavía se están guardando; se recarga al terminar
    if (pending > 0) {
      stale = true;
      return;
    }
    try {
      const data = await api(path);
      if (pending > 0) stale = true;
      else set(data);
    } catch (err) {
      console.error(`No se pudo cargar ${path}:`, err);
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
      window.alert('No se pudo guardar el cambio. Revisa tu conexión e inténtalo de nuevo.');
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

  return { subscribe, getSnapshot, mutate, getState: () => state };
}
