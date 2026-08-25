from typing import List, Optional
from pydantic import BaseModel


class TemaOut(BaseModel):
    id: int
    titulo: str
    fecha_creacion: str
    num_preguntas: int

    class Config:
        from_attributes = True


class ExamenCrear(BaseModel):
    tema_ids: List[int]
    num_preguntas: int
    duracion: int
    penalizacion: float
    forzar_generacion: bool = False


class PreguntaExamenOut(BaseModel):
    id: int
    enunciado: str
    opciones: List[str]
    respuesta_usuario: Optional[str] = None
    marcada_duda: bool = False


class ExamenOut(BaseModel):
    id: int
    fecha: str
    tiempo_total: int
    tiempo_restante: int
    estado: str
    penalizacion: float
    nota: Optional[float] = None
    aciertos: int
    fallos: int
    blancos: int
    preguntas: List[PreguntaExamenOut] = []


class RespuestaGuardar(BaseModel):
    pregunta_id: int
    respuesta_usuario: Optional[str] = None
    marcada_duda: bool = False


class ExamenGuardar(BaseModel):
    tiempo_restante: int
    respuestas: List[RespuestaGuardar]
    pausar: bool = False


class PreguntaRevisionOut(BaseModel):
    id: int
    enunciado: str
    opciones: List[str]
    correcta: str
    explicacion: Optional[str] = None
    respuesta_usuario: Optional[str] = None
    marcada_duda: bool = False


class ExamenFinalizadoOut(BaseModel):
    id: int
    tiempo_total: int
    tiempo_restante: int
    estado: str
    penalizacion: float
    nota: float
    aciertos: int
    fallos: int
    blancos: int
    preguntas: List[PreguntaRevisionOut]


class HistorialExamen(BaseModel):
    id: int
    fecha: str
    tiempo_total: int
    estado: str
    nota: Optional[float] = None
    aciertos: int
    fallos: int
    blancos: int
    num_preguntas: int
    temas: List[str]
