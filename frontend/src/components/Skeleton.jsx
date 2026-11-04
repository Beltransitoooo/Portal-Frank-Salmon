import React from 'react';
import './Skeleton.css';

/* Marcadores animados mientras llegan los datos, con la misma forma que el contenido real */
const Bar = ({ w, h = 12 }) => <span className="skel" style={{ width: w, height: h }} />;

function Cargando({ children, className }) {
  return (
    <div className={className} role="status" aria-busy="true">
      <span className="skel-sr">Cargando…</span>
      {children}
    </div>
  );
}

/* Tarjetas (Proveedores, Arribos) */
export function SkeletonCards({ count = 3 }) {
  return (
    <Cargando className="skel-grid">
      {Array.from({ length: count }, (_, i) => (
        <div className="skel-card" key={i} aria-hidden="true">
          <Bar w={52} h={52} />
          <Bar w="62%" h={20} />
          <Bar w="34%" />
          <Bar w="88%" />
          <Bar w="70%" />
        </div>
      ))}
    </Cargando>
  );
}

/* Renglones (Urgencias) */
export function SkeletonList({ count = 4 }) {
  return (
    <Cargando className="skel-list">
      {Array.from({ length: count }, (_, i) => (
        <div className="skel-row" key={i} aria-hidden="true">
          <Bar w={10} h={10} />
          <div className="skel-col">
            <Bar w="46%" h={15} />
            <Bar w="30%" />
          </div>
          <Bar w={74} h={24} />
        </div>
      ))}
    </Cargando>
  );
}
