import React, { useEffect, useRef, useState } from 'react';
import { MODULES } from '../modules';
import MiniLoader, { MINI_MS } from '../components/Miniloader';
import { guardarVista, leerVista } from '../lib/sesion';
import { useArribos, useArribosEstado } from '../modules/arribos/store';
import { useUrgencias, useUrgenciasEstado } from '../modules/urgencias/store';
import { useProveedores } from '../modules/proveedores/api';
import { diasHasta, formatFecha, haceCuanto } from '../modules/fechas';
import logo from '../assets/logo-frank-salmon.png';
import './Dashboard.css';

/* ---------- Iconos ---------- */
const Svg = ({ children, ...p }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>{children}</svg>
);
const IconLogout = () => <Svg><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Svg>;
const IconHome = () => <Svg><path d="M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10" /></Svg>;
const IconStar = () => <Svg><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></Svg>;

const FAV_KEY = 'fs_favoritos';
const FAV_INICIAL = ['arribos']; // destacado la primera vez, antes de que el usuario elija
const MAX_AVISOS = 6;

const roleLabel = (role) =>
  String(role || '').toLowerCase() === 'admin' ? 'Administrador' : 'Rol básico';

const saludo = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

/* "jue 06/11/2026", como se rotula una pizarra */
const fechaPizarra = () => {
  const d = new Date();
  const dia = d.toLocaleDateString('es-MX', { weekday: 'short' }).replace(/\./g, '');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia} ${dd}/${mm}/${d.getFullYear()}`;
};

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/* Producto principal de un arribo: "Limón +1" */
const productoPrincipal = (items = []) =>
  items.length ? `${items[0].producto}${items.length > 1 ? ` +${items.length - 1}` : ''}` : 'Sin productos';
const cantidadPrincipal = (items = []) =>
  items.length ? `${items[0].cantidad} ${items[0].unidad}` : '';

const ACTIVOS = MODULES.filter((m) => !m.soon);
const PROXIMOS = MODULES.filter((m) => m.soon);

export default function Dashboard({
  userRole,
  onLogout,
  onOpenModule = () => {},
  userName = 'Gerente de Sucursal',
  sede = 'Culiacán, Sin.',
}) {
  // id del módulo abierto (null = inicio); al recargar se reabre el último que estaba abierto
  const [view, setView] = useState(() => {
    const id = leerVista();
    return MODULES.some((m) => m.id === id && m.Component) ? id : null;
  });
  const [pending, setPending] = useState(null); // { id } mientras corre la mini carga
  const timer = useRef(null);
  const [favs, setFavs] = useState(() => {
    try {
      const guardados = JSON.parse(localStorage.getItem(FAV_KEY));
      return Array.isArray(guardados) ? guardados : FAV_INICIAL;
    } catch {
      return FAV_INICIAL;
    }
  });

  // Datos para el resumen del día y la nota de pendientes
  const arribos = useArribos();
  const arribosEstado = useArribosEstado();
  const urgencias = useUrgencias();
  const urgenciasEstado = useUrgenciasEstado();
  const { proveedores, cargando: provCargando, error: provError } = useProveedores();

  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    } catch {
      /* sin almacenamiento disponible */
    }
  }, [favs]);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    guardarVista(view);
  }, [view]);

  const toggleFav = (id) =>
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  /* Cambia de pantalla (id de módulo, o null para el inicio) con una mini carga */
  const navigate = (id) => {
    if (id === view && !pending) return;
    clearTimeout(timer.current);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPending({ id });
    window.scrollTo({ top: 0 });
    timer.current = setTimeout(() => {
      setView(id);
      setPending(null);
    }, reduce ? 150 : MINI_MS);
  };

  const openModule = (id) => {
    if (id === null) return navigate(null); // «Inicio» no es un módulo
    const m = MODULES.find((x) => x.id === id);
    if (m && m.Component) navigate(id);
    else onOpenModule(id);
  };

  // Lo que está seleccionado en la navegación (ya cuenta el destino mientras carga)
  const target = pending ? pending.id : view;
  const currentModule = MODULES.find((m) => m.id === view);
  const pendingModule = pending ? MODULES.find((m) => m.id === pending.id) : null;

  /* ---------- Cálculos del día ---------- */
  const arrPend = arribos.filter((a) => a.estado === 'pendiente');
  const arrHoy = arrPend.filter((a) => diasHasta(a.fecha) === 0);
  const arrAtrasados = arrPend.filter((a) => diasHasta(a.fecha) < 0);
  const urgPend = urgencias
    .filter((u) => u.estado === 'pendiente')
    .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));

  const cargandoDia = arribosEstado === 'cargando' || urgenciasEstado === 'cargando';
  const errorDia = arribosEstado === 'error' && urgenciasEstado === 'error';

  let resumen;
  if (errorDia) {
    resumen = 'No hay conexión con el servidor. El resumen aparecerá cuando se recupere.';
  } else if (cargandoDia) {
    resumen = 'Revisando arribos y urgencias del día…';
  } else {
    const partArr = arrHoy.length
      ? <>Hoy esperas <b>{plural(arrHoy.length, 'arribo', 'arribos')}</b></>
      : 'Hoy no esperas arribos';
    const partUrg = urgPend.length
      ? <>hay <b>{plural(urgPend.length, 'urgencia', 'urgencias')}</b> sin surtir</>
      : 'no hay urgencias pendientes';
    resumen = (
      <>
        {partArr} y {partUrg}.
        {arrAtrasados.length > 0 && (
          <> {arrAtrasados.length === 1 ? 'Un arribo va' : `${arrAtrasados.length} arribos van`} atrasado{arrAtrasados.length === 1 ? '' : 's'}.</>
        )}
      </>
    );
  }

  /* Renglones de la nota: urgencias (las más antiguas primero) y arribos atrasados o de hoy */
  const avisos = [
    ...urgPend.map((u) => ({
      id: `u-${u.id}`,
      modulo: 'urgencias',
      tag: 'Urg',
      tagTitulo: 'Urgencia',
      caliente: true,
      titulo: u.producto,
      detalle: haceCuanto(u.creadoEn),
      cantidad: `${u.cantidad} ${u.unidad}`,
    })),
    ...[...arrAtrasados, ...arrHoy]
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
      .map((a) => {
        const atrasado = diasHasta(a.fecha) < 0;
        return {
          id: `a-${a.id}`,
          modulo: 'arribos',
          tag: atrasado ? 'Atr' : a.hora,
          tagTitulo: atrasado ? 'Arribo atrasado' : `Arribo de hoy a las ${a.hora}`,
          caliente: atrasado,
          titulo: a.proveedorNombre,
          detalle: atrasado
            ? `${productoPrincipal(a.items)} · esperado ${formatFecha(a.fecha)}`
            : productoPrincipal(a.items),
          cantidad: cantidadPrincipal(a.items),
        };
      }),
  ];

  /* Cifra grande y rótulo de cada módulo, como un precio en la pizarra */
  const cifraDe = (id) => {
    const sin = { num: '–', unidad: 'sin conexión' };
    const carga = { num: '–', unidad: 'cargando…' };
    if (id === 'proveedores') {
      if (provError) return sin;
      if (provCargando) return carga;
      return { num: proveedores.length, unidad: proveedores.length === 1 ? 'registrado' : 'registrados' };
    }
    if (id === 'arribos') {
      if (arribosEstado === 'error') return sin;
      if (arribosEstado === 'cargando') return carga;
      return {
        num: arrPend.length,
        unidad: `${arrPend.length === 1 ? 'pendiente' : 'pendientes'}${arrHoy.length ? ` · ${arrHoy.length} hoy` : ''}`,
      };
    }
    if (id === 'urgencias') {
      if (urgenciasEstado === 'error') return sin;
      if (urgenciasEstado === 'cargando') return carga;
      return { num: urgPend.length, unidad: urgPend.length ? 'sin surtir' : 'todo surtido' };
    }
    return { num: '', unidad: '' };
  };

  // Los favoritos van primero y se destacan en papel crema
  const tarjetas = [...ACTIVOS].sort((a, b) => Number(favs.includes(b.id)) - Number(favs.includes(a.id)));

  const renderCard = (m) => {
    const isFav = favs.includes(m.id);
    const { num, unidad } = cifraDe(m.id);
    return (
      <div className={`card${isFav ? ' fav' : ''}`} key={m.id}>
        <div className="card-k">
          <h3>
            <button type="button" className="card-link" onClick={() => openModule(m.id)}>
              {m.title}
            </button>
          </h3>
          <button
            type="button"
            className="star"
            aria-pressed={isFav}
            aria-label={isFav ? `Quitar ${m.title} de destacados` : `Destacar ${m.title}`}
            title={isFav ? 'Quitar de destacados' : 'Destacar'}
            onClick={() => toggleFav(m.id)}
          >
            <IconStar />
          </button>
        </div>
        <span className="big" aria-hidden={num === '–'}>{num}</span>
        <span className="unit">{unidad}</span>
      </div>
    );
  };

  const navItems = [{ id: null, title: 'Inicio', icon: IconHome }, ...ACTIVOS];

  return (
    <div className="dash">
      <header className="top">
        <div className="top-in">
          <button type="button" className="brand" onClick={() => navigate(null)} aria-label="Ir al inicio">
            <img src={logo} alt="Frank Salmón" />
          </button>

          <nav className="topnav" aria-label="Principal">
            {navItems.map((m) => (
              <a
                key={m.id || 'inicio'}
                href={`#${m.id || 'inicio'}`}
                className={target === m.id ? 'on' : ''}
                aria-current={target === m.id ? 'page' : undefined}
                onClick={(e) => { e.preventDefault(); openModule(m.id); }}
              >
                {m.title}
              </a>
            ))}
          </nav>

          <div className="who">
            <span className="who-text">
              <b>{fechaPizarra()}</b>
              <span>{sede} · {roleLabel(userRole)}</span>
            </span>
            <span className="av" aria-hidden="true">{userName.charAt(0).toUpperCase()}</span>
            <button type="button" className="icon-btn" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={onLogout}>
              <IconLogout />
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {pending ? (
          <MiniLoader
            key={pending.id || 'inicio'}
            icon={pendingModule ? pendingModule.icon : IconHome}
            name={pendingModule ? pendingModule.title : 'Inicio'}
            caption={pendingModule ? 'Abriendo' : 'Volviendo al'}
          />
        ) : (
          <div className="page-in" key={view || 'inicio'}>
            {currentModule ? (
              <currentModule.Component onBack={() => navigate(null)} onOpenModule={openModule} />
            ) : (
              <div className="home">
                <section className="hello" aria-labelledby="hello-title">
                  <h1 id="hello-title">
                    {saludo()},<br /><em>{userName}</em>
                  </h1>
                  <p>{resumen}</p>
                </section>

                <section className="board" aria-label="Módulos">
                  {tarjetas.map(renderCard)}
                </section>

                {PROXIMOS.length > 0 && (
                  <div className="soon-row">
                    <b>Próximamente:</b>
                    {PROXIMOS.map((m) => (
                      <button key={m.id} type="button" className="soon-chip" onClick={() => openModule(m.id)}>
                        {m.title}
                      </button>
                    ))}
                  </div>
                )}

                <aside className="note" aria-labelledby="note-title">
                  <div className="note-head">
                    <h2 id="note-title">Pendientes</h2>
                    {!cargandoDia && avisos.length > 0 && (
                      <span>{plural(avisos.length, 'aviso', 'avisos')}</span>
                    )}
                  </div>

                  {cargandoDia && (
                    <div className="note-list" aria-hidden="true">
                      {[0, 1, 2].map((i) => <span key={i} className="note-skel" />)}
                    </div>
                  )}

                  {!cargandoDia && avisos.length === 0 && (
                    <p className="note-empty">
                      <b>{errorDia ? 'Sin conexión' : 'Todo en orden'}</b>
                      {errorDia
                        ? 'Los pendientes aparecerán cuando vuelva la conexión.'
                        : 'No hay urgencias pendientes ni arribos atrasados.'}
                    </p>
                  )}

                  {!cargandoDia && avisos.length > 0 && (
                    <ul className="note-list">
                      {avisos.slice(0, MAX_AVISOS).map((a) => (
                        <li key={a.id}>
                          <button type="button" className="note-row" onClick={() => openModule(a.modulo)}>
                            <span className={`tag${a.caliente ? ' hot' : ''}`} title={a.tagTitulo}>{a.tag}</span>
                            <span className="what">
                              <b>{a.titulo}</b>
                              <small>{a.detalle}</small>
                            </span>
                            <span className="qty">{a.cantidad}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {avisos.length > MAX_AVISOS && (
                    <p className="note-more">y {avisos.length - MAX_AVISOS} más en Urgencias y Arribos</p>
                  )}
                </aside>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Pestañas inferiores en celular */}
      <nav className="tabbar" aria-label="Principal (celular)">
        {navItems.map((m) => {
          const Icon = m.icon;
          const on = target === m.id;
          return (
            <a
              key={m.id || 'inicio'}
              href={`#${m.id || 'inicio'}`}
              className={on ? 'on' : ''}
              aria-current={on ? 'page' : undefined}
              onClick={(e) => { e.preventDefault(); openModule(m.id); }}
            >
              <Icon />
              <span>{m.title}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
