from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import HASH_RELLENO, con_zona, crear_token, hash_password, usuario_actual, verificar_password
from app.config import AUTH_SECRET, BLOQUEO_MINUTOS, INTENTOS_MAXIMOS
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["Sesión"])

CREDENCIALES_MAL = "Usuario o contraseña incorrectos."


def _sesion(usuario: models.Usuario) -> dict:
    return {"token": crear_token(usuario), "usuario": usuario}


@router.post("/login", response_model=schemas.SesionOut)
def login(datos: schemas.LoginIn, db: Session = Depends(get_db)):
    if not AUTH_SECRET:
        raise HTTPException(status_code=503, detail="El servidor aún no tiene configurado el inicio de sesión (AUTH_SECRET).")
    if db.query(models.Usuario).count() == 0:
        raise HTTPException(status_code=503, detail="Todavía no hay usuarios. Falta configurar ADMIN_PASSWORD_INICIAL en el servidor.")

    usuario = db.query(models.Usuario).filter(models.Usuario.usuario == datos.usuario.strip().lower()).first()
    if usuario is None:
        verificar_password(datos.password, HASH_RELLENO)  # mismo tiempo de respuesta
        raise HTTPException(status_code=401, detail=CREDENCIALES_MAL)

    ahora = datetime.now(timezone.utc)
    if usuario.bloqueado_hasta and con_zona(usuario.bloqueado_hasta) > ahora:
        minutos = max(1, round((con_zona(usuario.bloqueado_hasta) - ahora).total_seconds() / 60))
        raise HTTPException(status_code=429, detail=f"Demasiados intentos. Intenta de nuevo en {minutos} min.")

    if not verificar_password(datos.password, usuario.password_hash):
        usuario.intentos_fallidos += 1
        if usuario.intentos_fallidos >= INTENTOS_MAXIMOS:
            usuario.intentos_fallidos = 0
            usuario.bloqueado_hasta = ahora + timedelta(minutes=BLOQUEO_MINUTOS)
        db.commit()
        raise HTTPException(status_code=401, detail=CREDENCIALES_MAL)

    if not usuario.activo:
        raise HTTPException(status_code=403, detail="Este usuario está desactivado.")

    usuario.intentos_fallidos = 0
    usuario.bloqueado_hasta = None
    usuario.ultimo_acceso = ahora
    db.commit()
    db.refresh(usuario)
    return _sesion(usuario)


@router.get("/yo", response_model=schemas.UsuarioOut)
def yo(usuario: models.Usuario = Depends(usuario_actual)):
    return usuario


@router.post("/cambiar-password", response_model=schemas.SesionOut)
def cambiar_password(
    datos: schemas.CambiarPasswordIn,
    usuario: models.Usuario = Depends(usuario_actual),
    db: Session = Depends(get_db),
):
    """Cualquier usuario puede cambiar la suya. Cierra las demás sesiones y devuelve una nueva."""
    if not verificar_password(datos.actual, usuario.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual no es correcta.")
    if datos.nueva == datos.actual:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe ser distinta de la actual.")
    usuario.password_hash = hash_password(datos.nueva)
    usuario.debe_cambiar_password = False
    usuario.sesion_version += 1
    db.commit()
    db.refresh(usuario)
    return _sesion(usuario)
