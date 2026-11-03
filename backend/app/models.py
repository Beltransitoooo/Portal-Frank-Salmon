from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    rol = Column(String, default="usuario") # Puede ser "admin" o "usuario"

class Proveedor(Base):
    __tablename__ = "proveedores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    activo = Column(Boolean, default=True)

    entregas = relationship("Entrega", back_populates="proveedor")

class Entrega(Base):
    __tablename__ = "entregas"

    id = Column(Integer, primary_key=True, index=True)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"))
    estado = Column(String, default="pendiente") # "pendiente" o "recibida"
    # Guardamos los artículos y cantidades en un JSON para mayor flexibilidad
    productos = Column(JSON) 

    proveedor = relationship("Proveedor", back_populates="entregas")