import React, { useEffect, useState } from 'react';
import ModuleHeader from '../../components/Moduleheader';
import { SkeletonList } from '../../components/Skeleton';
import ProveedorItem from './components/ProveedorItem';
import DetallesModal from './components/Detallesmodal';
import FechasModal from './components/Fechasmodal';
import ArriboModal from './components/Arribomodal';
import AgregarProveedorModal from './components/Agregarproveedormodal';
import { cambiarActivoProveedor, recargarProveedores, useProveedores } from './api';
import './proveedores.css';

const TODAS = '__todas';
const SIN_CATEGORIA = 'Sin categoría';

/* Quita acentos para buscar «camaron» y encontrar «Camarón» */
const plano = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Proveedores({ onBack, onOpenModule }) {
  const [modal, setModal] = useState(null); // { tipo, proveedor? }
  const [toast, setToast] = useState(null); // { texto, verArribos? }
  const [busca, setBusca] = useState('');
  const [cat, setCat] = useState(TODAS);
  const { proveedores, cargando, error } = useProveedores();

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const close = () => setModal(null);
  const catDe = (p) => p.categoria?.trim() || SIN_CATEGORIA;

  // Filtros: categorías escritas al dar de alta, en orden alfabético y «Sin categoría» al final
  const categorias = [...new Set(proveedores.map(catDe))]
    .sort((a, b) => (a === SIN_CATEGORIA) - (b === SIN_CATEGORIA) || a.localeCompare(b, 'es'));
  const catActiva = cat === TODAS || categorias.includes(cat) ? cat : TODAS;

  const q = plano(busca.trim());
  const visibles = proveedores
    .filter((p) => catActiva === TODAS || catDe(p) === catActiva)
    .filter((p) => !q || plano(p.nombre).includes(q) || p.productos.some((x) => plano(x.nombre).includes(q)))
    // Dentro de cada grupo, los habilitados primero
    .sort((a, b) => (a.activo === false) - (b.activo === false) || a.nombre.localeCompare(b.nombre, 'es'));
  const grupos = categorias
    .map((c) => ({ nombre: c, items: visibles.filter((p) => catDe(p) === c) }))
    .filter((g) => g.items.length);

  const n = proveedores.length;
  const deshabilitados = proveedores.filter((p) => p.activo === false).length;
  const listo = !cargando && !error;

  const cambiarActivo = async (p, activo) => {
    try {
      await cambiarActivoProveedor(p.id, activo);
      setToast({ texto: activo ? `${p.nombre} está habilitado otra vez.` : `${p.nombre} quedó deshabilitado.` });
    } catch (err) {
      setToast({ texto: err.message });
    }
  };
  const accion = (tipo, proveedor) => {
    if (tipo === 'deshabilitar') return cambiarActivo(proveedor, false);
    if (tipo === 'habilitar') return cambiarActivo(proveedor, true);
    return setModal({ tipo, proveedor });
  };

  return (
    <div className="mod prov">
      <ModuleHeader
        title="Proveedores"
        subtitle="Quién te surte, qué trae y qué días llega"
        onBack={onBack}
        onRefresh={recargarProveedores}
      />

      <div className="lst-tools">
        <label className="lst-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar proveedor o producto"
            aria-label="Buscar proveedor o producto"
          />
        </label>
        <button type="button" className="lst-agregar" onClick={() => setModal({ tipo: 'alta' })} disabled={Boolean(error)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Agregar proveedor
        </button>
      </div>

      {listo && n > 0 && categorias.length > 1 && (
        <div className="lst-cats" role="group" aria-label="Filtrar por categoría">
          {[TODAS, ...categorias].map((c) => (
            <button key={c} type="button" aria-pressed={catActiva === c} onClick={() => setCat(c)}>
              {c === TODAS ? 'Todas' : c}
            </button>
          ))}
        </div>
      )}

      {listo && n > 0 && (
        <p className="lst-resumen">
          <span>
            <b>{n}</b> {n === 1 ? 'proveedor registrado' : 'proveedores registrados'}
            {deshabilitados > 0 && (
              <> · <span className="lst-alerta">{deshabilitados} {deshabilitados === 1 ? 'deshabilitado' : 'deshabilitados'}</span></>
            )}
          </span>
        </p>
      )}

      {cargando && <SkeletonList count={4} />}

      {error && (
        <div className="lst-empty" role="alert">
          <b>No hay conexión con el servidor</b>
          <p>Revisa tu conexión; los proveedores aparecerán en cuanto se recupere.</p>
        </div>
      )}

      {listo && n === 0 && (
        <div className="lst-empty">
          <b>Aún no hay proveedores</b>
          <p>Usa «Agregar proveedor» para dar de alta el primero.</p>
        </div>
      )}

      {listo && n > 0 && visibles.length === 0 && (
        <div className="lst-empty">
          <b>Sin resultados</b>
          <p>No hay proveedores que coincidan con «{busca.trim()}».</p>
        </div>
      )}

      {listo && grupos.map((g) => (
        <section className="lst-grupo" key={g.nombre} aria-label={g.nombre}>
          <h2>{g.nombre} <span>{g.items.length}</span></h2>
          <ul className="lst-lista">
            {g.items.map((p) => (
              <ProveedorItem key={p.id} proveedor={p} onAction={accion} />
            ))}
          </ul>
        </section>
      ))}

      {modal?.tipo === 'alta' && (
        <AgregarProveedorModal
          onClose={close}
          onSaved={(nuevo) => { close(); setToast({ texto: `${nuevo.nombre} se agregó a proveedores.` }); }}
        />
      )}
      {modal?.tipo === 'editar' && (
        <AgregarProveedorModal
          proveedor={modal.proveedor}
          onClose={close}
          onSaved={(editado) => { close(); setToast({ texto: `Se guardaron los cambios de ${editado.nombre}.` }); }}
        />
      )}
      {modal?.tipo === 'detalles' && <DetallesModal proveedor={modal.proveedor} onClose={close} />}
      {modal?.tipo === 'fechas' && <FechasModal proveedor={modal.proveedor} onClose={close} />}
      {modal?.tipo === 'arribo' && (
        <ArriboModal
          proveedor={modal.proveedor}
          onClose={close}
          onSaved={() => { close(); setToast({ texto: 'Arribo agregado a pendientes.', verArribos: true }); }}
        />
      )}

      {toast && (
        <div className="lst-toast" role="status">
          <span>{toast.texto}</span>
          {toast.verArribos && onOpenModule && (
            <button type="button" onClick={() => { setToast(null); onOpenModule('arribos'); }}>
              Ver arribos
            </button>
          )}
        </div>
      )}
    </div>
  );
}
