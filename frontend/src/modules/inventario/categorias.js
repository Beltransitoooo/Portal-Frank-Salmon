/* Categorías fijas del inventario, en el orden en que se muestran.
 * La misma lista de claves vive en el backend (schemas.CATEGORIAS_INVENTARIO). */
export const CATEGORIAS = [
  { id: 'mariscos', nombre: 'Mariscos' },
  { id: 'cerveza', nombre: 'Cerveza' },
  { id: 'coca-cola', nombre: 'Coca-Cola' },
  { id: 'abarrote', nombre: 'Abarrote' },
  { id: 'plasticos', nombre: 'Plásticos' },
  { id: 'quimicos', nombre: 'Químicos' },
];

export const SIN_CATEGORIA = 'Sin categoría';

export const esCategoria = (id) => CATEGORIAS.some((c) => c.id === id);

/* Productos capturados antes de la lista fija conservan su texto hasta que se editen */
export const nombreCategoria = (id) => CATEGORIAS.find((c) => c.id === id)?.nombre ?? (id || SIN_CATEGORIA);

/* Orden del menú de categorías; las viejas o vacías van al final */
export const ordenCategoria = (id) => {
  const i = CATEGORIAS.findIndex((c) => c.id === id);
  return i === -1 ? CATEGORIAS.length + (id ? 0 : 1) : i;
};
