from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])

@router.post("/", response_model=schemas.Proveedor)
def crear_proveedor(proveedor: schemas.ProveedorCreate, db: Session = Depends(get_db)):
    nuevo_proveedor = models.Proveedor(nombre=proveedor.nombre, activo=proveedor.activo)
    db.add(nuevo_proveedor)
    db.commit()
    db.refresh(nuevo_proveedor)
    return nuevo_proveedor

@router.get("/activos/", response_model=list[schemas.Proveedor])
def obtener_proveedores_activos(db: Session = Depends(get_db)):
    return db.query(models.Proveedor).filter(models.Proveedor.activo == True).all()