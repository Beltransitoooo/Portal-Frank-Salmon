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

export function SkeletonList({ count = 4 }) {
  return (
    <Cargando className="skel-list">
      {Array.from({ length: count }, (_, i) => (
        <div className="skel-row" key={i} aria-hidden="true">
          <div className="skel-col">
            <Bar w="46%" h={15} />
            <Bar w="30%" />
          </div>
          <Bar w={56} h={26} />
          <Bar w={38} h={38} />
        </div>
      ))}
    </Cargando>
  );
}
