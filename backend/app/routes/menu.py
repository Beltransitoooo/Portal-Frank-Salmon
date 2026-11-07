from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/menu", tags=["Menú"])


def _limpio(texto: str) -> str:
    return " ".join(texto.split())


def _sin_repetir(db: Session, nombre: str, seccion: str, excepto: Optional[str] = None):
    """En una misma sección no puede haber dos platillos con el mismo nombre."""
    q = db.query(models.PlatilloMenu).filter(
        func.lower(models.PlatilloMenu.nombre) == nombre.lower(),
        models.PlatilloMenu.seccion == seccion,
    )
    if excepto:
        q = q.filter(models.PlatilloMenu.id != excepto)
    if q.first() is not None:
        raise HTTPException(status_code=409, detail="Ya existe un platillo con ese nombre en la sección")


@router.get("", response_model=List[schemas.MenuOut])
def listar_menu(db: Session = Depends(get_db)):
    return db.query(models.PlatilloMenu).order_by(models.PlatilloMenu.nombre).all()


@router.post("", response_model=schemas.MenuOut, status_code=201)
def crear_platillo(datos: schemas.MenuCreate, db: Session = Depends(get_db)):
    # Si el mismo id ya existe (p. ej. el navegador reintentó), devolvemos el que hay
    if datos.id:
        existente = db.get(models.PlatilloMenu, datos.id)
        if existente is not None:
            return existente

    nombre = _limpio(datos.nombre)
    _sin_repetir(db, nombre, datos.seccion)
    platillo = models.PlatilloMenu(
        nombre=nombre,
        seccion=datos.seccion,
        precio=round(datos.precio, 2),
        descripcion=datos.descripcion.strip(),
        disponible=datos.disponible,
    )
    if datos.id:
        platillo.id = datos.id
    db.add(platillo)
    db.commit()
    db.refresh(platillo)
    return platillo


@router.patch("/{platillo_id}", response_model=schemas.MenuOut)
def actualizar_platillo(platillo_id: str, datos: schemas.MenuUpdate, db: Session = Depends(get_db)):
    platillo = db.get(models.PlatilloMenu, platillo_id)
    if platillo is None:
        raise HTTPException(status_code=404, detail="Platillo no encontrado")

    nombre = _limpio(datos.nombre) if datos.nombre is not None else platillo.nombre
    seccion = datos.seccion if datos.seccion is not None else platillo.seccion
    if datos.nombre is not None or datos.seccion is not None:
        _sin_repetir(db, nombre, seccion, excepto=platillo.id)
    platillo.nombre = nombre
    platillo.seccion = seccion
    if datos.precio is not None:
        platillo.precio = round(datos.precio, 2)
    if datos.descripcion is not None:
        platillo.descripcion = datos.descripcion.strip()
    if datos.disponible is not None:
        platillo.disponible = datos.disponible
    db.commit()
    db.refresh(platillo)
    return platillo


@router.delete("/{platillo_id}", response_model=schemas.ResultadoLimpieza)
def borrar_platillo(platillo_id: str, db: Session = Depends(get_db)):
    """Si ya no existe responde 0 (otro dispositivo lo borró)."""
    platillo = db.get(models.PlatilloMenu, platillo_id)
    if platillo is None:
        return {"borrados": 0}
    db.delete(platillo)
    db.commit()
    return {"borrados": 1}
