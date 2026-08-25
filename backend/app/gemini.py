import json
import logging
import os
import shutil
import subprocess
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

AGY_BIN = (
    os.getenv("AGY_BIN", "").strip()
    or shutil.which("agy")
    or os.path.expanduser("~/.local/bin/agy")
)


class PreguntaEsquema(BaseModel):
    enunciado: str = Field(description="Enunciado de la pregunta.")
    opciones: List[str] = Field(description="Lista con 4 opciones.")
    correcta: str = Field(description="Letra de la respuesta correcta.")
    explicacion: str = Field(description="Justificacion de la respuesta.")


class ExamenGeneradoEsquema(BaseModel):
    preguntas: List[PreguntaEsquema]


def chunk_text(text: str, max_words: int = 3500) -> List[str]:
    paragraphs = text.split("\n")
    chunks = []
    current_chunk = []
    current_word_count = 0

    for paragraph in paragraphs:
        paragraph_words = len(paragraph.split())
        if current_word_count + paragraph_words > max_words and current_chunk:
            chunks.append("\n".join(current_chunk))
            current_chunk = [paragraph]
            current_word_count = paragraph_words
        else:
            current_chunk.append(paragraph)
            current_word_count += paragraph_words

    if current_chunk:
        chunks.append("\n".join(current_chunk))

    return chunks


def _extract_json(output: str) -> str:
    if "```json" in output:
        try:
            start_idx = output.find("```json") + 7
            end_idx = output.find("```", start_idx)
            if end_idx != -1:
                return output[start_idx:end_idx].strip()
        except Exception:
            pass

    start_idx = output.find("{")
    end_idx = output.rfind("}") + 1
    if start_idx != -1 and end_idx > start_idx:
        return output[start_idx:end_idx].strip()

    return output.strip()


def generate_questions_for_chunk(text_chunk: str, num_questions: int) -> List[dict]:
    prompt = f"""Eres un preparador experto de oposiciones. Tu tarea es redactar preguntas de examen de alta calidad, rigurosas y desafiantes basadas estrictamente en la información contenida en el fragmento de tema proporcionado al final.

Requisitos:
1. Genera exactamente {num_questions} preguntas tipo test.
2. Las preguntas deben ser tipo test con 4 opciones (A, B, C, D) donde solo una sea la correcta.
3. Asegúrate de cubrir diferentes conceptos clave.
4. La explicación debe justificar detalladamente por qué la respuesta elegida es correcta.

Devuelve ÚNICAMENTE un objeto JSON que cumpla estrictamente con este formato:
{{
  "preguntas": [
    {{
      "enunciado": "Texto de la pregunta",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correcta": "A",
      "explicacion": "Explicación detallada de la respuesta correcta"
    }}
  ]
}}

No incluyas introducciones ni textos explicativos en tu respuesta fuera del JSON. Devuelve únicamente el bloque de código JSON.

Fragmento de Texto:
\"\"\"
{text_chunk}
\"\"\"
"""

    if not os.path.isfile(AGY_BIN) and not shutil.which(AGY_BIN):
        logger.error(f"Antigravity CLI binary not found at: {AGY_BIN}")
        return []

    try:
        logger.info(f"Running Antigravity CLI ({AGY_BIN}) to generate {num_questions} questions")
        result = subprocess.run(
            [
                AGY_BIN,
                "--print",
                prompt,
                "--dangerously-skip-permissions",
                "--output-format",
                "text",
            ],
            capture_output=True,
            text=True,
            timeout=600,
            cwd=os.path.expanduser("~"),
            env=os.environ.copy(),
        )

        if result.returncode != 0:
            logger.error(f"agy process exited with code {result.returncode}")
            if result.stderr:
                logger.error(f"Stderr: {result.stderr[-2000:]}")
            if result.stdout:
                logger.error(f"Stdout: {result.stdout[-2000:]}")
            return []

        output = (result.stdout or "").strip()
        if not output:
            logger.error("agy returned empty output")
            if result.stderr:
                logger.error(f"Stderr: {result.stderr[-2000:]}")
            return []

        json_content = _extract_json(output)
        data = json.loads(json_content)
        questions = data.get("preguntas", [])
        logger.info(f"Successfully generated {len(questions)} questions")
        return questions

    except subprocess.TimeoutExpired:
        logger.error("agy command timed out after 600s")
        return []
    except json.JSONDecodeError as error:
        logger.error(f"Failed to parse JSON response from agy: {error}")
        return []
    except Exception as error:
        logger.error(f"Unexpected error while running agy: {error}")
        return []
