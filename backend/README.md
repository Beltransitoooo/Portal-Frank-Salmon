# Backend del Portal Frank Salmon (FastAPI)

API que guarda Proveedores, Arribos y Urgencias para que todos los dispositivos vean los mismos datos.

## Correr en local

```bash
cd backend
python3 -m venv venv            # solo la primera vez
venv/bin/pip install -r requirements.txt
venv/bin/uvicorn app.main:app --reload
```

- API: http://localhost:8000 · Documentación interactiva: http://localhost:8000/docs
- Sin `DATABASE_URL`, usa un archivo SQLite local (`backend/portal.db`, ignorado por git).
- El frontend (`npm run dev` en `frontend/`) apunta a `http://localhost:8000` por defecto.

## Variables de entorno

| Variable | Para qué | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Base de datos (PostgreSQL en producción) | `postgresql://USUARIO:CONTRASEÑA@HOST:5432/portal_frank_salmon` |
| `CORS_ORIGINS` | Dominios del frontend que pueden llamar a la API, separados por coma | `https://tu-portal.vercel.app,http://localhost:5173` |

Las contraseñas van solo en estas variables, nunca en el código.

En el frontend (Vercel → Settings → Environment Variables) define `VITE_API_URL` con la URL pública de este backend y vuelve a desplegar.

## Desplegar: base en Supabase + API en Vercel

1. **Supabase**: crea un proyecto. En *Connect* copia la cadena de conexión del
   **Transaction pooler** (puerto 6543), que es la adecuada para serverless, y reemplaza
   `[YOUR-PASSWORD]` por la contraseña de la base. No la pegues en el código ni en chats.
2. **Vercel**: crea un proyecto nuevo con este mismo repositorio y **Root Directory = `backend`**.
   `vercel.json` y `api/index.py` ya lo preparan para FastAPI.
3. En ese proyecto, en *Settings → Environment Variables*:
   - `DATABASE_URL` = la cadena del paso 1 (se le agrega `sslmode=require` automáticamente).
   - `CORS_ORIGINS` = la URL del portal, p. ej. `https://tu-portal.vercel.app`.
4. Despliega y abre `https://TU-API.vercel.app/health`: debe responder `{"ok":true}`.
   La primera petición crea las tablas y el proveedor AROS en Supabase.
5. En el proyecto del **frontend**, define `VITE_API_URL` = `https://TU-API.vercel.app` y vuelve a desplegar.

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/health` | Verificación de que el servidor responde |
| GET | `/proveedores` | Proveedores activos |
| GET | `/proveedores/{id}` | Un proveedor |
| GET | `/arribos` | Todos los arribos |
| POST | `/arribos` | Crea un arribo (`proveedorId`, `fecha`, `hora`, `items`, `notas`) |
| PATCH | `/arribos/{id}` | Cambia estado: `{"estado": "recepcionado"}` o `"pendiente"` |
| POST | `/arribos/importar` | Sube arribos guardados antes en un navegador (los usa el frontend automáticamente) |
| GET | `/urgencias` | Todas las urgencias |
| POST | `/urgencias` | Crea una urgencia (`producto`, `cantidad`, `unidad`, `notas`) |
| PATCH | `/urgencias/{id}` | Cambia estado: `{"estado": "surtido"}` o `"pendiente"` |
| POST | `/urgencias/importar` | Sube urgencias guardadas antes en un navegador |

## Proveedores

Los proveedores iniciales están en `app/seed.py` y se crean al arrancar si no existen.
Los datos de AROS son de ejemplo: corrígelos ahí antes del primer arranque en producción,
o después directamente en la base de datos.

## Si ya tenías la base local de la versión anterior

La versión anterior creaba tablas `proveedores`, `usuarios` y `entregas` con otra estructura.
Si apuntas `DATABASE_URL` a esa base, borra esas tablas primero (o usa una base nueva);
de lo contrario el arranque fallará porque `proveedores` no tiene las columnas nuevas.

## Seguridad

La API no pide inicio de sesión: cualquiera que conozca su URL puede leer y modificar los datos.
Limitar `CORS_ORIGINS` al dominio del portal evita que otros sitios la usen desde el navegador,
pero no protege contra llamadas directas.
