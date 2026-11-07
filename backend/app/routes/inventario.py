from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/inventario", tags=["Inventario"])


def _limpio(texto: str) -> str:
    return " ".join(texto.split())


def _sin_repetir(db: Session, nombre: str, excepto: Optional[str] = None):
    """Dos productos no pueden llamarse igual (sin importar mayúsculas)."""
    q = db.query(models.ProductoInventario).filter(func.lower(models.ProductoInventario.nombre) == nombre.lower())
    if excepto:
        q = q.filter(models.ProductoInventario.id != excepto)
    if q.first() is not None:
        raise HTTPException(status_code=409, detail="Ya existe un producto con ese nombre")


@router.get("", response_model=List[schemas.InventarioOut])
def listar_inventario(db: Session = Depends(get_db)):
    return (
        db.query(models.ProductoInventario)
        .order_by(models.ProductoInventario.categoria, models.ProductoInventario.nombre)
        .all()
    )


@router.post("", response_model=schemas.InventarioOut, status_code=201)
def crear_producto(datos: schemas.InventarioCreate, db: Session = Depends(get_db)):
    # Si el mismo id ya existe (p. ej. el navegador reintentó), devolvemos el que hay
    if datos.id:
        existente = db.get(models.ProductoInventario, datos.id)
        if existente is not None:
            return existente

    nombre = _limpio(datos.nombre)
    _sin_repetir(db, nombre)
    producto = models.ProductoInventario(
        nombre=nombre,
        categoria=_limpio(datos.categoria),
        cantidad=datos.cantidad,
        unidad=datos.unidad,
    )
    if datos.id:
        producto.id = datos.id
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


@router.patch("/{producto_id}", response_model=schemas.InventarioOut)
def actualizar_producto(producto_id: str, datos: schemas.InventarioUpdate, db: Session = Depends(get_db)):
    producto = db.get(models.ProductoInventario, producto_id)
    if producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if datos.nombre is not None:
        nombre = _limpio(datos.nombre)
        _sin_repetir(db, nombre, excepto=producto.id)
        producto.nombre = nombre
    if datos.categoria is not None:
        producto.categoria = _limpio(datos.categoria)
    if datos.cantidad is not None:
        producto.cantidad = datos.cantidad
    if datos.unidad is not None:
        producto.unidad = datos.unidad
    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/{producto_id}", response_model=schemas.ResultadoLimpieza)
def borrar_producto(producto_id: str, db: Session = Depends(get_db)):
    """Si ya no existe responde 0 (otro dispositivo lo borró)."""
    producto = db.get(models.ProductoInventario, producto_id)
    if producto is None:
        return {"borrados": 0}
    db.delete(producto)
    db.commit()
    return {"borrados": 1}
