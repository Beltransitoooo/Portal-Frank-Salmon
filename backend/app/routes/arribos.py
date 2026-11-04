from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/arribos", tags=["Arribos"])


def _proveedor_activo(db: Session, proveedor_id: str) -> models.Proveedor:
    proveedor = db.get(models.Proveedor, proveedor_id)
    if proveedor is None or not proveedor.activo:
        raise HTTPException(status_code=422, detail="El proveedor no existe o está inactivo")
    return proveedor


@router.get("", response_model=List[schemas.ArriboOut])
def listar_arribos(db: Session = Depends(get_db)):
    return db.query(models.Arribo).order_by(models.Arribo.creado_en.desc()).all()


@router.post("", response_model=schemas.ArriboOut, status_code=201)
def crear_arribo(datos: schemas.ArriboCreate, db: Session = Depends(get_db)):
    proveedor = _proveedor_activo(db, datos.proveedor_id)

    # Si el mismo id ya existe (p. ej. el navegador reintentó), devolvemos el que hay
    if datos.id:
        existente = db.get(models.Arribo, datos.id)
        if existente is not None:
            return existente

    arribo = models.Arribo(
        proveedor_id=proveedor.id,
        proveedor_nombre=proveedor.nombre,
        fecha=datos.fecha,
        hora=datos.hora,
        items=[i.model_dump() for i in datos.items],
        notas=datos.notas.strip(),
        estado="pendiente",
    )
    if datos.id:
        arribo.id = datos.id
    db.add(arribo)
    db.commit()
    db.refresh(arribo)
    return arribo


@router.patch("/{arribo_id}", response_model=schemas.ArriboOut)
def cambiar_estado(arribo_id: str, datos: schemas.ArriboEstado, db: Session = Depends(get_db)):
    """pendiente -> recepcionado guarda cuándo se recibió; regresar a pendiente lo borra."""
    arribo = db.get(models.Arribo, arribo_id)
    if arribo is None:
        raise HTTPException(status_code=404, detail="Arribo no encontrado")

    if datos.estado != arribo.estado:
        arribo.estado = datos.estado
        arribo.recepcionado_en = models.ahora() if datos.estado == "recepcionado" else None
        db.commit()
        db.refresh(arribo)
    return arribo


@router.post("/importar", response_model=schemas.ResultadoImport)
def importar_arribos(arribos: List[schemas.ArriboImport], db: Session = Depends(get_db)):
    """Sube los arribos que estaban guardados solo en un navegador. Omite los que ya existen
    o cuyo proveedor no está registrado, así que es seguro llamarlo más de una vez."""
    importados = omitidos = 0
    for datos in arribos:
        proveedor = db.get(models.Proveedor, datos.proveedor_id)
        if proveedor is None or db.get(models.Arribo, datos.id) is not None:
            omitidos += 1
            continue
        db.add(
            models.Arribo(
                id=datos.id,
                proveedor_id=proveedor.id,
                proveedor_nombre=proveedor.nombre,
                fecha=datos.fecha,
                hora=datos.hora,
                items=[i.model_dump() for i in datos.items],
                notas=datos.notas.strip(),
                estado=datos.estado,
                creado_en=datos.creado_en or models.ahora(),
                recepcionado_en=(datos.recepcionado_en or models.ahora())
                if datos.estado == "recepcionado"
                else None,
            )
        )
        importados += 1
    db.commit()
    return {"importados": importados, "omitidos": omitidos}
