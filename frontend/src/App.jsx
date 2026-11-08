import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Login from './auth/login';
import Dashboard from './layout/Dashboard';
import Loading from './components/Loading';
import Splash from './components/Splash';
import { api } from './lib/api';
import { reiniciarColecciones } from './lib/remoteCollection';
import {
  EVENTO_SESION_TERMINADA, SesionContext, cerrarSesion, guardarSesion, leerSesion,
} from './lib/sesion';
import { reiniciarProveedores } from './modules/proveedores/api';

export default function App() {
  // Si ya había sesión (p. ej. al recargar la página), se entra directo al panel
  const [sesion, setSesion] = useState(leerSesion);
  // Aviso que se muestra en el login (p. ej. «Tu sesión terminó»)
  const [aviso, setAviso] = useState('');
  // null = sin transición, 'in' = login -> panel, 'out' = panel -> login
  const [transition, setTransition] = useState(null);
  // Pantalla de carga de la primera visita (al entrar a la URL)
  const [booting, setBooting] = useState(true);
  const finishBoot = useCallback(() => setBooting(false), []);

  const actualizarSesion = useCallback((nueva) => {
    guardarSesion(nueva);
    setSesion(nueva);
  }, []);

  const handleLogin = (nueva) => {
    // El panel se monta debajo de la pantalla de carga, que ya está opaca
    actualizarSesion(nueva);
    setAviso('');
    reiniciarProveedores();
    reiniciarColecciones();
    setTransition('in');
  };

  const handleLogout = useCallback(() => setTransition('out'), []);

  // Al salir, el login se pone debajo justo cuando empieza el fundido final
  const handleCovered = useCallback(() => {
    if (transition === 'out') {
      cerrarSesion();
      setSesion(null);
      reiniciarProveedores();
      reiniciarColecciones();
    }
  }, [transition]);

  const handleDone = useCallback(() => setTransition(null), []);

  // El servidor ya no reconoce la sesión (venció, o se cambió la contraseña en otro equipo)
  useEffect(() => {
    const terminar = () => {
      if (!leerSesion()) return;
      cerrarSesion();
      setSesion(null);
      setAviso('Tu sesión terminó. Vuelve a iniciar sesión.');
      reiniciarProveedores();
      reiniciarColecciones();
    };
    window.addEventListener(EVENTO_SESION_TERMINADA, terminar);
    return () => window.removeEventListener(EVENTO_SESION_TERMINADA, terminar);
  }, []);

  // Al abrir el portal con una sesión guardada, se confirma con el servidor y se refrescan
  // los datos del usuario (si la sesión ya no vale, el 401 regresa al login)
  useEffect(() => {
    const guardada = leerSesion();
    if (!guardada) return;
    api('/auth/yo')
      .then((usuario) => actualizarSesion({ ...guardada, usuario }))
      .catch(() => {});
  }, [actualizarSesion]);

  const contexto = useMemo(() => ({
    usuario: sesion?.usuario ?? null,
    puedeEditar: sesion?.usuario?.rol === 'admin',
    actualizarSesion,
    salir: handleLogout,
  }), [sesion, actualizarSesion, handleLogout]);

  return (
    <SesionContext.Provider value={contexto}>
      {sesion ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLogin} aviso={aviso} />
      )}

      {booting && <Splash onDone={finishBoot} />}

      {transition && (
        <Loading
          key={transition}
          mode={transition}
          onCovered={handleCovered}
          onDone={handleDone}
        />
      )}
    </SesionContext.Provider>
  );
}
