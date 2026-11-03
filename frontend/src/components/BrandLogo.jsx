import React from 'react';

export default function BrandLogo({ className = "brand-svg" }) {
  return (
    <svg 
      viewBox="0 0 260 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <rect width="260" height="120" rx="16" fill="#06394a" />
      <g opacity="0.15">
        <path d="M-10 20 Q 20 0 50 20 T 110 20 T 170 20 T 230 20 T 290 20" stroke="white" strokeWidth="2" fill="none" />
        <path d="M-10 45 Q 20 25 50 45 T 110 45 T 170 45 T 230 45 T 290 45" stroke="white" strokeWidth="2" fill="none" />
        <path d="M-10 70 Q 20 50 50 70 T 110 70 T 170 70 T 230 70 T 290 70" stroke="white" strokeWidth="2" fill="none" />
        <path d="M-10 95 Q 20 75 50 95 T 110 95 T 170 95 T 230 95 T 290 95" stroke="white" strokeWidth="2" fill="none" />
      </g>

      <g transform="translate(18, 28)">
        <path 
          d="M 52 14 C 40 2 24 0 10 12 C 2 20 0 32 4 44 C 9 56 22 66 38 66 C 48 66 58 60 68 50 C 62 46 54 42 46 41 C 41 40 37 41 33 43 C 24 47 16 41 15 32 C 14 23 21 16 30 16 C 39 16 46 22 52 14 Z" 
          fill="#f26922" 
        />
        <path d="M 45 4 L 62 -2 L 52 14 Z" fill="#ff8447" />
        <ellipse cx="26" cy="30" rx="4.5" ry="5.5" fill="#fdfbf7" />
        <circle cx="28" cy="30" r="2.2" fill="#06394a" />
      </g>

      <text 
        x="98" 
        y="62" 
        fill="#ffffff" 
        fontFamily="'Brush Script MT', 'Dancing Script', cursive, sans-serif" 
        fontSize="48" 
        fontWeight="bold"
        fontStyle="italic"
      >
        Frank
      </text>

      <line x1="96" y1="78" x2="114" y2="78" stroke="#f26922" strokeWidth="2.5" strokeLinecap="round" />
      <text 
        x="122" 
        y="82" 
        fill="#ffffff" 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontSize="12.5" 
        fontWeight="900" 
        letterSpacing="4.5"
      >
        SALMÓN
      </text>
      <line x1="204" y1="78" x2="222" y2="78" stroke="#f26922" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}