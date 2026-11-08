import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSesion } from '../lib/sesion';
import './Kebabmenu.css';

/* Botón de tres puntitos con mini menú.
 * items: [{ id, label, icon, onSelect, peligro?, lectura? }]
 *   peligro: opción en rojo (p. ej. borrar)
 *   lectura: solo consulta (p. ej. «Detalles»); el rol de solo consulta ve únicamente estas.
 *   Si no queda ninguna opción, no se muestra el botón. */
export default function KebabMenu({ label, items: todos }) {
  const { puedeEditar } = useSesion();
  const items = puedeEditar ? todos : todos.filter((it) => it.lectura);
  const [open, setOpen] = useState(false);
  const [arriba, setArriba] = useState(false); // se abre hacia arriba si abajo no cabe
  const ref = useRef(null);
  const popRef = useRef(null);

  // Antes de pintarse, mide si el menú cabe abajo (sin taparse con la barra de pestañas
  // del celular ni salirse de la pantalla); si no cabe y arriba hay más espacio, se voltea
  useLayoutEffect(() => {
    if (!open || !ref.current || !popRef.current) return;
    const btn = ref.current.getBoundingClientRect();
    const alto = popRef.current.offsetHeight + 8;
    const tabbar = document.querySelector('.tabbar');
    const tabTop = tabbar && getComputedStyle(tabbar).display !== 'none' ? tabbar.getBoundingClientRect().top : window.innerHeight;
    const header = document.querySelector('.dash .top');
    const piso = Math.min(window.innerHeight, tabTop);
    const techo = header ? header.getBoundingClientRect().bottom : 0;
    const abajo = piso - btn.bottom;
    const encima = btn.top - techo;
    setArriba(abajo < alto && encima > abajo);
  }, [open]);

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

  if (!items.length) return null;

  return (
    <div className="kebab" ref={ref}>
      <button
        type="button"
        className="kebab-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" />
        </svg>
      </button>

      {open && (
        <div className={`kebab-pop${arriba ? ' arriba' : ''}`} role="menu" ref={popRef}>
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              role="menuitem"
              className={it.peligro ? 'peligro' : undefined}
              onClick={() => { setOpen(false); it.onSelect(); }}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}