import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import './index.css'
import App from './App.jsx'

// Safari de iPhone no respeta user-scalable=no: se cancela el gesto de pellizcar
// para que el portal no se pueda acercar con los dedos
const sinZoom = (e) => e.preventDefault();
['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) =>
  document.addEventListener(ev, sinZoom, { passive: false }),
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
