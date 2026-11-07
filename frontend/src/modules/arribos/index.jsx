import React, { useState } from 'react';
import ModuleHeader from '../../components/Moduleheader';
import Modal from '../../components/Modal';
import { SkeletonList } from '../../components/Skeleton';
import { diaDe, diasHasta, formatFecha, rotuloDia } from '../fechas';
import { useProveedores } from '../proveedores/api';
import ArriboModal from '../proveedores/components/Arribomodal';
import ArriboItem from './components/ArriboItem';
import { cancelarArribo, limpiarRecepcionados, recargarArribos, useArribos, useArribosEstado } from './store';
import './arribos.css';

const TABS = [
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'recepcionados', label: 'Recepcionados' },
];
const ATRASADOS = 'atrasados';

/* Quita acentos para buscar «camaron» y encontrar «Camarón» */
const plano = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const ICON_BASURA = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);

export default function Arribos({ onBack, onOpenModule }) {
  const [tab, setTab] = useState('pendientes');
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(null); // { tipo: 'elegir' } | { tipo: 'nuevo', proveedor } | { tipo: 'cancelar', id } | { tipo: 'limpiar' }
  const [provElegido, setProvElegido] = useState('');
  const [toast, setToast] = useState(null);
  const todos = useArribos();
  const estado = useArribosEstado();
  const proveedores = useProveedores().proveedores.filter((p) => p.activo !== false);

  const pendientes = todos
    .filter((a) => a.estado === 'pendiente')
    .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
  const recepcionados = todos
    .filter((a) => a.estado === 'recepcionado')
    .sort((a, b) => b.recepcionadoEn.localeCompare(a.recepcionadoEn));
  const enPestana = tab === 'pendientes' ? pendientes : recepcionados;

  const q = plano(busca.trim());
  const lista = enPestana.filter(
    (a) => !q || plano(a.proveedorNombre).includes(q) || a.items.some((it) => plano(it.producto).includes(q)),
  );

  // Pendientes: atrasados juntos arriba y luego por fecha esperada. Recepcionados: por día en que llegaron.
  const grupoDe = (a) => {
    if (tab === 'recepcionados') return diaDe(a.recepcionadoEn);
    return diasHasta(a.fecha) < 0 ? ATRASADOS : a.fecha;
  };
  const grupos = [...new Set(lista.map(grupoDe))].map((g) => ({
    id: g,
    nombre: g === ATRASADOS ? 'Atrasados' : rotuloDia(g),
    items: lista.filter((a) => grupoDe(a) === g),
  }));

  const hoy = pendientes.filter((a) => diasHasta(a.fecha) === 0).length;
  const atrasados = pendientes.filter((a) => diasHasta(a.fecha) < 0).length;
  const aCancelar = modal?.tipo === 'cancelar' ? todos.find((a) => a.id === modal.id) : null;

  const avisar = (texto) => {
    setToast(texto);
    setTimeout(() => setToast((t) => (t === texto ? null : t)), 4000);
  };

  return (
    <div className="mod arr">
      <ModuleHeader
        title="Arribos"
        subtitle="Lo que esperas de tus proveedores y lo que ya llegó"
        onBack={onBack}
        onRefresh={recargarArribos}
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
        <button
          type="button"
          className="lst-agregar"
          onClick={() => { setProvElegido(''); setModal({ tipo: 'elegir' }); }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Agregar arribo
        </button>
      </div>

      <div className="lst-cats" role="tablist" aria-label="Estado de los arribos">
        {TABS.map((t) => {
          const n = t.id === 'pendientes' ? pendientes.length : recepcionados.length;
          return (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
              {n > 0 && <span className="lst-n">{n}</span>}
            </button>
          );
        })}
      </div>

      {estado === 'listo' && enPestana.length > 0 && (
        <div className="lst-resumen">
          {tab === 'pendientes' ? (
            <span>
              <b>{pendientes.length}</b> {pendientes.length === 1 ? 'pendiente' : 'pendientes'}
              {hoy > 0 && <> · <b>{hoy}</b> hoy</>}
              {atrasados > 0 && <> · <span className="lst-alerta">{atrasados} {atrasados === 1 ? 'atrasado' : 'atrasados'}</span></>}
            </span>
          ) : (
            <>
              <span><b>{recepcionados.length}</b> {recepcionados.length === 1 ? 'recepcionado' : 'recepcionados'}</span>
              <button type="button" className="lst-peligro" onClick={() => setModal({ tipo: 'limpiar' })}>
                {ICON_BASURA}
                Limpiar arribos
              </button>
            </>
          )}
        </div>
      )}

      {estado === 'cargando' && <SkeletonList count={3} />}

      {estado === 'error' && (
        <div className="lst-empty" role="alert">
          <b>No hay conexión con el servidor</b>
          <p>Revisa tu conexión; los arribos aparecerán en cuanto se recupere.</p>
        </div>
      )}

      {estado === 'listo' && enPestana.length === 0 && (
        <div className="lst-empty" role="tabpanel">
          <b>{tab === 'pendientes' ? 'No hay arribos pendientes' : 'Aún no hay arribos recepcionados'}</b>
          <p>
            {tab === 'pendientes'
              ? 'Usa «Agregar arribo» para registrar lo que esperas de un proveedor.'
              : 'Cuando marques un arribo como recepcionado, aparecerá aquí.'}
          </p>
        </div>
      )}

      {estado === 'listo' && enPestana.length > 0 && lista.length === 0 && (
        <div className="lst-empty">
          <b>Sin resultados</b>
          <p>No hay arribos que coincidan con «{busca.trim()}».</p>
        </div>
      )}

      {estado === 'listo' && grupos.map((g) => (
        <section className="lst-grupo" key={g.id} role="tabpanel" aria-label={g.nombre}>
          <h2 className={g.id === ATRASADOS ? 'alerta' : undefined}>{g.nombre} <span>{g.items.length}</span></h2>
          <ul className="lst-lista">
            {g.items.map((a) => (
              <ArriboItem key={a.id} arribo={a} onCancelar={(x) => setModal({ tipo: 'cancelar', id: x.id })} />
            ))}
          </ul>
        </section>
      ))}

      {/* Paso 1 de «Agregar arribo»: elegir de qué proveedor */}
      {modal?.tipo === 'elegir' && (
        <Modal title="Agregar arribo" subtitle="¿De qué proveedor?" onClose={() => setModal(null)}>
          {proveedores.length ? (
            <form
              className="frm"
              onSubmit={(e) => {
                e.preventDefault();
                const p = proveedores.find((x) => x.id === provElegido);
                if (p) setModal({ tipo: 'nuevo', proveedor: p });
              }}
            >
              <label className="fld">
                <span>Proveedor</span>
                <select value={provElegido} onChange={(e) => setProvElegido(e.target.value)} autoFocus>
                  <option value="" disabled>Elige un proveedor…</option>
                  {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </label>
              <div className="lst-actions">
                <button type="button" className="lst-btn ghost" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="lst-btn" disabled={!provElegido}>Continuar</button>
              </div>
            </form>
          ) : (
            <>
              <p className="lst-confirma">No hay proveedores habilitados. Da de alta uno (o vuelve a habilitarlo) en Proveedores; los arribos se registran con lo que él surte.</p>
              <div className="lst-actions">
                <button type="button" className="lst-btn ghost" onClick={() => setModal(null)}>Cerrar</button>
                {onOpenModule && (
                  <button type="button" className="lst-btn" onClick={() => onOpenModule('proveedores')}>Ir a Proveedores</button>
                )}
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Paso 2: la misma ventana de arribo que se usa desde Proveedores */}
      {modal?.tipo === 'nuevo' && (
        <ArriboModal
          proveedor={modal.proveedor}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); setTab('pendientes'); avisar(`Arribo de ${modal.proveedor.nombre} agregado.`); }}
        />
      )}

      {aCancelar && (
        <Modal
          title="Cancelar arribo"
          subtitle={`${aCancelar.proveedorNombre} · ${formatFecha(aCancelar.fecha)}`}
          onClose={() => setModal(null)}
        >
          <p className="lst-confirma">El arribo se borrará para siempre de todos los dispositivos.</p>
          <div className="lst-actions">
            <button type="button" className="lst-btn ghost" onClick={() => setModal(null)}>Volver</button>
            <button
              type="button"
              className="lst-btn"
              onClick={() => { cancelarArribo(aCancelar.id); setModal(null); avisar(`Se canceló el arribo de ${aCancelar.proveedorNombre}.`); }}
            >
              Sí, cancelar
            </button>
          </div>
        </Modal>
      )}

      {modal?.tipo === 'limpiar' && (
        <Modal
          title="Limpiar arribos"
          subtitle={`${recepcionados.length} ${recepcionados.length === 1 ? 'arribo recepcionado' : 'arribos recepcionados'}`}
          onClose={() => setModal(null)}
        >
          <p className="lst-confirma">
            Se borrarán para siempre de todos los dispositivos. Los arribos pendientes no se tocan.
          </p>
          <div className="lst-actions">
            <button type="button" className="lst-btn ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button
              type="button"
              className="lst-btn"
              onClick={() => { limpiarRecepcionados(); setModal(null); avisar('Se limpiaron los arribos recepcionados.'); }}
            >
              Sí, limpiar
            </button>
          </div>
        </Modal>
      )}

      {toast && <div className="lst-toast" role="status"><span>{toast}</span></div>}
    </div>
  );
}
