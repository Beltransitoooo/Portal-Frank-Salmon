from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registra las tablas en Base)
from app.config import CORS_ORIGIN_REGEX, CORS_ORIGINS
from app.database import Base, SessionLocal, engine
from app.auth import permiso_modulos
from app.routes import arribos, auth, colaboradores, inventario, menu, proveedores, urgencias
from app.seed import sembrar_admin, sembrar_proveedores


# Crea las tablas que falten y los proveedores iniciales. Se hace al importar (no en un
# evento de arranque) porque en Vercel no siempre se ejecutan esos eventos.
Base.metadata.create_all(bind=engine)
with SessionLocal() as _db:
    sembrar_proveedores(_db)
    sembrar_admin(_db)

# En Supabase, toda tabla del esquema public sin RLS queda expuesta en su API automática.
# Activarlo sin políticas la bloquea ahí; este backend entra como dueño de las tablas y no se ve afectado.
if engine.dialect.name == "postgresql":
    with engine.begin() as _conn:
        for _tabla in Base.metadata.sorted_tables:
            _conn.exec_driver_sql(f'ALTER TABLE "{_tabla.name}" ENABLE ROW LEVEL SECURITY')

app = FastAPI(title="API Portal Frank Salmon", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX or None,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

# Inicio de sesión (público) y módulos (exigen sesión; el rol básico solo consulta)
app.include_router(auth.router)
_protegido = [Depends(permiso_modulos)]
for _modulo in (proveedores, arribos, urgencias, inventario, menu, colaboradores):
    app.include_router(_modulo.router, dependencies=_protegido)


@app.get("/", tags=["Estado"])
def root():
    return {"mensaje": "Backend FastAPI operativo", "version": app.version}


@app.get("/health", tags=["Estado"])
def health():
    return {"ok": True}
