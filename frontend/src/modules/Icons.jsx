import React from 'react';

/* Iconos de los módulos (se usan en tarjetas, menú lateral y pantallas de cada módulo) */
const Svg = ({ children, ...p }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>{children}</svg>
);

export const IconSupplier = () => (
  <Svg><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 11.5l2 2 3.5-4" /></Svg>
);

export const IconUsers = () => (
  <Svg>
    <circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.6c2.2.7 3.5 2.6 3.5 5.4" />
  </Svg>
);

export const IconPayroll = () => (
  <Svg>
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.6" />
    <path d="M6 12h.01M18 12h.01" />
  </Svg>
);

export const IconMenuBook = () => (
  <Svg><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 1.5-3 4-3 7 0 2 1 3 3 3v8" /></Svg>
);

export const IconArrivals = () => (
  <Svg>
    <rect x="2.5" y="6.5" width="11" height="9" rx="1.5" />
    <path d="M13.5 9.5h4l3 3.2V15.5h-7" />
    <circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" />
  </Svg>
);

export const IconUrgent = () => (
  <Svg>
    <path d="M10.3 4.2L2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />
    <path d="M12 9.5v4M12 17h.01" />
  </Svg>
);
export const IconBox = () => (
  <Svg>
    <path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9" />
  </Svg>
);
