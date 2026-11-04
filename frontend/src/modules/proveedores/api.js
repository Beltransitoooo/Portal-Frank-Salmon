/* Proveedores desde el backend (FastAPI). Se piden una vez y se reutilizan entre pantallas. */
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

let cache = null;

export function useProveedores() {
  const [proveedores, setProveedores] = useState(cache);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cache) return undefined;
    let vivo = true;
    api('/proveedores')
      .then((data) => {
        cache = data;
        if (vivo) setProveedores(data);
      })
      .catch((err) => {
        console.error('No se pudieron cargar los proveedores:', err);
        if (vivo) setError(true);
      });
    return () => {
      vivo = false;
    };
  }, []);

  return { proveedores: proveedores || [], cargando: !proveedores && !error, error };
}
