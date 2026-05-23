from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Single shared declarative base for all SQLAlchemy models.
    All models import from here — never create a second Base.
    """
    pass