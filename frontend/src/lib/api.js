/* Cliente mínimo para la API de FastAPI.
 *
 * La URL del backend sale de la variable VITE_API_URL (en Vercel: Settings → Environment
 * Variables). Si no está definida, usa el backend local de desarrollo.
 */
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} respondió ${res.status}`);
  return res.json();
}

export const nuevoId = () =>
  window.crypto && window.crypto.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
