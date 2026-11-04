"""Esquemas de entrada y salida de la API.

El JSON usa camelCase (proveedorId, creadoEn...) para coincidir con el frontend;
en Python los campos van en snake_case.
"""
from datetime import date, datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer
from pydantic.alias_generators import to_camel

HORA = r"^([01]\d|2[0-3]):[0-5]\d$"
ID = r"^[A-Za-z0-9_.-]{1,64}$"  # UUID, o el id de respaldo que generaba el navegador ("u1730…0.123")


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


def iso_utc(valor: Optional[datetime]) -> Optional[str]:
    """Fecha y hora en el mismo formato que Date.toISOString(): 2026-11-03T18:20:00.000Z"""
    if valor is None:
        return None
    if valor.tzinfo is None:  # SQLite no guarda zona horaria; todo se guarda en UTC
        valor = valor.replace(tzinfo=timezone.utc)
    return valor.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


# ---------- Proveedores ----------

class ProductoProveedor(CamelModel):
    nombre: str = Field(min_length=1, max_length=200)
    unidad: str = Field(min_length=1, max_length=20)


class ProveedorOut(CamelModel):
    id: str
    nombre: str
    categoria: str
    productos: List[ProductoProveedor]
    dias: List[int]
    hora: str
    activo: bool


# ---------- Arribos ----------

class ItemArribo(CamelModel):
    producto: str = Field(min_length=1, max_length=200)
    cantidad: float = Field(gt=0)
    unidad: str = Field(min_length=1, max_length=20)


class ArriboCreate(CamelModel):
    # El frontend puede mandar su propio id para mostrar el arribo antes de que responda el servidor
    id: Optional[str] = Field(default=None, pattern=ID)
    proveedor_id: str = Field(min_length=1, max_length=64)
    fecha: date
    hora: str = Field(pattern=HORA)
    items: List[ItemArribo] = Field(min_length=1)
    notas: str = Field(default="", max_length=2000)


class ArriboEstado(CamelModel):
    estado: Literal["pendiente", "recepcionado"]


class ArriboImport(ArriboCreate):
    """Arribo completo guardado antes en el navegador (localStorage), para subirlo una sola vez."""
    id: str = Field(pattern=ID)
    estado: Literal["pendiente", "recepcionado"] = "pendiente"
    creado_en: Optional[datetime] = None
    recepcionado_en: Optional[datetime] = None


class ArriboOut(CamelModel):
    id: str
    proveedor_id: str
    proveedor_nombre: str
    fecha: date
    hora: str
    items: List[ItemArribo]
    notas: str
    estado: str
    creado_en: datetime
    recepcionado_en: Optional[datetime] = None

    @field_serializer("creado_en", "recepcionado_en")
    def _fechas(self, valor):
        return iso_utc(valor)


# ---------- Urgencias ----------

class UrgenciaCreate(CamelModel):
    id: Optional[str] = Field(default=None, pattern=ID)
    producto: str = Field(min_length=1, max_length=200)
    cantidad: float = Field(gt=0)
    unidad: str = Field(min_length=1, max_length=20)
    notas: str = Field(default="", max_length=2000)


class UrgenciaEstado(CamelModel):
    estado: Literal["pendiente", "surtido"]


class UrgenciaImport(UrgenciaCreate):
    id: str = Field(pattern=ID)
    estado: Literal["pendiente", "surtido"] = "pendiente"
    creado_en: Optional[datetime] = None
    surtido_en: Optional[datetime] = None


class UrgenciaOut(CamelModel):
    id: str
    producto: str
    cantidad: float
    unidad: str
    notas: str
    estado: str
    creado_en: datetime
    surtido_en: Optional[datetime] = None

    @field_serializer("creado_en", "surtido_en")
    def _fechas(self, valor):
        return iso_utc(valor)


class ResultadoImport(BaseModel):
    importados: int
    omitidos: int
