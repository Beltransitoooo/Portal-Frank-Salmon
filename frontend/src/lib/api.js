/* Cliente mínimo para la API de FastAPI.
 *
 * La URL del backend sale de la variable VITE_API_URL (en Vercel: Settings → Environment
 * Variables). Si no está definida, usa el backend local de desarrollo.
 *
 * Toda petición lleva el token de la sesión. Si el servidor responde 401 (sesión vencida o
 * contraseña cambiada en otro lado), se avisa a la app para regresar al login.
 */
import { EVENTO_SESION_TERMINADA, leerToken } from './sesion';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

export async function api(path, { method = 'GET', body } = {}) {
  const token = leerToken();
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let detalle = '';
    try {
      detalle = (await res.json()).detail;
      // Errores de validación (422): lista de campos; se toma el primer mensaje legible
      if (Array.isArray(detalle)) detalle = String(detalle[0]?.msg || '').replace(/^Value error, /, '');
    } catch {
      /* respuesta sin JSON */
    }
    if (res.status === 401 && path !== '/auth/login') {
      window.dispatchEvent(new CustomEvent(EVENTO_SESION_TERMINADA, { detail: detalle }));
    }
    const err = new Error(`${method} ${path} respondió ${res.status}`);
    err.status = res.status;
    err.detalle = typeof detalle === 'string' ? detalle : '';
    throw err;
  }
  return res.json();
}

export const nuevoId = () =>
  window.crypto && window.crypto.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
