/* Lista central de módulos del portal.
 *
 * - Cada módulo con `Component` se abre dentro del panel (recibe onBack y onOpenModule).
 * - `soon: true` marca los que todavía están en desarrollo (su tarjeta del inicio dice «En desarrollo»
 *   y no aparecen en la barra de navegación).
 *   Cuando uno esté listo, cambia su `Component` por la pantalla real y quita `soon`.
 */
import { IconSupplier, IconArrivals, IconUrgent, IconBox, IconUsers, IconPayroll, IconMenuBook } from './Icons';
import Proveedores from './proveedores';
import Arribos from './arribos';
import Urgencias from './urgencias';
import Inventario from './inventario';
import Colaboradores from './colaboradores';
import Nomina from './nomina';
import Menu from './menu';

export const MODULES = [
  {
    id: 'proveedores',
    title: 'Proveedores',
    description: 'Quién te surte, qué trae y qué días llega.',
    icon: IconSupplier,
    Component: Proveedores,
  },
  {
    id: 'arribos',
    title: 'Arribos',
    description: 'Lo que esperas de tus proveedores y lo que ya llegó.',
    icon: IconArrivals,
    Component: Arribos,
  },
  {
    id: 'urgencias',
    title: 'Urgencias',
    description: 'Compras urgentes que necesitan surtirse.',
    icon: IconUrgent,
    Component: Urgencias,
  },
  {
    id: 'inventario',
    title: 'Inventario',
    description: 'Existencias por producto: qué tienes y cuánto.',
    icon: IconBox,
    Component: Inventario,
  },
  {
    id: 'colaboradores',
    title: 'Colaboradores',
    description: 'Tu equipo por área: puesto, turno y antigüedad.',
    icon: IconUsers,
    Component: Colaboradores,
  },
  {
    id: 'nomina',
    title: 'Nómina',
    description: 'Percepciones, deducciones y pagos del personal.',
    icon: IconPayroll,
    soon: true,
    Component: Nomina,
  },
  {
    id: 'menu',
    title: 'Menú',
    description: 'Platillos, precios y secciones del restaurante.',
    icon: IconMenuBook,
    Component: Menu,
  },
];