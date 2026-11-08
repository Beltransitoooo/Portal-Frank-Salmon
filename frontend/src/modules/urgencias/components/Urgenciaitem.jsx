import React from 'react';
import KebabMenu from '../../../components/Kebabmenu';
import { haceCuanto, horaDe } from '../../fechas';

const Ico = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;
const ICON_OK = <Ico><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.8" /></Ico>;
const ICON_BACK = <Ico><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></Ico>;
const ICON_INFO = <Ico><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></Ico>;
const ICON_BORRAR = <Ico><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Ico>;

/* 12.5 -> "12.5", 1200 -> "1,200" */
const cifra = (n) => Number(n).toLocaleString('es-MX', { maximumFractionDigits: 2 });

/* Renglón de una compra urgente (mismo diseño que Inventario y Menú) */
export default function UrgenciaItem({ item, onToggleEstado, onDetalles, onBorrar }) {
  const pendiente = item.estado === 'pendiente';

  const items = [
    {
      id: 'estado',
      label: pendiente ? 'Marcar como surtido' : 'Regresar a pendiente',
      icon: pendiente ? ICON_OK : ICON_BACK,
      onSelect: () => onToggleEstado(item),
    },
    { id: 'detalles', label: 'Detalles', icon: ICON_INFO, lectura: true, onSelect: () => onDetalles(item) },
  ];
  // Solo las pendientes se pueden borrar (por si se capturó por error)
  if (pendiente && onBorrar) {
    items.push({ id: 'borrar', label: 'Borrar', icon: ICON_BORRAR, peligro: true, onSelect: () => onBorrar(item) });
  }

  return (
    <li className={`lst-item urg-item ${item.estado}`}>
      <div className="lst-main">
        <h3>{item.producto}</h3>
        <p>
          {pendiente
            ? `Solicitado ${haceCuanto(item.creadoEn)} · ${horaDe(item.creadoEn)}`
            : `Surtido a las ${horaDe(item.surtidoEn)}`}
          {item.notas ? ` · ${item.notas}` : ''}
        </p>
        <span className={`lst-tag ${pendiente ? 'naranja' : 'ok'}`}>{pendiente ? 'Pendiente' : 'Surtido'}</span>
      </div>
      <div className="lst-cifra">
        <b>{cifra(item.cantidad)}</b>
        <span>{item.unidad}</span>
      </div>
      <KebabMenu label={`Opciones de ${item.producto}`} items={items} />
    </li>
  );
}
