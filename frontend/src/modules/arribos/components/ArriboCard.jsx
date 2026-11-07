import React from 'react';
import { diasHasta, formatFecha, formatHora, formatMomento } from '../../fechas';
import { recepcionar, regresarAPendiente } from '../store';

/* Etiqueta según qué tan cerca está la fecha esperada */
function etiqueta(fecha) {
  const d = diasHasta(fecha);
  if (d < 0) return { texto: 'Atrasado', clase: 'late' };
  if (d === 0) return { texto: 'Hoy', clase: 'today' };
  if (d === 1) return { texto: 'Mañana', clase: '' };
  return null;
}

export default function ArriboCard({ arribo, onCancelar }) {
  const pendiente = arribo.estado === 'pendiente';
  const tag = pendiente ? etiqueta(arribo.fecha) : null;

  return (
    <article className="arr-card">
      <header>
        <div>
          <h3>{arribo.proveedorNombre}</h3>
          <p className="arr-when">
            {formatFecha(arribo.fecha)} · {formatHora(arribo.hora)}
          </p>
        </div>
        {tag && <span className={`arr-tag ${tag.clase}`}>{tag.texto}</span>}
        {!pendiente && <span className="arr-tag ok">Recepcionado</span>}
      </header>

      <ul className="arr-items">
        {arribo.items.map((it, i) => (
          <li key={`${it.producto}-${i}`}>
            <span>{it.producto}</span>
            <b>{it.cantidad} {it.unidad}</b>
          </li>
        ))}
      </ul>

      {arribo.notas && <p className="arr-notes">{arribo.notas}</p>}

      <footer>
        {pendiente ? (
          <>
            {onCancelar && (
              <button type="button" className="arr-cancelar" onClick={() => onCancelar(arribo)}>
                Cancelar arribo
              </button>
            )}
            <button type="button" className="arr-btn" onClick={() => recepcionar(arribo.id)}>
              Marcar como recepcionado
            </button>
          </>
        ) : (
          <>
            <span className="arr-done">Recibido el {formatMomento(arribo.recepcionadoEn)}</span>
            <button type="button" className="arr-link" onClick={() => regresarAPendiente(arribo.id)}>
              Regresar a pendientes
            </button>
          </>
        )}
      </footer>
    </article>
  );
}