import re
import unicodedata
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])


def _slug(texto: str) -> str:
    """"Mariscos Del Pacífico" -> "mariscos-del-pacifico" """
    sin_acentos = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^a-z0-9]+", "-", sin_acentos.lower()).strip("-")
    return slug[:56] or "proveedor"


@router.get("", response_model=List[schemas.ProveedorOut])
def listar_proveedores(db: Session = Depends(get_db)):
    return (
        db.query(models.Proveedor)
        .filter(models.Proveedor.activo.is_(True))
        .order_by(models.Proveedor.nombre)
        .all()
    )


def _limpiar(datos: schemas.ProveedorCreate, db: Session, excluir_id: str = None) -> dict:
    """Valida y normaliza los datos de alta o edición. excluir_id: el proveedor que se
    está editando, para que su propio nombre no cuente como repetido."""
    nombre = " ".join(datos.nombre.split())
    if not nombre:
        raise HTTPException(status_code=422, detail="Escribe el nombre del proveedor")

    repetido = db.query(models.Proveedor).filter(func.lower(models.Proveedor.nombre) == nombre.lower())
    if excluir_id:
        repetido = repetido.filter(models.Proveedor.id != excluir_id)
    if repetido.first() is not None:
        raise HTTPException(status_code=409, detail="Ya existe un proveedor con ese nombre")

    # Productos sin repetir (ignorando mayúsculas), con el nombre limpio
    productos, vistos = [], set()
    for p in datos.productos:
        limpio = " ".join(p.nombre.split())
        if limpio and limpio.lower() not in vistos:
            vistos.add(limpio.lower())
            productos.append({"nombre": limpio, "unidad": p.unidad})
    if not productos:
        raise HTTPException(status_code=422, detail="Agrega al menos un producto")

    return {
        "nombre": nombre,
        "categoria": " ".join(datos.categoria.split()),
        "productos": productos,
        "dias": datos.dias,
        "hora": datos.hora,
    }


@router.post("", response_model=schemas.ProveedorOut, status_code=201)
def crear_proveedor(datos: schemas.ProveedorCreate, db: Session = Depends(get_db)):
    valores = _limpiar(datos, db)

    # id legible a partir del nombre; si ya está ocupado, se le agrega -2, -3...
    base = _slug(valores["nombre"])
    proveedor_id, n = base, 2
    while db.get(models.Proveedor, proveedor_id) is not None:
        proveedor_id, n = f"{base}-{n}", n + 1

    proveedor = models.Proveedor(id=proveedor_id, activo=True, **valores)
    db.add(proveedor)
    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.patch("/{proveedor_id}", response_model=schemas.ProveedorOut)
def editar_proveedor(proveedor_id: str, datos: schemas.ProveedorCreate, db: Session = Depends(get_db)):
    """Reemplaza todos los datos del proveedor (los mismos campos que el alta).
    El id no cambia, así que sus arribos siguen ligados a él."""
    proveedor = db.get(models.Proveedor, proveedor_id)
    if proveedor is None or not proveedor.activo:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    valores = _limpiar(datos, db, excluir_id=proveedor_id)
    for campo, valor in valores.items():
        setattr(proveedor, campo, valor)

    # Si cambió el nombre, los arribos de este proveedor lo muestran actualizado
    db.query(models.Arribo).filter(models.Arribo.proveedor_id == proveedor_id).update(
        {models.Arribo.proveedor_nombre: valores["nombre"]}, synchronize_session=False
    )
    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.get("/{proveedor_id}", response_model=schemas.ProveedorOut)
def obtener_proveedor(proveedor_id: str, db: Session = Depends(get_db)):
    proveedor = db.get(models.Proveedor, proveedor_id)
    if proveedor is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return proveedor
