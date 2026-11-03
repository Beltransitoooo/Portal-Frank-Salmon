/* Proveedores del portal.
 *
 * ⚠️ Los productos, días y hora de AROS son DE EJEMPLO: edítalos aquí con los datos reales.
 * Más adelante esta lista vendrá de FastAPI (api.js) y este archivo desaparece.
 *
 * dias: 0 = domingo, 1 = lunes ... 6 = sábado
 */
export const UNIDADES = ['kg', 'pzas', 'cajas', 'bolsas', 'litros'];

export const PROVEEDORES = [
  {
    id: 'aros',
    nombre: 'AROS',
    categoria: 'Mariscos',
    productos: [
      { nombre: 'Camarón', unidad: 'kg' },
      { nombre: 'Pulpo', unidad: 'kg' },
      { nombre: 'Callo de hacha', unidad: 'kg' },
      { nombre: 'Pescado fresco', unidad: 'kg' },
    ],
    dias: [1, 3, 5],
    hora: '07:00',
  },
];