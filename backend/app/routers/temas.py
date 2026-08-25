import io
import logging
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pypdf import PdfReader
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Pregunta, Tema
from ..schemas import TemaOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/temas", tags=["temas"])


@router.post("", response_model=TemaOut)
async def subir_tema(
    file: UploadFile = File(...),
    titulo: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF.")

    if not titulo:
        titulo = os.path.splitext(file.filename)[0]

    tema_existente = db.query(Tema).filter(Tema.titulo == titulo).first()
    if tema_existente:
        raise HTTPException(status_code=400, detail=f"Ya existe un tema con el título '{titulo}'. Elige otro nombre.")

    try:
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        reader = PdfReader(pdf_file)

        texto_plano = ""
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                texto_plano += f"\n--- Página {page_num + 1} ---\n{text}"

        if not texto_plano.strip():
            raise HTTPException(status_code=400, detail="No se pudo extraer texto del PDF. ¿Está escaneado como imagen?")

        nuevo_tema = Tema(titulo=titulo, texto_plano=texto_plano)
        db.add(nuevo_tema)
        db.commit()
        db.refresh(nuevo_tema)

        return TemaOut(
            id=nuevo_tema.id,
            titulo=nuevo_tema.titulo,
            fecha_creacion=nuevo_tema.fecha_creacion.strftime("%Y-%m-%d %H:%M:%S"),
            num_preguntas=0
        )

    except Exception as error:
        db.rollback()
        logger.error(f"Error processing PDF {file.filename}: {error}")
        raise HTTPException(status_code=500, detail=f"Error interno al procesar el PDF: {str(error)}")


@router.get("", response_model=List[TemaOut])
def listar_temas(db: Session = Depends(get_db)):
    temas = db.query(Tema).all()
    resultado = []
    for t in temas:
        num_preguntas = db.query(Pregunta).filter(Pregunta.tema_id == t.id).count()
        resultado.append(TemaOut(
            id=t.id,
            titulo=t.titulo,
            fecha_creacion=t.fecha_creacion.strftime("%Y-%m-%d %H:%M:%S") if t.fecha_creacion else "",
            num_preguntas=num_preguntas
        ))
    return resultado


@router.delete("/{id}")
def eliminar_tema(id: int, db: Session = Depends(get_db)):
    tema = db.query(Tema).filter(Tema.id == id).first()
    if not tema:
        raise HTTPException(status_code=404, detail="Tema no encontrado")

    try:
        db.delete(tema)
        db.commit()
        return {"status": "success", "message": f"Tema '{tema.titulo}' eliminado con éxito."}
    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar tema: {str(error)}")
