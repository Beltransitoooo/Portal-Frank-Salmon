/* Utilidades de fechas y horas compartidas entre módulos */

export const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DIAS_LARGO = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/* Date -> "YYYY-MM-DD" en hora local */
export const toISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/* Primera fecha desde hoy cuyo día de la semana está en `dias` (0 = domingo) */
export function proximaFecha(dias) {
  const d = new Date();
  for (let i = 0; i < 8; i += 1) {
    if (dias.includes(d.getDay())) return toISO(d);
    d.setDate(d.getDate() + 1);
  }
  return toISO(new Date());
}

/* "07:00" -> "7:00 a. m." */
export function formatHora(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suf = h >= 12 ? 'p. m.' : 'a. m.';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suf}`;
}

const parse = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/* "2026-10-30" -> "vie 30 oct" */
export const formatFecha = (iso) =>
  parse(iso)
    .toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\./g, '');

/* Días que faltan desde hoy (negativo = ya pasó) */
export function diasHasta(iso) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((parse(iso) - hoy) / 86400000);
}

/* Marca de tiempo ISO -> "30 oct, 7:15 a. m." */
export const formatMomento = (isoString) =>
  new Date(isoString)
    .toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    .replace(/\./g, '');
/* Marca de tiempo ISO -> "hace 5 min", "hace 2 h", "hace 3 días" */
export function haceCuanto(isoString) {
  const min = Math.max(0, Math.round((Date.now() - new Date(isoString).getTime()) / 60000));
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
}
