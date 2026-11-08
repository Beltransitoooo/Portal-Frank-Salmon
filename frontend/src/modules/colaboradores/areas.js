/* Áreas fijas del personal, en el orden en que se muestran.
 * La misma lista de claves vive en el backend (schemas.AREAS_COLABORADORES). */
export const AREAS = [
  { id: 'barra-fria', nombre: 'Barra fría' },
  { id: 'barra-caliente', nombre: 'Barra caliente' },
  { id: 'barra-bebidas', nombre: 'Barra de bebidas' },
  { id: 'caja', nombre: 'Caja' },
  { id: 'meseros', nombre: 'Meseros' },
  { id: 'gerentes', nombre: 'Gerentes' },
  { id: 'duenos', nombre: 'Dueños' },
];

export const TURNOS = [
  { id: 'matutino', nombre: 'Matutino' },
  { id: 'vespertino', nombre: 'Vespertino' },
  { id: 'completo', nombre: 'Completo' },
];

export const nombreArea = (id) => AREAS.find((a) => a.id === id)?.nombre ?? id;
export const ordenArea = (id) => {
  const i = AREAS.findIndex((a) => a.id === id);
  return i === -1 ? AREAS.length : i;
};
export const nombreTurno = (id) => TURNOS.find((t) => t.id === id)?.nombre ?? '';

/* Antigüedad desde "YYYY-MM-DD": { num: 3, unidad: 'años' } · { num: 5, unidad: 'meses' } · null */
export function antiguedad(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const hoy = new Date();
  let meses = (hoy.getFullYear() - y) * 12 + (hoy.getMonth() + 1 - m);
  if (hoy.getDate() < d) meses -= 1;
  if (meses < 0) return null;
  if (meses < 1) return { num: 'Nuevo', unidad: '' };
  if (meses < 12) return { num: meses, unidad: meses === 1 ? 'mes' : 'meses' };
  const anios = Math.floor(meses / 12);
  return { num: anios, unidad: anios === 1 ? 'año' : 'años' };
}
