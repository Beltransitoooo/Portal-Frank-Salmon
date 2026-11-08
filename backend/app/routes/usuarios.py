"""Gestión de usuarios (solo administrador).

Protecciones para no quedarse sin acceso: un administrador no puede desactivarse a sí mismo
ni quitarse su rol, y siempre debe quedar al menos un administrador activo.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import hash_password, requiere_admin
from app.database import get_db

router = APIRouter(prefix="/usuarios", tags=["Usuarios"], dependencies=[Depends(requiere_admin)])


def _limpio(texto: str) -> str:
    return " ".join(texto.split())


def _admins_activos(db: Session) -> int:
    return db.query(models.Usuario).filter(models.Usuario.rol == "admin", models.Usuario.activo.is_(True)).count()


def _obtener(db: Session, usuario_id: str) -> models.Usuario:
    usuario = db.get(models.Usuario, usuario_id)
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    return usuario


@router.get("", response_model=List[schemas.UsuarioAdminOut])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).order_by(models.Usuario.nombre).all()


@router.post("", response_model=schemas.UsuarioAdminOut, status_code=201)
def crear_usuario(datos: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(models.Usuario).filter(models.Usuario.usuario == datos.usuario).first() is not None:
        raise HTTPException(status_code=409, detail="Ese nombre de usuario ya existe.")
    nuevo = models.Usuario(
        usuario=datos.usuario,
        nombre=_limpio(datos.nombre),
        rol=datos.rol,
        password_hash=hash_password(datos.password),
        debe_cambiar_password=True,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.patch("/{usuario_id}", response_model=schemas.UsuarioAdminOut)
def editar_usuario(
    usuario_id: str,
    datos: schemas.UsuarioUpdate,
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(requiere_admin),
):
    usuario = _obtener(db, usuario_id)
    propio = usuario.id == admin.id

    if datos.rol is not None and datos.rol != usuario.rol:
        if propio:
            raise HTTPException(status_code=400, detail="No puedes cambiar tu propio rol.")
        if usuario.rol == "admin" and usuario.activo and _admins_activos(db) <= 1:
            raise HTTPException(status_code=400, detail="Debe quedar al menos un administrador activo.")
        usuario.rol = datos.rol

    if datos.activo is not None and datos.activo != usuario.activo:
        if propio:
            raise HTTPException(status_code=400, detail="No puedes desactivar tu propia cuenta.")
        if not datos.activo and usuario.rol == "admin" and _admins_activos(db) <= 1:
            raise HTTPException(status_code=400, detail="Debe quedar al menos un administrador activo.")
        usuario.activo = datos.activo
        if not datos.activo:
            usuario.sesion_version += 1  # cierra su sesión de inmediato

    if datos.nombre is not None:
        usuario.nombre = _limpio(datos.nombre)

    db.commit()
    db.refresh(usuario)
    return usuario


@router.post("/{usuario_id}/restablecer", response_model=schemas.UsuarioAdminOut)
def restablecer_password(usuario_id: str, datos: schemas.RestablecerPasswordIn, db: Session = Depends(get_db)):
    """Pone una contraseña temporal: la persona deberá cambiarla al entrar. También quita el
    bloqueo por intentos fallidos y cierra las sesiones que tenga abiertas."""
    usuario = _obtener(db, usuario_id)
    usuario.password_hash = hash_password(datos.password)
    usuario.debe_cambiar_password = True
    usuario.sesion_version += 1
    usuario.intentos_fallidos = 0
    usuario.bloqueado_hasta = None
    db.commit()
    db.refresh(usuario)
    return usuario
