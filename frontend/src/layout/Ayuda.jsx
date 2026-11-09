import React from 'react';
import { MODULES } from '../modules';

/* Contacto de soporte que se muestra en la ayuda. Llénalo cuando se defina
 * (p. ej. { nombre: 'Soporte del portal', contacto: 'WhatsApp 667 000 0000', horario: 'L a S, 9 a 18 h' }).
 * Mientras sea null, la ayuda indica acudir al administrador. */
const SOPORTE = null;

/* Para qué sirve cada módulo (solo se muestran los que ya están en uso) */
const USOS = {
  proveedores: <>Quién te surte, qué trae y qué días llega. Desde <b>⋮ → Agregar arribo</b> registras lo que esperas. Si dejas de trabajar con uno, <b>Deshabilitar</b> (no se borra).</>,
  arribos: <>Lo que esperas y lo que ya llegó, agrupado por día. Al recibir: <b>⋮ → Marcar como recepcionado</b>. Si no va a llegar: <b>Cancelar arribo</b>.</>,
  urgencias: <>Compras que hay que surtir ya. Cuando la consigas: <b>⋮ → Marcar como surtido</b>.</>,
  inventario: <>Existencias por producto (Mariscos, Cerveza, Coca-Cola, Abarrote, Plásticos, Químicos). En 0 aparece como <b>Agotado</b>.</>,
  menu: <>Platillos y precios por sección. Si algo se acabó por hoy: <b>⋮ → Marcar no disponible</b>; no lo borres.</>,
  colaboradores: <>El equipo por área, con puesto, turno y antigüedad. Si alguien deja de trabajar: <b>Dar de baja</b>.</>,
};

/* Manual rápido dentro del portal (Perfil → Ayuda). Mismo contenido que docs/manual-de-uso.md */
export default function Ayuda({ admin }) {
  const modulos = MODULES.filter((m) => !m.soon && USOS[m.id]);

  return (
    <section className="lst-grupo perfil-seccion" aria-labelledby="perfil-ayuda">
      <h2 id="perfil-ayuda">Ayuda</h2>

      <div className="ayuda">
        <details>
          <summary>Entrar y tu contraseña</summary>
          <ol>
            <li>Escribe tu <b>usuario</b> y tu <b>contraseña</b> (te los da el administrador).</li>
            <li>La <b>primera vez</b> el portal te pide crear tu propia contraseña, de mínimo 8 caracteres.</li>
            <li>La sesión dura <b>12 horas</b>. En un equipo compartido, ciérrala al terminar: <b>Perfil → Cerrar sesión</b>.</li>
          </ol>
          <p>¿La olvidaste o te equivocaste 5 veces? La cuenta se bloquea 15 minutos. Pide al administrador que la <b>restablezca</b> y te dé una temporal nueva.</p>
        </details>

        <details>
          <summary>Moverte en el portal</summary>
          <ul>
            <li><b>Inicio:</b> el resumen del día, la cifra de cada módulo y la nota de <b>Pendientes</b> (urgencias y arribos de hoy o atrasados). Toca la ★ para destacar un módulo.</li>
            <li><b>Módulos:</b> la lista de todos los módulos.</li>
            <li><b>Perfil:</b> tus datos, cambiar tu contraseña, esta ayuda y cerrar sesión.</li>
          </ul>
          <p>Dentro de cada módulo: el <b>buscador</b> arriba, las <b>píldoras</b> para filtrar y los <b>tres puntitos (⋮)</b> de cada renglón para editar, cambiar estado o borrar. Antes de borrar siempre se pide confirmación.</p>
        </details>

        <details>
          <summary>Para qué sirve cada módulo</summary>
          <dl className="ayuda-modulos">
            {modulos.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.id}>
                  <dt><span className="menu-mod-ico"><Icon /></span>{m.title}</dt>
                  <dd>{USOS[m.id]}</dd>
                </div>
              );
            })}
          </dl>
        </details>

        <details>
          <summary>Roles</summary>
          <ul>
            <li><b>Administrador:</b> consulta y modifica todo, y crea cuentas en <b>Perfil → Usuarios</b>.</li>
            <li><b>Solo consulta:</b> ve todos los módulos, pero no puede agregar, editar ni borrar.</li>
          </ul>
        </details>

        {admin && (
          <details>
            <summary>Crear una cuenta (administrador)</summary>
            <ol>
              <li><b>Perfil → Usuarios → Agregar usuario.</b></li>
              <li>Escribe el nombre, el usuario (sin espacios, p. ej. <code>gerente.culiacan</code>) y elige el rol.</li>
              <li>Toca <b>Crear usuario</b>: aparece una <b>contraseña temporal una sola vez</b>. Compártela en privado.</li>
            </ol>
            <p>Desde los <b>⋮</b> de cada cuenta también puedes <b>Editar</b>, <b>Restablecer contraseña</b> o <b>Desactivar cuenta</b>.</p>
          </details>
        )}

        <details>
          <summary>Si algo no carga</summary>
          <ul>
            <li>Toca <b>Actualizar</b> en el módulo.</li>
            <li>Revisa tu conexión a internet.</li>
            <li>Si aparece «Tu sesión terminó», vuelve a entrar.</li>
            <li>
              Si sigue fallando, {SOPORTE
                ? <>escribe a <b>{SOPORTE.nombre}</b>: {SOPORTE.contacto}{SOPORTE.horario ? ` (${SOPORTE.horario})` : ''}.</>
                : <>avisa al administrador del portal.</>} Una captura de pantalla ayuda mucho.
            </li>
          </ul>
        </details>
      </div>
    </section>
  );
}
