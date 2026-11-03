from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Cambia "tu_contraseña" por la de tu usuario local (normalmente "postgres") 
# Asegúrate de haber creado una base de datos llamada "portal_frank_salmon" en tu gestor (ej. pgAdmin)
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:1977Ambz.@localhost/portal_frank_salmon"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()