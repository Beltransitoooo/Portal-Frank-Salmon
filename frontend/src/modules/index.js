/* Lista central de módulos del portal.
 *
 * - Cada módulo con `Component` se abre dentro del panel (recibe onBack y onOpenModule).
 * - `soon: true` marca los que todavía están en desarrollo (la tarjeta dice «Próximamente»).
 *   Cuando uno esté listo, cambia su `Component` por la pantalla real y quita `soon`.
 */
import { IconSupplier, IconArrivals, IconUrgent, IconUsers, IconPayroll, IconMenuBook } from './icons';
import Proveedores from './proveedores';
import Arribos from './arribos';
import Urgencias from './urgencias';
import Colaboradores from './colaboradores';
import Nomina from './nomina';
import Menu from './menu';

export const MODULES = [
  {
    id: 'proveedores',
    title: 'Proveedores',
    description: 'Gestión, compras y trazabilidad de proveedores de mariscos e insumos.',
    icon: IconSupplier,
    Component: Proveedores,
  },
  {
    id: 'arribos',
    title: 'Arribos',
    description: 'Arribos pendientes y recepcionados de tus proveedores.',
    icon: IconArrivals,
    Component: Arribos,
  },
  {
    id: 'urgencias',
    title: 'Urgencias',
    description: 'Compras urgentes: lo que está pendiente y lo que ya se surtió.',
    icon: IconUrgent,
    Component: Urgencias,
  },
  {
    id: 'colaboradores',
    title: 'Colaboradores',
    description: 'Administración de personal y expedientes de tu equipo.',
    icon: IconUsers,
    soon: true,
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
    description: 'Platillos, precios y presentación del menú del restaurante.',
    icon: IconMenuBook,
    soon: true,
    Component: Menu,
  },
];