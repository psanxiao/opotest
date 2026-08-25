from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Tema(Base):
    __tablename__ = "temas"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, unique=True, index=True, nullable=False)
    texto_plano = Column(Text, nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    preguntas = relationship("Pregunta", back_populates="tema", cascade="all, delete-orphan")


class Pregunta(Base):
    __tablename__ = "preguntas"

    id = Column(Integer, primary_key=True, index=True)
    tema_id = Column(Integer, ForeignKey("temas.id", ondelete="CASCADE"), nullable=False)
    enunciado = Column(Text, nullable=False)
    opciones = Column(JSON, nullable=False)
    correcta = Column(String(5), nullable=False)
    explicacion = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    tema = relationship("Tema", back_populates="preguntas")
    respuestas_examen = relationship("RespuestaExamen", back_populates="pregunta", cascade="all, delete-orphan")


class Examen(Base):
    __tablename__ = "examenes"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    tiempo_total = Column(Integer, nullable=False)
    tiempo_restante = Column(Integer, nullable=False)
    estado = Column(String(20), default="activo")
    penalizacion = Column(Float, default=0.0)

    nota = Column(Float, nullable=True)
    aciertos = Column(Integer, default=0)
    fallos = Column(Integer, default=0)
    blancos = Column(Integer, default=0)

    respuestas = relationship("RespuestaExamen", back_populates="examen", cascade="all, delete-orphan")


class RespuestaExamen(Base):
    __tablename__ = "respuestas_examen"

    id = Column(Integer, primary_key=True, index=True)
    examen_id = Column(Integer, ForeignKey("examenes.id", ondelete="CASCADE"), nullable=False)
    pregunta_id = Column(Integer, ForeignKey("preguntas.id", ondelete="CASCADE"), nullable=False)
    respuesta_usuario = Column(String(5), nullable=True)
    marcada_duda = Column(Boolean, default=False)

    examen = relationship("Examen", back_populates="respuestas")
    pregunta = relationship("Pregunta", back_populates="respuestas_examen")
