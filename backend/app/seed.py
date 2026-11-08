"""Proveedores iniciales. Se insertan solo si todavía no existen en la base de datos.

⚠️ Los productos, días y hora de AROS son DE EJEMPLO (venían de frontend/src/modules/proveedores/data.js).
Corrígelos aquí, o directamente en la base de datos, con los datos reales.
"""
from sqlalchemy.orm import Session

from app import models

PROVEEDORES_INICIALES = [
    {
        "id": "aros",
        "nombre": "AROS",
        "categoria": "Mariscos",
        "productos": [
            {"nombre": "Camarón", "unidad": "kg"},
            {"nombre": "Pulpo", "unidad": "kg"},
            {"nombre": "Callo de hacha", "unidad": "kg"},
            {"nombre": "Pescado fresco", "unidad": "kg"},
        ],
        "dias": [1, 3, 5],  # 0 = domingo ... 6 = sábado
        "hora": "07:00",
    },
]


def sembrar_proveedores(db: Session) -> None:
    for datos in PROVEEDORES_INICIALES:
        if db.get(models.Proveedor, datos["id"]) is None:
            db.add(models.Proveedor(**datos))
    db.commit()


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
