"""Datos iniciales del servidor.

Solo se crea el primer administrador. Ya no se dan de alta proveedores de ejemplo: los
proveedores reales se capturan desde el portal (Proveedores → Agregar proveedor).
"""
from sqlalchemy.orm import Session

from app import models


def sembrar_admin(db: Session) -> None:
    """Crea el primer administrador solo si no hay ningún usuario y está configurada
    ADMIN_PASSWORD_INICIAL. Al entrar por primera vez se le pide cambiar la contraseña."""
    from app.auth import hash_password
    from app.config import ADMIN_PASSWORD_INICIAL, ADMIN_USUARIO

    if len(ADMIN_PASSWORD_INICIAL) < 8 or db.query(models.Usuario).count() > 0:
        return
    db.add(models.Usuario(
        usuario=ADMIN_USUARIO,
        nombre="Administrador",
        rol="admin",
        password_hash=hash_password(ADMIN_PASSWORD_INICIAL),
        debe_cambiar_password=True,
    ))
    db.commit()
