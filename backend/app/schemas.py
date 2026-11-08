"""Esquemas de entrada y salida de la API.

El JSON usa camelCase (proveedorId, creadoEn...) para coincidir con el frontend;
en Python los campos van en snake_case.
"""
from datetime import date, datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator
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


class ProveedorCreate(CamelModel):
    nombre: str = Field(min_length=1, max_length=120)
    categoria: str = Field(default="", max_length=120)
    productos: List[ProductoProveedor] = Field(min_length=1)
    dias: List[int] = Field(min_length=1)  # 0 = domingo ... 6 = sábado
    hora: str = Field(pattern=HORA)

    @field_validator("dias")
    @classmethod
    def _dias_validos(cls, dias):
        if any(d < 0 or d > 6 for d in dias):
            raise ValueError("Los días van de 0 (domingo) a 6 (sábado)")
        return sorted(set(dias))


class ProveedorActivo(CamelModel):
    activo: bool


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


class LimpiarSurtidos(BaseModel):
    """Ids de las urgencias surtidas que se ven en pantalla; solo se borran esas, así
    no se pierde una que otro dispositivo acaba de marcar como surtida."""
    ids: List[str] = Field(max_length=1000)


class ResultadoLimpieza(BaseModel):
    borrados: int


class LimpiarRecepcionados(BaseModel):
    """Ids de los arribos recepcionados que se ven en pantalla; solo se borran esos."""
    ids: List[str] = Field(max_length=1000)


# ---------- Inventario ----------

# Categorías fijas del inventario, en el orden en que se muestran (la misma lista vive en el frontend).
# Los productos capturados antes con otra categoría la conservan hasta que se editen.
CATEGORIAS_INVENTARIO = ("mariscos", "cerveza", "coca-cola", "abarrote", "plasticos", "quimicos")
CategoriaInventario = Literal[CATEGORIAS_INVENTARIO]


class InventarioCreate(CamelModel):
    id: Optional[str] = Field(default=None, pattern=ID)
    nombre: str = Field(min_length=1, max_length=120)
    categoria: CategoriaInventario
    cantidad: float = Field(ge=0)
    unidad: str = Field(min_length=1, max_length=20)


class InventarioUpdate(CamelModel):
    """Solo se cambian los campos que se envían."""
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=120)
    categoria: Optional[CategoriaInventario] = None
    cantidad: Optional[float] = Field(default=None, ge=0)
    unidad: Optional[str] = Field(default=None, min_length=1, max_length=20)


class InventarioOut(CamelModel):
    id: str
    nombre: str
    categoria: str
    cantidad: float
    unidad: str
    actualizado_en: datetime

    @field_serializer("actualizado_en")
    def _fecha(self, valor):
        return iso_utc(valor)


# ---------- Menú ----------

# Secciones fijas del menú, en el orden en que se muestran (la misma lista vive en el frontend)
SECCIONES_MENU = (
    "para-comenzar", "tostadas", "tacos", "sushis", "aguachiles", "ceviches", "cocteles",
    "filetes", "antojos-de-mar", "camarones", "salmones", "ensaladas", "pastas", "sopas",
    "frankids", "postres", "res", "hamburguesas", "mixologia", "mokteles", "bebidas",
    "cerveza", "bar",
)
SeccionMenu = Literal[SECCIONES_MENU]


class MenuCreate(CamelModel):
    id: Optional[str] = Field(default=None, pattern=ID)
    nombre: str = Field(min_length=1, max_length=120)
    seccion: SeccionMenu
    precio: float = Field(ge=0, le=1_000_000)
    descripcion: str = Field(default="", max_length=500)
    disponible: bool = True


class MenuUpdate(CamelModel):
    """Solo se cambian los campos que se envían."""
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=120)
    seccion: Optional[SeccionMenu] = None
    precio: Optional[float] = Field(default=None, ge=0, le=1_000_000)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    disponible: Optional[bool] = None


class MenuOut(CamelModel):
    id: str
    nombre: str
    seccion: str
    precio: float
    descripcion: str
    disponible: bool
    actualizado_en: datetime

    @field_serializer("actualizado_en")
    def _fecha(self, valor):
        return iso_utc(valor)


# ---------- Colaboradores ----------

# Áreas fijas, en el orden en que se muestran (la misma lista vive en el frontend)
AREAS_COLABORADORES = (
    "barra-fria", "barra-caliente", "barra-bebidas", "caja", "meseros", "gerentes", "duenos",
)
AreaColaborador = Literal[AREAS_COLABORADORES]
TurnoColaborador = Literal["", "matutino", "vespertino", "completo"]


class ColaboradorCreate(CamelModel):
    id: Optional[str] = Field(default=None, pattern=ID)
    nombre: str = Field(min_length=1, max_length=120)
    area: AreaColaborador
    puesto: str = Field(default="", max_length=80)
    turno: TurnoColaborador = ""
    fecha_ingreso: Optional[date] = None
    activo: bool = True


class ColaboradorUpdate(CamelModel):
    """Solo se cambian los campos que se envían (fechaIngreso: null la borra)."""
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=120)
    area: Optional[AreaColaborador] = None
    puesto: Optional[str] = Field(default=None, max_length=80)
    turno: Optional[TurnoColaborador] = None
    fecha_ingreso: Optional[date] = None
    activo: Optional[bool] = None


class ColaboradorOut(CamelModel):
    id: str
    nombre: str
    area: str
    puesto: str
    turno: str
    fecha_ingreso: Optional[date] = None
    activo: bool
    actualizado_en: datetime

    @field_serializer("actualizado_en")
    def _fecha(self, valor):
        return iso_utc(valor)


# ---------- Inicio de sesión ----------

class LoginIn(BaseModel):
    usuario: str = Field(min_length=1, max_length=40)
    password: str = Field(min_length=1, max_length=200)


class CambiarPasswordIn(CamelModel):
    actual: str = Field(min_length=1, max_length=200)
    nueva: str = Field(min_length=8, max_length=200)


class UsuarioOut(CamelModel):
    id: str
    usuario: str
    nombre: str
    rol: str
    debe_cambiar_password: bool
    ultimo_acceso: Optional[datetime] = None
    creado_en: datetime

    @field_serializer("ultimo_acceso", "creado_en")
    def _fechas(self, valor):
        return iso_utc(valor)


class SesionOut(CamelModel):
    token: str
    usuario: UsuarioOut
