import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Column, Date, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


def ahora():
    return datetime.now(timezone.utc)


def nuevo_id():
    return str(uuid.uuid4())


class Proveedor(Base):
    __tablename__ = "proveedores"

    id = Column(String(64), primary_key=True)  # slug legible, p. ej. "aros"
    nombre = Column(String(120), nullable=False)
    categoria = Column(String(120), nullable=False, default="")
    # [{ "nombre": "Camarón", "unidad": "kg" }, ...]
    productos = Column(JSON, nullable=False, default=list)
    # Días de entrega: 0 = domingo ... 6 = sábado
    dias = Column(JSON, nullable=False, default=list)
    hora = Column(String(5), nullable=False, default="")  # "HH:MM"
    activo = Column(Boolean, nullable=False, default=True)

    arribos = relationship("Arribo", back_populates="proveedor")


class Arribo(Base):
    __tablename__ = "arribos"

    id = Column(String(64), primary_key=True, default=nuevo_id)
    proveedor_id = Column(String(64), ForeignKey("proveedores.id"), nullable=False, index=True)
    proveedor_nombre = Column(String(120), nullable=False)
    fecha = Column(Date, nullable=False)  # fecha esperada
    hora = Column(String(5), nullable=False)  # "HH:MM"
    # [{ "producto": "Camarón", "cantidad": 10, "unidad": "kg" }, ...]
    items = Column(JSON, nullable=False, default=list)
    notas = Column(Text, nullable=False, default="")
    estado = Column(String(20), nullable=False, default="pendiente", index=True)  # pendiente | recepcionado
    creado_en = Column(DateTime(timezone=True), nullable=False, default=ahora)
    recepcionado_en = Column(DateTime(timezone=True), nullable=True)

    proveedor = relationship("Proveedor", back_populates="arribos")


class Urgencia(Base):
    __tablename__ = "urgencias"

    id = Column(String(64), primary_key=True, default=nuevo_id)
    producto = Column(String(200), nullable=False)
    cantidad = Column(Float, nullable=False)
    unidad = Column(String(20), nullable=False)
    notas = Column(Text, nullable=False, default="")
    estado = Column(String(20), nullable=False, default="pendiente", index=True)  # pendiente | surtido
    creado_en = Column(DateTime(timezone=True), nullable=False, default=ahora)
    surtido_en = Column(DateTime(timezone=True), nullable=True)


class ProductoInventario(Base):
    __tablename__ = "inventario"

    id = Column(String(64), primary_key=True, default=nuevo_id)
    nombre = Column(String(120), nullable=False)
    categoria = Column(String(120), nullable=False, default="")  # clave de schemas.CATEGORIAS_INVENTARIO
    cantidad = Column(Float, nullable=False, default=0)  # existencia actual
    unidad = Column(String(20), nullable=False)
    actualizado_en = Column(DateTime(timezone=True), nullable=False, default=ahora, onupdate=ahora)


class PlatilloMenu(Base):
    __tablename__ = "menu"

    id = Column(String(64), primary_key=True, default=nuevo_id)
    nombre = Column(String(120), nullable=False)
    seccion = Column(String(40), nullable=False, index=True)  # clave de schemas.SECCIONES_MENU
    precio = Column(Float, nullable=False)  # MXN
    descripcion = Column(Text, nullable=False, default="")
    disponible = Column(Boolean, nullable=False, default=True)
    actualizado_en = Column(DateTime(timezone=True), nullable=False, default=ahora, onupdate=ahora)
