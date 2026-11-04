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


@router.post("", response_model=schemas.ProveedorOut, status_code=201)
def crear_proveedor(datos: schemas.ProveedorCreate, db: Session = Depends(get_db)):
    nombre = " ".join(datos.nombre.split())
    if not nombre:
        raise HTTPException(status_code=422, detail="Escribe el nombre del proveedor")

    repetido = (
        db.query(models.Proveedor)
        .filter(func.lower(models.Proveedor.nombre) == nombre.lower())
        .first()
    )
    if repetido is not None:
        raise HTTPException(status_code=409, detail="Ya existe un proveedor con ese nombre")

    # id legible a partir del nombre; si ya está ocupado, se le agrega -2, -3...
    base = _slug(nombre)
    proveedor_id, n = base, 2
    while db.get(models.Proveedor, proveedor_id) is not None:
        proveedor_id, n = f"{base}-{n}", n + 1

    # Productos sin repetir (ignorando mayúsculas), con el nombre limpio
    productos, vistos = [], set()
    for p in datos.productos:
        limpio = " ".join(p.nombre.split())
        if limpio and limpio.lower() not in vistos:
            vistos.add(limpio.lower())
            productos.append({"nombre": limpio, "unidad": p.unidad})
    if not productos:
        raise HTTPException(status_code=422, detail="Agrega al menos un producto")

    proveedor = models.Proveedor(
        id=proveedor_id,
        nombre=nombre,
        categoria=" ".join(datos.categoria.split()),
        productos=productos,
        dias=datos.dias,
        hora=datos.hora,
        activo=True,
    )
    db.add(proveedor)
    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.get("/{proveedor_id}", response_model=schemas.ProveedorOut)
def obtener_proveedor(proveedor_id: str, db: Session = Depends(get_db)):
    proveedor = db.get(models.Proveedor, proveedor_id)
    if proveedor is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return proveedor
