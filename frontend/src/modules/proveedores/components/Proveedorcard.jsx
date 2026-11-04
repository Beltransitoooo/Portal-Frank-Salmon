import React, { useEffect, useRef, useState } from 'react';
import { DIAS, DIAS_LARGO, diasHasta, formatFecha, formatHora, proximaFecha } from '../../fechas';

/* "Hoy", "Mañana" o "vie 6 nov" según el próximo día de entrega */
function textoProxima(dias) {
  if (!dias.length) return 'Sin días fijos';
  const iso = proximaFecha(dias);
  const d = diasHasta(iso);
  if (d === 0) return 'Hoy';
  if (d === 1) return 'Mañana';
  return formatFecha(iso);
}

const Ico = ({ children }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
);

const ACCIONES = [
  { id: 'detalles', label: 'Detalles', icon: <Ico><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></Ico> },
  { id: 'fechas', label: 'Fechas', icon: <Ico><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></Ico> },
  { id: 'arribo', label: 'Agregar arribo', icon: <Ico><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="M12 8v8M8 12h8" /></Ico> },
];

export default function ProveedorCard({ proveedor, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Cerrar el menú al hacer clic fuera o con Esc
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (id) => {
    setOpen(false);
    onAction(id, proveedor);
  };

  return (
    <article className="prov-card">
      <div className="prov-top">
        <div className="prov-avatar" aria-hidden="true">{proveedor.nombre.charAt(0)}</div>

        <div className="prov-menu" ref={ref}>
          <button
            type="button"
            className="prov-kebab"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`Opciones de ${proveedor.nombre}`}
            onClick={() => setOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" />
            </svg>
          </button>

          {open && (
            <div className="prov-pop" role="menu">
              {ACCIONES.map((a) => (
                <button key={a.id} type="button" role="menuitem" onClick={() => choose(a.id)}>
                  {a.icon}
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <h3>{proveedor.nombre}</h3>
      {proveedor.categoria && <span className="prov-chip">{proveedor.categoria}</span>}

      <div className="prov-facts">
        <div>
          <span>Próxima entrega</span>
          <b>{textoProxima(proveedor.dias)}</b>
        </div>
        <div>
          <span>Hora aprox.</span>
          <b>{formatHora(proveedor.hora) || '—'}</b>
        </div>
      </div>

      <div
        className="prov-days"
        aria-label={`Entrega los ${proveedor.dias.map((d) => DIAS_LARGO[d]).join(', ')}`}
      >
        {DIAS.map((d, i) => (
          <span key={d} className={proveedor.dias.includes(i) ? 'on' : ''} aria-hidden="true">{d.charAt(0)}</span>
        ))}
      </div>

      {proveedor.productos.length > 0 && (
        <p className="prov-products">
          {proveedor.productos.slice(0, 3).map((p) => p.nombre).join(', ')}
          {proveedor.productos.length > 3 && <em> +{proveedor.productos.length - 3} más</em>}
        </p>
      )}
    </article>
  );
}