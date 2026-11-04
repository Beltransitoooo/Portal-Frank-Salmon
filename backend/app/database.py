from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from app.config import DATABASE_URL, SERVERLESS

engine_options = {"pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite"):
    # SQLite necesita este ajuste para usarse desde varios hilos (FastAPI los usa)
    engine_options["connect_args"] = {"check_same_thread": False}
elif SERVERLESS:
    engine_options = {"poolclass": NullPool}

engine = create_engine(DATABASE_URL, **engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
