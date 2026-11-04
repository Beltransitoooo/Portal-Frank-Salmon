from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registra las tablas en Base)
from app.config import CORS_ORIGIN_REGEX, CORS_ORIGINS
from app.database import Base, SessionLocal, engine
from app.routes import arribos, proveedores, urgencias
from app.seed import sembrar_proveedores


# Crea las tablas que falten y los proveedores iniciales. Se hace al importar (no en un
# evento de arranque) porque en Vercel no siempre se ejecutan esos eventos.
Base.metadata.create_all(bind=engine)
with SessionLocal() as _db:
    sembrar_proveedores(_db)

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
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type"],
)

app.include_router(proveedores.router)
app.include_router(arribos.router)
app.include_router(urgencias.router)


@app.get("/", tags=["Estado"])
def root():
    return {"mensaje": "Backend FastAPI operativo", "version": app.version}


@app.get("/health", tags=["Estado"])
def health():
    return {"ok": True}
