from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db


router = APIRouter(prefix="/entregas", tags=["Entregas"])

@router.get("/")
def listar_entregas(db: Session = Depends(get_db)):
    return db.query(models.Entrega).all()