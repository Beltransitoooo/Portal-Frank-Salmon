from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])


@router.get("", response_model=List[schemas.ProveedorOut])
def listar_proveedores(db: Session = Depends(get_db)):
    return (
        db.query(models.Proveedor)
        .filter(models.Proveedor.activo.is_(True))
        .order_by(models.Proveedor.nombre)
        .all()
    )


@router.get("/{proveedor_id}", response_model=schemas.ProveedorOut)
def obtener_proveedor(proveedor_id: str, db: Session = Depends(get_db)):
    proveedor = db.get(models.Proveedor, proveedor_id)
    if proveedor is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return proveedor
