import React, { useEffect, useState } from 'react';
import ModuleHeader from '../../components/Moduleheader';
import KebabMenu from '../../components/Kebabmenu';
import Modal from '../../components/Modal';
import { SkeletonList } from '../../components/Skeleton';
import { haceCuanto } from '../fechas';
import ProductoModal from './components/ProductoModal';
import { borrarProducto, recargarInventario, useInventario, useInventarioEstado } from './store';
import './inventario.css';

const SIN_CATEGORIA = 'Sin categoría';
const TODAS = '__todas';

const Ico = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;
const ICON_EDITAR = <Ico><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z" /><path d="M13.5 8.5l3 3" /></Ico>;
const ICON_BORRAR = <Ico><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Ico>;

/* 12.5 -> "12.5", 1200 -> "1,200" */
const cifra = (n) => Number(n).toLocaleString('es-MX', { maximumFractionDigits: 2 });

/* Quita acentos para buscar «camaron» y encontrar «Camarón» */
const plano = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Inventario({ onBack }) {
  const productos = useInventario();
  const estado = useInventarioEstado();
  const [busca, setBusca] = useState('');
  const [cat, setCat] = useState(TODAS);
  const [modal, setModal] = useState(null); // { tipo: 'agregar' } | { tipo: 'editar', id } | { tipo: 'borrar', id }
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const categorias = [...new Set(productos.map((p) => p.categoria).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'es'));
  const hayVacios = productos.some((p) => !p.categoria);
  // Si se borró el último producto de la categoría elegida, se regresa a «Todas»
  const catActiva = cat === TODAS || categorias.includes(cat) || (cat === SIN_CATEGORIA && hayVacios) ? cat : TODAS;

  const q = plano(busca.trim());
  const visibles = productos
    .filter((p) => catActiva === TODAS || (p.categoria || SIN_CATEGORIA) === catActiva)
    .filter((p) => !q || plano(p.nombre).includes(q) || plano(p.categoria).includes(q))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  // Agrupados por categoría, en orden alfabético y «Sin categoría» al final
  const grupos = [...new Set(visibles.map((p) => p.categoria || SIN_CATEGORIA))]
    .sort((a, b) => (a === SIN_CATEGORIA) - (b === SIN_CATEGORIA) || a.localeCompare(b, 'es'))
    .map((c) => ({ nombre: c, items: visibles.filter((p) => (p.categoria || SIN_CATEGORIA) === c) }));

  const editando = modal?.tipo === 'editar' ? productos.find((p) => p.id === modal.id) : null;
  const aBorrar = modal?.tipo === 'borrar' ? productos.find((p) => p.id === modal.id) : null;
  const agotados = productos.filter((p) => Number(p.cantidad) === 0).length;

  return (
    <div className="mod inv">
      <ModuleHeader
        title="Inventario"
        subtitle="Existencias por producto"
        onBack={onBack}
        onRefresh={recargarInventario}
      />

      <div className="inv-tools">
        <label className="inv-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar producto"
            aria-label="Buscar producto"
          />
        </label>
        <button type="button" className="inv-agregar" onClick={() => setModal({ tipo: 'agregar' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Agregar producto
        </button>
      </div>

      {estado === 'listo' && productos.length > 0 && (categorias.length > 0) && (
        <div className="inv-cats" role="group" aria-label="Filtrar por categoría">
          {[TODAS, ...categorias, ...(hayVacios ? [SIN_CATEGORIA] : [])].map((c) => (
            <button key={c} type="button" aria-pressed={catActiva === c} onClick={() => setCat(c)}>
              {c === TODAS ? 'Todas' : c}
            </button>
          ))}
        </div>
      )}

      {estado === 'listo' && productos.length > 0 && (
        <p className="inv-resumen">
          <b>{productos.length}</b> {productos.length === 1 ? 'producto' : 'productos'}
          {agotados > 0 && <> · <span className="inv-agotado-txt">{agotados} {agotados === 1 ? 'agotado' : 'agotados'}</span></>}
        </p>
      )}

      {estado === 'cargando' && <SkeletonList count={5} />}

      {estado === 'error' && (
        <div className="inv-empty" role="alert">
          <b>No hay conexión con el servidor</b>
          <p>Revisa tu conexión; el inventario aparecerá en cuanto se recupere.</p>
        </div>
      )}

      {estado === 'listo' && productos.length === 0 && (
        <div className="inv-empty">
          <b>Todavía no hay productos</b>
          <p>Usa «Agregar producto» para registrar lo que tienes en existencia.</p>
        </div>
      )}

      {estado === 'listo' && productos.length > 0 && visibles.length === 0 && (
        <div className="inv-empty">
          <b>Sin resultados</b>
          <p>No hay productos que coincidan con «{busca.trim()}».</p>
        </div>
      )}

      {estado === 'listo' && grupos.map((g) => (
        <section className="inv-grupo" key={g.nombre} aria-label={g.nombre}>
          <h2>{g.nombre} <span>{g.items.length}</span></h2>
          <ul className="inv-lista">
            {g.items.map((p) => {
              const agotado = Number(p.cantidad) === 0;
              return (
                <li key={p.id} className={`inv-item${agotado ? ' agotado' : ''}`}>
                  <div className="inv-main">
                    <h3>{p.nombre}</h3>
                    <p>{agotado ? 'Agotado · ' : ''}Actualizado {haceCuanto(p.actualizadoEn)}</p>
                  </div>
                  <div className="inv-qty">
                    <b>{cifra(p.cantidad)}</b>
                    <span>{p.unidad}</span>
                  </div>
                  <KebabMenu
                    label={`Opciones de ${p.nombre}`}
                    items={[
                      { id: 'editar', label: 'Editar', icon: ICON_EDITAR, onSelect: () => setModal({ tipo: 'editar', id: p.id }) },
                      { id: 'borrar', label: 'Borrar', icon: ICON_BORRAR, peligro: true, onSelect: () => setModal({ tipo: 'borrar', id: p.id }) },
                    ]}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {(modal?.tipo === 'agregar' || editando) && (
        <ProductoModal
          producto={editando}
          categorias={categorias}
          onClose={() => setModal(null)}
          onSaved={(accion, nombre) => {
            setModal(null);
            setToast(accion === 'agregado' ? `Se agregó ${nombre}.` : `Se guardaron los cambios de ${nombre}.`);
          }}
        />
      )}

      {aBorrar && (
        <Modal title="Borrar producto" subtitle={`${aBorrar.nombre} · ${cifra(aBorrar.cantidad)} ${aBorrar.unidad}`} onClose={() => setModal(null)}>
          <p className="inv-confirma">Se borrará para siempre del inventario en todos los dispositivos.</p>
          <div className="inv-actions">
            <button type="button" className="inv-btn ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button
              type="button"
              className="inv-btn"
              onClick={() => { borrarProducto(aBorrar.id); setModal(null); setToast(`Se borró ${aBorrar.nombre}.`); }}
            >
              Sí, borrar
            </button>
          </div>
        </Modal>
      )}

      {toast && <div className="inv-toast" role="status">{toast}</div>}
    </div>
  );
}
