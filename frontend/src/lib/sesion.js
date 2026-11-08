/* Sesión del usuario: el token firmado que entrega el servidor y sus datos (nombre, rol…).
 * Se guarda en localStorage para que al recargar la página no se regrese al login; se borra
 * al cerrar sesión o cuando el servidor responde que la sesión terminó. */
import { createContext, useContext } from 'react';

const SESION_KEY = 'fs_sesion';
const VISTA_KEY = 'fs_sesion_vista';
const VIEJA_KEY = 'fs_sesion_rol'; // versión anterior, sin login real

const leer = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const escribir = (key, valor) => {
  try {
    if (valor === null || valor === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, valor);
  } catch {
    /* sin almacenamiento disponible: simplemente no se recuerda */
  }
};

/* { token, usuario: { id, usuario, nombre, rol, debeCambiarPassword, ultimoAcceso } } | null */
export const leerSesion = () => {
  escribir(VIEJA_KEY, null);
  try {
    const s = JSON.parse(leer(SESION_KEY));
    return s && s.token && s.usuario ? s : null;
  } catch {
    return null;
  }
};
export const guardarSesion = (sesion) => escribir(SESION_KEY, JSON.stringify(sesion));
export const leerToken = () => leerSesion()?.token ?? null;

export const leerVista = () => leer(VISTA_KEY);
export const guardarVista = (id) => escribir(VISTA_KEY, id);

export const cerrarSesion = () => {
  escribir(SESION_KEY, null);
  escribir(VISTA_KEY, null);
};

/* Aviso a la app de que el servidor ya no reconoce la sesión (venció o se cambió la contraseña) */
export const EVENTO_SESION_TERMINADA = 'fs-sesion-terminada';

/* Contexto con el usuario, si puede modificar (admin) y cómo actualizar la sesión */
export const SesionContext = createContext({ usuario: null, puedeEditar: true, actualizarSesion: () => {}, salir: () => {} });
export const useSesion = () => useContext(SesionContext);

/* «Administrador» o «Solo consulta» */
export const roleLabel = (rol) => (String(rol || '').toLowerCase() === 'admin' ? 'Administrador' : 'Solo consulta');
