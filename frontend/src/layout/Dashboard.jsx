import React, { useEffect, useRef, useState } from 'react';
import { MODULES } from '../modules';
import MiniLoader, { MINI_MS } from '../components/Miniloader';
import { guardarVista, leerVista } from '../lib/sesion';
import './Dashboard.css';

/* ---------- Iconos ---------- */
const Svg = ({ children, ...p }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>{children}</svg>
);
const IconMenu = () => <Svg><path d="M4 6h16M4 12h16M4 18h16" /></Svg>;
const IconLogout = () => <Svg><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Svg>;
const IconGrid = () => (
  <Svg>
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Svg>
);
const IconStar = () => <Svg><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></Svg>;
const IconArrow = () => <Svg><path d="M7 17L17 7M8 7h9v9" /></Svg>;
const IconChevron = () => <Svg><path d="M15 5l-7 7 7 7" /></Svg>;
const IconMegaphone = () => <Svg><path d="M4 10v4a1 1 0 0 0 1 1h3l6 4V5L8 9H5a1 1 0 0 0-1 1zM18 9a4 4 0 0 1 0 6" /></Svg>;


const FAV_KEY = 'fs_favoritos';
const roleLabel = (role) =>
  String(role || '').toLowerCase() === 'admin' ? 'Administrador' : 'Rol Basico';

export default function Dashboard({
  userRole,
  onLogout,
  onOpenModule = () => {},
  userName = 'Gerente de Sucursal',
  sede = 'Culiacán, Sin.',
}) {
  const [tab, setTab] = useState('all');
  // id del módulo abierto (null = inicio); al recargar se reabre el último que estaba abierto
  const [view, setView] = useState(() => {
    const id = leerVista();
    return MODULES.some((m) => m.id === id && m.Component) ? id : null;
  });
  const [pending, setPending] = useState(null); // { id } mientras corre la mini carga
  const timer = useRef(null);
  const [collapsed, setCollapsed] = useState(
    () => window.matchMedia('(max-width: 820px)').matches
  );
  const [favs, setFavs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    } catch {
      /* sin almacenamiento disponible */
    }
  }, [favs]);

  const toggleFav = (id) =>
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const favModules = MODULES.filter((m) => favs.includes(m.id));
  const currentModule = MODULES.find((m) => m.id === view);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    guardarVista(view);
  }, [view]);

  /* Cambia de pantalla (id de módulo, o null para el inicio) con una mini carga */
  const navigate = (id) => {
    if (id === view && !pending) {
      if (id === null) setTab('all');
      return;
    }
    clearTimeout(timer.current);
    if (window.matchMedia('(max-width: 820px)').matches) setCollapsed(true);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPending({ id });
    timer.current = setTimeout(() => {
      if (id === null) setTab('all');
      setView(id);
      setPending(null);
    }, reduce ? 150 : MINI_MS);
  };

  const openModule = (id) => {
    const m = MODULES.find((x) => x.id === id);
    if (m && m.Component) navigate(id);
    else onOpenModule(id);
  };

  // Lo que está seleccionado en el menú (ya cuenta el destino mientras carga)
  const target = pending ? pending.id : view;
  const pendingModule = pending ? MODULES.find((m) => m.id === pending.id) : null;

  const renderCard = (m) => {
    const Icon = m.icon;
    const isFav = favs.includes(m.id);
    return (
      <div className="card" key={m.id}>
        <div className="card-top">
          <div className="tile"><Icon /></div>
          <button
            type="button"
            className="star"
            aria-pressed={isFav}
            aria-label={isFav ? 'Quitar de favoritos' : 'Marcar como favorito'}
            onClick={() => toggleFav(m.id)}
          >
            <IconStar />
          </button>
        </div>
        <h3>
          <button type="button" className="card-link" onClick={() => openModule(m.id)}>
            {m.title}
          </button>
        </h3>
        <p>{m.description}</p>
        {m.soon ? (
          <span className="state soon"><i />Próximamente</span>
        ) : (
          <span className="state"><i />Módulo activo</span>
        )}
        <span className="go"><IconArrow /></span>
      </div>
    );
  };

  const tabs = [
    { id: 'fav', label: 'Favoritos', count: favModules.length },
    { id: 'all', label: 'Todos los módulos' },
    { id: 'ann', label: 'Anuncios' },
  ];

  return (
    <div className={`dash${collapsed ? ' collapsed' : ''}`}>
      <header className="top">
        <button
          type="button"
          className="icon-btn"
          aria-label="Abrir o cerrar menú"
          onClick={() => setCollapsed((c) => !c)}
        >
          <IconMenu />
        </button>
        <div className="brand">
          <span className="brand-name">Frank Salmón</span>
          <span className="brand-sub">Portal de gestión</span>
        </div>
        <div className="spacer" />
        <span className="chip sede"><i />Sede {sede}</span>
        <span className="chip role">{roleLabel(userRole)}</span>
        <button type="button" className="icon-btn" aria-label="Cerrar sesión" onClick={onLogout}>
          <IconLogout />
        </button>
      </header>

      <div className="app">
        <aside className="side">
          <div className="side-in">
            <nav className="nav" aria-label="Principal">
              <a
                href="#inicio"
                className={target ? '' : 'on'}
                onClick={(e) => { e.preventDefault(); navigate(null); }}
              >
                <IconGrid />Inicio
              </a>
              {MODULES.map((m) => {
                const Icon = m.icon;
                return (
                  <a
                    key={m.id}
                    href={`#${m.id}`}
                    className={target === m.id ? 'on' : ''}
                    onClick={(e) => { e.preventDefault(); openModule(m.id); }}
                  >
                    <Icon />{m.title}
                  </a>
                );
              })}
            </nav>
            <div className="me">
              <div className="av">{userName.charAt(0).toUpperCase()}</div>
              <div>
                <b>{userName}</b>
                <span>{roleLabel(userRole)}</span>
              </div>
            </div>
          </div>
        </aside>

        <button
          type="button"
          className="fold"
          aria-label="Contraer o abrir menú"
          onClick={() => setCollapsed((c) => !c)}
        >
          <IconChevron />
        </button>
        <div className="scrim" onClick={() => setCollapsed(true)} />

        <main>
          {pending ? (
            <MiniLoader
              key={pending.id || 'inicio'}
              icon={pendingModule ? pendingModule.icon : IconGrid}
              name={pendingModule ? pendingModule.title : 'Módulos'}
              caption={pendingModule ? 'Abriendo' : 'Volviendo a'}
            />
          ) : (
          <div className="page-in" key={view || 'inicio'}>
          {currentModule ? (
            <currentModule.Component onBack={() => navigate(null)} onOpenModule={openModule} />
          ) : (
          <>
          <div className="tabs" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                className="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.count > 0 && <span className="badge">{t.count}</span>}
              </button>
            ))}
          </div>

          <section className="panel" role="tabpanel">
            {tab === 'all' && <div className="grid">{MODULES.map(renderCard)}</div>}

            {tab === 'fav' &&
              (favModules.length ? (
                <div className="grid">{favModules.map(renderCard)}</div>
              ) : (
                <div className="empty">
                  <IconStar />
                  <b>Aún no tienes favoritos</b>
                  <p>Marca un módulo con la estrella para tenerlo siempre a la mano.</p>
                  <button type="button" className="btn" onClick={() => setTab('all')}>
                    Ver todos los módulos
                  </button>
                </div>
              ))}

            {tab === 'ann' && (
              <div className="empty">
                <IconMegaphone />
                <b>No hay anuncios por ahora</b>
                <p>Cuando haya avisos para tu sede, aparecerán aquí.</p>
              </div>
            )}
          </section>
          </>
          )}
          </div>
          )}
        </main>
      </div>
    </div>
  );
}