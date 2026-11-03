from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import models
from app.database import engine
from app.routes import proveedores, usuarios, entregas

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Portal Frank Salmon", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de rutas
app.include_router(proveedores.router)
app.include_router(usuarios.router)
app.include_router(entregas.router)

@app.get("/")
def root():
    return {"mensaje": "Backend FastAPI operativo", "version": app.version}