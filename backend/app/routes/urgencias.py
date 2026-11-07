from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/urgencias", tags=["Urgencias"])


@router.get("", response_model=List[schemas.UrgenciaOut])
def listar_urgencias(db: Session = Depends(get_db)):
    return db.query(models.Urgencia).order_by(models.Urgencia.creado_en.desc()).all()


@router.post("", response_model=schemas.UrgenciaOut, status_code=201)
def crear_urgencia(datos: schemas.UrgenciaCreate, db: Session = Depends(get_db)):
    # Si el mismo id ya existe (p. ej. el navegador reintentó), devolvemos la que hay
    if datos.id:
        existente = db.get(models.Urgencia, datos.id)
        if existente is not None:
            return existente

    urgencia = models.Urgencia(
        producto=datos.producto.strip(),
        cantidad=datos.cantidad,
        unidad=datos.unidad,
        notas=datos.notas.strip(),
        estado="pendiente",
    )
    if datos.id:
        urgencia.id = datos.id
    db.add(urgencia)
    db.commit()
    db.refresh(urgencia)
    return urgencia


@router.patch("/{urgencia_id}", response_model=schemas.UrgenciaOut)
def cambiar_estado(urgencia_id: str, datos: schemas.UrgenciaEstado, db: Session = Depends(get_db)):
    """Al pasar a «surtido» guarda cuándo; al regresar a pendiente lo borra."""
    urgencia = db.get(models.Urgencia, urgencia_id)
    if urgencia is None:
        raise HTTPException(status_code=404, detail="Urgencia no encontrada")

    if datos.estado != urgencia.estado:
        urgencia.estado = datos.estado
        urgencia.surtido_en = models.ahora() if datos.estado == "surtido" else None
        db.commit()
        db.refresh(urgencia)
    return urgencia


@router.delete("/{urgencia_id}", response_model=schemas.ResultadoLimpieza)
def borrar_urgencia(urgencia_id: str, db: Session = Depends(get_db)):
    """Borra una urgencia pendiente capturada por error. Si ya no existe responde 0
    (otro dispositivo la borró); las surtidas no se borran una por una."""
    urgencia = db.get(models.Urgencia, urgencia_id)
    if urgencia is None:
        return {"borrados": 0}
    if urgencia.estado != "pendiente":
        raise HTTPException(status_code=409, detail="Solo se pueden borrar urgencias pendientes")
    db.delete(urgencia)
    db.commit()
    return {"borrados": 1}


@router.post("/importar", response_model=schemas.ResultadoImport)
def importar_urgencias(urgencias: List[schemas.UrgenciaImport], db: Session = Depends(get_db)):
    """Sube las urgencias que estaban guardadas solo en un navegador. Omite las que ya
    existen, así que es seguro llamarlo más de una vez."""
    importados = omitidos = 0
    for datos in urgencias:
        if db.get(models.Urgencia, datos.id) is not None:
            omitidos += 1
            continue
        db.add(
            models.Urgencia(
                id=datos.id,
                producto=datos.producto.strip(),
                cantidad=datos.cantidad,
                unidad=datos.unidad,
                notas=datos.notas.strip(),
                estado=datos.estado,
                creado_en=datos.creado_en or models.ahora(),
                surtido_en=(datos.surtido_en or models.ahora()) if datos.estado == "surtido" else None,
            )
        )
        importados += 1
    db.commit()
    return {"importados": importados, "omitidos": omitidos}


@router.post("/limpiar-surtidos", response_model=schemas.ResultadoLimpieza)
def limpiar_surtidos(datos: schemas.LimpiarSurtidos, db: Session = Depends(get_db)):
    """Borra definitivamente las urgencias surtidas indicadas. Las pendientes nunca se
    tocan, aunque su id venga en la lista."""
    if not datos.ids:
        return {"borrados": 0}
    borrados = (
        db.query(models.Urgencia)
        .filter(models.Urgencia.id.in_(datos.ids), models.Urgencia.estado == "surtido")
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"borrados": borrados}
