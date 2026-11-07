/* Secciones fijas del menú, en el orden en que se muestran.
 * La misma lista de claves vive en el backend (schemas.SECCIONES_MENU). */
export const SECCIONES = [
  { id: 'para-comenzar', nombre: 'Para comenzar' },
  { id: 'tostadas', nombre: 'Tostadas' },
  { id: 'tacos', nombre: 'Tacos' },
  { id: 'sushis', nombre: 'Sushis' },
  { id: 'aguachiles', nombre: 'Aguachiles' },
  { id: 'ceviches', nombre: 'Ceviches' },
  { id: 'cocteles', nombre: 'Cocteles' },
  { id: 'filetes', nombre: 'Filetes' },
  { id: 'antojos-de-mar', nombre: 'Antojos de mar' },
  { id: 'camarones', nombre: 'Camarones' },
  { id: 'salmones', nombre: 'Salmones' },
  { id: 'ensaladas', nombre: 'Ensaladas' },
  { id: 'pastas', nombre: 'Pastas' },
  { id: 'sopas', nombre: 'Sopas' },
  { id: 'frankids', nombre: 'Frankids' },
  { id: 'postres', nombre: 'Postres' },
  { id: 'res', nombre: 'Res' },
  { id: 'hamburguesas', nombre: 'Hamburguesas' },
  { id: 'mixologia', nombre: 'Mixología' },
  { id: 'mokteles', nombre: 'Mokteles' },
  { id: 'bebidas', nombre: 'Bebidas' },
  { id: 'cerveza', nombre: 'Cerveza' },
  { id: 'bar', nombre: 'Bar' },
];

export const nombreSeccion = (id) => SECCIONES.find((s) => s.id === id)?.nombre ?? id;
export const ordenSeccion = (id) => {
  const i = SECCIONES.findIndex((s) => s.id === id);
  return i === -1 ? SECCIONES.length : i;
};

/* 245.5 -> "$245.50" */
export const precioMXN = (n) =>
  Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
