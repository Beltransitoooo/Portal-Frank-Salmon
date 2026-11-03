import React from 'react';
import KebabMenu from '../../../components/Kebabmenu';
import { formatMomento } from '../../fechas';

const Ico = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;
const ICON_OK = <Ico><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.8" /></Ico>;
const ICON_BACK = <Ico><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></Ico>;
const ICON_INFO = <Ico><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></Ico>;

export default function UrgenciaItem({ item, onToggleEstado, onDetalles }) {
  const pendiente = item.estado === 'pendiente';

  const items = [
    {
      id: 'estado',
      label: pendiente ? 'Marcar como surtido' : 'Regresar a pendiente',
      icon: pendiente ? ICON_OK : ICON_BACK,
      onSelect: () => onToggleEstado(item),
    },
    { id: 'detalles', label: 'Detalles', icon: ICON_INFO, onSelect: () => onDetalles(item) },
  ];

  return (
    <li className={`urg-item ${item.estado}`}>
      <span className="urg-dot" aria-hidden="true" />
      <div className="urg-main">
        <h3>{item.producto}</h3>
        <p>
          {item.cantidad} {item.unidad}
          <span aria-hidden="true"> · </span>
          {pendiente
            ? `Solicitado ${formatMomento(item.creadoEn)}`
            : `Surtido ${formatMomento(item.surtidoEn)}`}
        </p>
      </div>
      <span className="urg-state">{pendiente ? 'Pendiente' : 'Surtido'}</span>
      <KebabMenu label={`Opciones de ${item.producto}`} items={items} />
    </li>
  );
}