"""Contraseñas, sesiones firmadas y permisos.

- Contraseñas: PBKDF2-SHA256 con 600,000 iteraciones (recomendación OWASP) y sal al azar por
  usuario; viene en la biblioteca estándar de cualquier Python.
- Sesión: token firmado con HMAC-SHA256 y AUTH_SECRET; dura SESION_HORAS. Lleva la versión
  de sesión del usuario: al cambiar la contraseña, los tokens anteriores dejan de servir.
- Permisos: toda la API de los módulos exige sesión; el rol «basico» solo puede consultar.
"""
import base64
import hashlib
import hmac
import json
import secrets
import time
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import models
from app.config import AUTH_SECRET, SESION_HORAS
from app.database import get_db

ITERACIONES = 600_000


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(texto: str) -> bytes:
    return base64.urlsafe_b64decode(texto + "=" * (-len(texto) % 4))


# ---------- Contraseñas ----------

def hash_password(password: str) -> str:
    sal = secrets.token_bytes(16)
    clave = hashlib.pbkdf2_hmac("sha256", password.encode(), sal, ITERACIONES)
    return f"pbkdf2_sha256${ITERACIONES}${_b64(sal)}${_b64(clave)}"


def verificar_password(password: str, guardado: str) -> bool:
    try:
        algoritmo, iteraciones, sal, clave = guardado.split("$")
        if algoritmo != "pbkdf2_sha256":
            return False
        calculada = hashlib.pbkdf2_hmac("sha256", password.encode(), _unb64(sal), int(iteraciones))
        return hmac.compare_digest(calculada, _unb64(clave))
    except (ValueError, TypeError):
        return False


# Hash de relleno: si el usuario no existe se verifica contra este, para que la respuesta
# tarde lo mismo y no delate qué usuarios existen
HASH_RELLENO = hash_password(secrets.token_hex(16))


# ---------- Sesiones ----------

def crear_token(usuario: models.Usuario) -> str:
    datos = {"sub": usuario.id, "v": usuario.sesion_version, "exp": int(time.time()) + SESION_HORAS * 3600}
    cuerpo = _b64(json.dumps(datos, separators=(",", ":")).encode())
    firma = _b64(hmac.new(AUTH_SECRET.encode(), cuerpo.encode(), hashlib.sha256).digest())
    return f"{cuerpo}.{firma}"


def leer_token(token: str):
    """Devuelve los datos del token si la firma es válida y no ha vencido; si no, None."""
    if not AUTH_SECRET:
        return None
    try:
        cuerpo, firma = token.split(".")
        esperada = _b64(hmac.new(AUTH_SECRET.encode(), cuerpo.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(firma, esperada):
            return None
        datos = json.loads(_unb64(cuerpo))
        return datos if datos.get("exp", 0) > time.time() else None
    except (ValueError, TypeError, json.JSONDecodeError):
        return None


def con_zona(valor: datetime) -> datetime:
    """SQLite guarda las fechas sin zona horaria; todo se guarda en UTC."""
    return valor.replace(tzinfo=timezone.utc) if valor.tzinfo is None else valor


# ---------- Dependencias para las rutas ----------

def usuario_actual(request: Request, db: Session = Depends(get_db)) -> models.Usuario:
    """Exige una sesión válida (encabezado Authorization: Bearer <token>)."""
    encabezado = request.headers.get("Authorization", "")
    datos = leer_token(encabezado[7:]) if encabezado.startswith("Bearer ") else None
    usuario = db.get(models.Usuario, datos["sub"]) if datos else None
    if usuario is None or not usuario.activo or usuario.sesion_version != datos.get("v"):
        raise HTTPException(status_code=401, detail="Tu sesión terminó. Vuelve a iniciar sesión.")
    return usuario


def permiso_modulos(request: Request, usuario: models.Usuario = Depends(usuario_actual)) -> models.Usuario:
    """Cualquier usuario con sesión puede consultar; solo el administrador puede modificar."""
    if request.method not in ("GET", "HEAD", "OPTIONS") and usuario.rol != "admin":
        raise HTTPException(status_code=403, detail="Tu usuario es de solo consulta.")
    return usuario


def requiere_admin(usuario: models.Usuario = Depends(usuario_actual)) -> models.Usuario:
    """Solo el administrador (gestión de usuarios)."""
    if usuario.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo un administrador puede gestionar usuarios.")
    return usuario
