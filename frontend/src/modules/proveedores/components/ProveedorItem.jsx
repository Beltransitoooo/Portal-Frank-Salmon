import React from 'react';
import KebabMenu from '../../../components/Kebabmenu';
import { DIAS, formatHora } from '../../fechas';

const Ico = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;
const ACCIONES = [
  { id: 'arribo', label: 'Agregar arribo', icon: <Ico><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="M12 8v8M8 12h8" /></Ico> },
  { id: 'detalles', label: 'Detalles', icon: <Ico><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></Ico> },
  { id: 'fechas', label: 'Fechas', icon: <Ico><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></Ico> },
  { id: 'editar', label: 'Editar proveedor', icon: <Ico><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z" /><path d="M13.5 8.5l3 3" /></Ico> },
];

/* Renglón de un proveedor (mismo diseño que Inventario y Menú): días de entrega y lo que surte */
export default function ProveedorItem({ proveedor, onAction }) {
  const dias = [...proveedor.dias].sort((a, b) => a - b).map((d) => DIAS[d]).join(', ');
  const n = proveedor.productos.length;
  return (
    <li className="lst-item">
      <div className="lst-main">
        <h3>{proveedor.nombre}</h3>
        <p>Entrega {dias || 'sin días'}{proveedor.hora ? ` · ${formatHora(proveedor.hora)}` : ''}</p>
        {n > 0 && <p className="prov-productos">{proveedor.productos.map((p) => p.nombre).join(', ')}</p>}
      </div>
      <div className="lst-cifra">
        <b>{n}</b>
        <span>{n === 1 ? 'producto' : 'productos'}</span>
      </div>
      <KebabMenu
        label={`Opciones de ${proveedor.nombre}`}
        items={ACCIONES.map((a) => ({ ...a, onSelect: () => onAction(a.id, proveedor) }))}
      />
    </li>
  );
}
