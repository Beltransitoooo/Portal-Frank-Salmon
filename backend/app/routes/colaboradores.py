from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/colaboradores", tags=["Colaboradores"])


def _limpio(texto: str) -> str:
    return " ".join(texto.split())


@router.get("", response_model=List[schemas.ColaboradorOut])
def listar_colaboradores(db: Session = Depends(get_db)):
    return db.query(models.Colaborador).order_by(models.Colaborador.nombre).all()


@router.post("", response_model=schemas.ColaboradorOut, status_code=201)
def crear_colaborador(datos: schemas.ColaboradorCreate, db: Session = Depends(get_db)):
    # Si el mismo id ya existe (p. ej. el navegador reintentó), devolvemos el que hay
    if datos.id:
        existente = db.get(models.Colaborador, datos.id)
        if existente is not None:
            return existente

    colaborador = models.Colaborador(
        nombre=_limpio(datos.nombre),
        area=datos.area,
        puesto=_limpio(datos.puesto),
        turno=datos.turno,
        fecha_ingreso=datos.fecha_ingreso,
        activo=datos.activo,
    )
    if datos.id:
        colaborador.id = datos.id
    db.add(colaborador)
    db.commit()
    db.refresh(colaborador)
    return colaborador


@router.patch("/{colaborador_id}", response_model=schemas.ColaboradorOut)
def actualizar_colaborador(colaborador_id: str, datos: schemas.ColaboradorUpdate, db: Session = Depends(get_db)):
    colaborador = db.get(models.Colaborador, colaborador_id)
    if colaborador is None:
        raise HTTPException(status_code=404, detail="Colaborador no encontrado")

    enviados = datos.model_fields_set
    if datos.nombre is not None:
        colaborador.nombre = _limpio(datos.nombre)
    if datos.area is not None:
        colaborador.area = datos.area
    if datos.puesto is not None:
        colaborador.puesto = _limpio(datos.puesto)
    if datos.turno is not None:
        colaborador.turno = datos.turno
    if "fecha_ingreso" in enviados:  # null la borra
        colaborador.fecha_ingreso = datos.fecha_ingreso
    if datos.activo is not None:
        colaborador.activo = datos.activo
    db.commit()
    db.refresh(colaborador)
    return colaborador


@router.delete("/{colaborador_id}", response_model=schemas.ResultadoLimpieza)
def borrar_colaborador(colaborador_id: str, db: Session = Depends(get_db)):
    """Para registros capturados por error; a quien deja de trabajar se le da de baja.
    Si ya no existe responde 0 (otro dispositivo lo borró)."""
    colaborador = db.get(models.Colaborador, colaborador_id)
    if colaborador is None:
        return {"borrados": 0}
    db.delete(colaborador)
    db.commit()
    return {"borrados": 1}
