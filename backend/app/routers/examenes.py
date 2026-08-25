import logging
import random
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..gemini import chunk_text, generate_questions_for_chunk
from ..models import Examen, Pregunta, RespuestaExamen, Tema
from ..schemas import (
    ExamenCrear,
    ExamenFinalizadoOut,
    ExamenGuardar,
    ExamenOut,
    HistorialExamen,
    PreguntaExamenOut,
    PreguntaRevisionOut,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["examenes"])


@router.post("/examenes/crear", response_model=ExamenOut)
def crear_examen(config: ExamenCrear, db: Session = Depends(get_db)):
    if not config.tema_ids:
        raise HTTPException(status_code=400, detail="Debes seleccionar al menos un tema.")

    temas = db.query(Tema).filter(Tema.id.in_(config.tema_ids)).all()
    if len(temas) != len(config.tema_ids):
        raise HTTPException(status_code=404, detail="Uno o más temas seleccionados no existen.")

    preguntas_disponibles = db.query(Pregunta).filter(Pregunta.tema_id.in_(config.tema_ids)).all()
    preguntas_necesarias = config.num_preguntas
    forzar = config.forzar_generacion
    preguntas_recien_creadas = []

    if len(preguntas_disponibles) < preguntas_necesarias or forzar:
        if forzar:
            cantidad_a_generar = preguntas_necesarias
            logger.info(f"Forcing generation of {cantidad_a_generar} new questions")
        else:
            preguntas_faltantes = preguntas_necesarias - len(preguntas_disponibles)
            cantidad_a_generar = max(preguntas_faltantes, 5)
            logger.info(f"Generating {cantidad_a_generar} missing questions")

        preguntas_por_tema = max(1, cantidad_a_generar // len(temas))

        for tema in temas:
            chunks = chunk_text(tema.texto_plano)
            if not chunks:
                continue

            chunk_seleccionado = random.choice(chunks)

            try:
                preguntas_nuevas = generate_questions_for_chunk(chunk_seleccionado, preguntas_por_tema)
                for p_data in preguntas_nuevas:
                    if not p_data.get("enunciado") or len(p_data.get("opciones", [])) != 4 or not p_data.get("correcta"):
                        continue

                    nueva_p = Pregunta(
                        tema_id=tema.id,
                        enunciado=p_data["enunciado"],
                        opciones=p_data["opciones"],
                        correcta=p_data["correcta"].strip().upper(),
                        explicacion=p_data.get("explicacion", "No hay justificación disponible.")
                    )
                    db.add(nueva_p)
                    db.flush()
                    preguntas_recien_creadas.append(nueva_p)
                db.commit()
            except Exception as error:
                db.rollback()
                logger.error(f"Error generating questions for topic {tema.titulo}: {error}")

        preguntas_disponibles = db.query(Pregunta).filter(Pregunta.tema_id.in_(config.tema_ids)).all()

        if len(preguntas_disponibles) < 1:
            raise HTTPException(
                status_code=500,
                detail="No hay preguntas en la base de datos y falló la generación automática de preguntas con Gemini."
            )

    if forzar and len(preguntas_recien_creadas) >= preguntas_necesarias:
        preguntas_examen = preguntas_recien_creadas[:preguntas_necesarias]
    elif forzar and len(preguntas_recien_creadas) > 0:
        preguntas_antiguas = [p for p in preguntas_disponibles if p not in preguntas_recien_creadas]
        necesitamos_completar = preguntas_necesarias - len(preguntas_recien_creadas)
        completar_con = random.sample(preguntas_antiguas, min(necesitamos_completar, len(preguntas_antiguas)))
        preguntas_examen = preguntas_recien_creadas + completar_con
    else:
        num_preguntas_final = min(config.num_preguntas, len(preguntas_disponibles))
        preguntas_examen = random.sample(preguntas_disponibles, num_preguntas_final)

    random.shuffle(preguntas_examen)

    duracion_segundos = config.duracion * 60
    nuevo_examen = Examen(
        tiempo_total=duracion_segundos,
        tiempo_restante=duracion_segundos,
        estado="activo",
        penalizacion=config.penalizacion
    )
    db.add(nuevo_examen)
    db.commit()
    db.refresh(nuevo_examen)

    preguntas_out = []
    for pregunta in preguntas_examen:
        respuesta_link = RespuestaExamen(
            examen_id=nuevo_examen.id,
            pregunta_id=pregunta.id,
            respuesta_usuario=None,
            marcada_duda=False
        )
        db.add(respuesta_link)

        preguntas_out.append(PreguntaExamenOut(
            id=pregunta.id,
            enunciado=pregunta.enunciado,
            opciones=pregunta.opciones,
            respuesta_usuario=None,
            marcada_duda=False
        ))
    db.commit()

    return ExamenOut(
        id=nuevo_examen.id,
        fecha=nuevo_examen.fecha.strftime("%Y-%m-%d %H:%M:%S") if nuevo_examen.fecha else "",
        tiempo_total=nuevo_examen.tiempo_total,
        tiempo_restante=nuevo_examen.tiempo_restante,
        estado=nuevo_examen.estado,
        penalizacion=nuevo_examen.penalizacion,
        nota=nuevo_examen.nota,
        aciertos=nuevo_examen.aciertos,
        fallos=nuevo_examen.fallos,
        blancos=nuevo_examen.blancos,
        preguntas=preguntas_out
    )


@router.get("/examenes/{id}", response_model=ExamenOut)
def obtener_examen(id: int, db: Session = Depends(get_db)):
    examen = db.query(Examen).filter(Examen.id == id).first()
    if not examen:
        raise HTTPException(status_code=404, detail="Examen no encontrado.")

    respuestas_vinculos = db.query(RespuestaExamen).filter(RespuestaExamen.examen_id == id).all()

    preguntas_out = []
    for link in respuestas_vinculos:
        pregunta = db.query(Pregunta).filter(Pregunta.id == link.pregunta_id).first()
        if pregunta:
            preguntas_out.append(PreguntaExamenOut(
                id=pregunta.id,
                enunciado=pregunta.enunciado,
                opciones=pregunta.opciones,
                respuesta_usuario=link.respuesta_usuario,
                marcada_duda=link.marcada_duda
            ))

    return ExamenOut(
        id=examen.id,
        fecha=examen.fecha.strftime("%Y-%m-%d %H:%M:%S") if examen.fecha else "",
        tiempo_total=examen.tiempo_total,
        tiempo_restante=examen.tiempo_restante,
        estado=examen.estado,
        penalizacion=examen.penalizacion,
        nota=examen.nota,
        aciertos=examen.aciertos,
        fallos=examen.fallos,
        blancos=examen.blancos,
        preguntas=preguntas_out
    )


@router.post("/examenes/{id}/guardar")
def guardar_progreso_examen(id: int, payload: ExamenGuardar, db: Session = Depends(get_db)):
    examen = db.query(Examen).filter(Examen.id == id).first()
    if not examen:
        raise HTTPException(status_code=404, detail="Examen no encontrado.")

    if examen.estado == "terminado":
        raise HTTPException(status_code=400, detail="No se puede modificar un examen que ya ha sido finalizado.")

    try:
        examen.tiempo_restante = payload.tiempo_restante
        if payload.pausar:
            examen.estado = "pausado"
        else:
            examen.estado = "activo"

        for resp in payload.respuestas:
            db_resp = db.query(RespuestaExamen).filter(
                RespuestaExamen.examen_id == id,
                RespuestaExamen.pregunta_id == resp.pregunta_id
            ).first()

            if db_resp:
                opcion = resp.respuesta_usuario
                if opcion and opcion.upper() in ["A", "B", "C", "D"]:
                    db_resp.respuesta_usuario = opcion.upper()
                else:
                    db_resp.respuesta_usuario = None
                db_resp.marcada_duda = resp.marcada_duda

        db.commit()
        return {"status": "success", "message": "Progreso guardado correctamente."}

    except Exception as error:
        db.rollback()
        logger.error(f"Error saving progress for exam {id}: {error}")
        raise HTTPException(status_code=500, detail=f"Error al guardar progreso: {str(error)}")


@router.post("/examenes/{id}/finalizar", response_model=ExamenFinalizadoOut)
def finalizar_y_corregir_examen(id: int, db: Session = Depends(get_db)):
    examen = db.query(Examen).filter(Examen.id == id).first()
    if not examen:
        raise HTTPException(status_code=404, detail="Examen no encontrado.")

    respuestas_vinculos = db.query(RespuestaExamen).filter(RespuestaExamen.examen_id == id).all()
    num_preguntas = len(respuestas_vinculos)

    if num_preguntas == 0:
        raise HTTPException(status_code=400, detail="Este examen no contiene preguntas.")

    aciertos = 0
    fallos = 0
    blancos = 0

    preguntas_revision = []

    for link in respuestas_vinculos:
        pregunta = db.query(Pregunta).filter(Pregunta.id == link.pregunta_id).first()
        if not pregunta:
            continue

        resp_usuario = link.respuesta_usuario
        resp_correcta = pregunta.correcta

        if not resp_usuario:
            blancos += 1
        elif resp_usuario == resp_correcta:
            aciertos += 1
        else:
            fallos += 1

        preguntas_revision.append(PreguntaRevisionOut(
            id=pregunta.id,
            enunciado=pregunta.enunciado,
            opciones=pregunta.opciones,
            correcta=pregunta.correcta,
            explicacion=pregunta.explicacion,
            respuesta_usuario=link.respuesta_usuario,
            marcada_duda=link.marcada_duda
        ))

    puntos_netos = aciertos - (fallos * abs(examen.penalizacion))
    nota_final = (puntos_netos / num_preguntas) * 10
    nota_final = max(0.0, round(nota_final, 2))

    examen.estado = "terminado"
    examen.aciertos = aciertos
    examen.fallos = fallos
    examen.blancos = blancos
    examen.nota = nota_final

    db.commit()
    db.refresh(examen)

    return ExamenFinalizadoOut(
        id=examen.id,
        tiempo_total=examen.tiempo_total,
        tiempo_restante=examen.tiempo_restante,
        estado=examen.estado,
        penalizacion=examen.penalizacion,
        nota=examen.nota,
        aciertos=examen.aciertos,
        fallos=examen.fallos,
        blancos=examen.blancos,
        preguntas=preguntas_revision
    )


@router.get("/historial", response_model=List[HistorialExamen])
def obtener_historial_examenes(db: Session = Depends(get_db)):
    examenes = db.query(Examen).order_by(Examen.fecha.desc()).all()
    resultado = []

    for ex in examenes:
        tema_nombres = db.query(Tema.titulo).join(Pregunta).join(RespuestaExamen).filter(
            RespuestaExamen.examen_id == ex.id
        ).distinct().all()

        temas_list = [t[0] for t in tema_nombres]
        num_preguntas = db.query(RespuestaExamen).filter(RespuestaExamen.examen_id == ex.id).count()

        resultado.append(HistorialExamen(
            id=ex.id,
            fecha=ex.fecha.strftime("%Y-%m-%d %H:%M:%S") if ex.fecha else "",
            tiempo_total=ex.tiempo_total,
            estado=ex.estado,
            nota=ex.nota,
            aciertos=ex.aciertos,
            fallos=ex.fallos,
            blancos=ex.blancos,
            num_preguntas=num_preguntas,
            temas=temas_list
        ))

    return resultado
