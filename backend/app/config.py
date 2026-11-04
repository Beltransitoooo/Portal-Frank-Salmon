"""Configuración del backend, leída de variables de entorno.

Nunca escribas contraseñas ni cadenas de conexión aquí: van en el entorno del servidor.

- DATABASE_URL   Conexión a la base de datos. Ejemplo para PostgreSQL:
                 postgresql://USUARIO:CONTRASEÑA@HOST:5432/portal_frank_salmon
                 Si no se define, usa un archivo SQLite local (portal.db), útil para desarrollo.
- CORS_ORIGINS   Orígenes del frontend permitidos, separados por coma.
                 Ejemplo: https://portal-frank-salmon.vercel.app,http://localhost:5173
"""
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./portal.db")

# Algunos proveedores de hosting entregan "postgres://", que SQLAlchemy ya no acepta
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql://" + DATABASE_URL[len("postgres://"):]

# Supabase exige conexión cifrada
if "supabase" in DATABASE_URL and "sslmode=" not in DATABASE_URL:
    DATABASE_URL += ("&" if "?" in DATABASE_URL else "?") + "sslmode=require"

# En Vercel (serverless) cada petición puede correr en una instancia nueva: no se
# mantienen conexiones abiertas; el pooler de Supabase se encarga de reutilizarlas.
SERVERLESS = bool(os.getenv("VERCEL"))

# Tolera errores comunes al capturarla en Vercel: espacios, comillas y "/" al final
CORS_ORIGINS = [
    o.strip().strip("\"'").strip().rstrip("/")
    for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if o.strip().strip("\"'").strip()
]

# Además de la lista anterior, se aceptan los orígenes que cumplan este patrón: el dominio
# fijo del portal en Vercel y sus URLs de despliegue, que cambian en cada despliegue
# (p. ej. portal-frank-salmon-yxov-ceeky1h48-angel-beltran1.vercel.app).
CORS_ORIGIN_REGEX = os.getenv(
    "CORS_ORIGIN_REGEX",
    r"^https://portal-frank-salmon-yxov(-[a-z0-9]+-angel-beltran1)?\.vercel\.app$",
)
