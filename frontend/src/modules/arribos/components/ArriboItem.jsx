import React from 'react';
import KebabMenu from '../../../components/Kebabmenu';
import { diasHasta, formatHora, horaDe } from '../../fechas';
import { recepcionar, regresarAPendiente } from '../store';

const Ico = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;
const ICON_OK = <Ico><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.8" /></Ico>;
const ICON_BACK = <Ico><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></Ico>;
const ICON_CANCELAR = <Ico><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></Ico>;

/* 12.5 -> "12.5", 1200 -> "1,200" */
const cifra = (n) => Number(n).toLocaleString('es-MX', { maximumFractionDigits: 2 });

/* Renglón de un arribo (mismo diseño que Inventario y Menú): proveedor, lo que trae y la hora */
export default function ArriboItem({ arribo, onCancelar }) {
  const pendiente = arribo.estado === 'pendiente';
  const dias = diasHasta(arribo.fecha);
  const [hora, ampm] = formatHora(arribo.hora).split(/ (.+)/);

  let tag = null;
  if (pendiente && dias < 0) tag = { texto: 'Atrasado', clase: 'alerta' };
  else if (pendiente && dias === 0) tag = { texto: 'Hoy', clase: 'naranja' };
  else if (!pendiente) tag = { texto: `Recibido ${horaDe(arribo.recepcionadoEn)}`, clase: 'ok' };

  const acciones = pendiente
    ? [
      { id: 'recibir', label: 'Marcar como recepcionado', icon: ICON_OK, onSelect: () => recepcionar(arribo.id) },
      { id: 'cancelar', label: 'Cancelar arribo', icon: ICON_CANCELAR, peligro: true, onSelect: () => onCancelar(arribo) },
    ]
    : [{ id: 'regresar', label: 'Regresar a pendientes', icon: ICON_BACK, onSelect: () => regresarAPendiente(arribo.id) }];

  return (
    <li className={`lst-item arr-item ${arribo.estado}${pendiente && dias < 0 ? ' atrasado' : ''}`}>
      <div className="lst-main">
        <h3>{arribo.proveedorNombre}</h3>
        <p className="arr-productos">
          {arribo.items.map((it) => `${it.producto} · ${cifra(it.cantidad)} ${it.unidad}`).join(', ')}
        </p>
        {arribo.notas && <p className="arr-notas">{arribo.notas}</p>}
        {tag && <span className={`lst-tag ${tag.clase}`}>{tag.texto}</span>}
      </div>
      <div className="lst-cifra">
        <b>{hora}</b>
        <span>{ampm}</span>
      </div>
      <KebabMenu label={`Opciones del arribo de ${arribo.proveedorNombre}`} items={acciones} />
    </li>
  );
}
