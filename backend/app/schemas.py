from pydantic import BaseModel

class ProveedorBase(BaseModel):
    nombre: str
    activo: bool = True

class ProveedorCreate(ProveedorBase):
    pass

class Proveedor(ProveedorBase):
    id: int

    class Config:
        from_attributes = True