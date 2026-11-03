import React, { useCallback, useState } from 'react';
import Login from './auth/login';
import Dashboard from './layout/Dashboard';
import Loading from './components/Loading';
import Splash from './components/Splash';

export default function App() {
  const [currentRole, setCurrentRole] = useState(null);
  // null = sin transición, 'in' = login -> panel, 'out' = panel -> login
  const [transition, setTransition] = useState(null);
  // Pantalla de carga de la primera visita (al entrar a la URL)
  const [booting, setBooting] = useState(true);
  const finishBoot = useCallback(() => setBooting(false), []);

  const handleLogin = (role) => {
    // El panel se monta debajo de la pantalla de carga, que ya está opaca
    setCurrentRole(role);
    setTransition('in');
  };

  const handleLogout = () => setTransition('out');

  // Al salir, el login se pone debajo justo cuando empieza el fundido final
  const handleCovered = useCallback(() => {
    if (transition === 'out') setCurrentRole(null);
  }, [transition]);

  const handleDone = useCallback(() => setTransition(null), []);

  return (
    <>
      {currentRole ? (
        <Dashboard userRole={currentRole} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLogin} />
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
    </>
  );
}