/* Recuerda la sesión y la pantalla abierta para que al recargar la página
 * (con o sin caché) no se regrese al login. Se guarda en localStorage, que no
 * depende de la caché del navegador, y se borra al cerrar sesión. */
const ROL_KEY = 'fs_sesion_rol';
const VISTA_KEY = 'fs_sesion_vista';

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

export const leerRol = () => {
  const rol = leer(ROL_KEY);
  return rol === 'admin' || rol === 'basic' ? rol : null;
};
export const guardarRol = (rol) => escribir(ROL_KEY, rol);

export const leerVista = () => leer(VISTA_KEY);
export const guardarVista = (id) => escribir(VISTA_KEY, id);

export const cerrarSesion = () => {
  escribir(ROL_KEY, null);
  escribir(VISTA_KEY, null);
};
