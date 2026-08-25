import { useEffect, useRef, useState } from 'react';
import { createExamen, fetchExamen, finishExamen, saveExamenProgress } from '../api';

const STORAGE_KEY = 'opotest_examen_activo_id';

export function useExamSession({ vista, setVista, onSessionEnd }) {
  const [examen, setExamen] = useState(null);
  const [preguntaActivaIndex, setPreguntaActivaIndex] = useState(0);
  const [respuestasUsuario, setRespuestasUsuario] = useState({});
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [ultimoGuardado, setUltimoGuardado] = useState(null);
  const [creandoExamen, setCreandoExamen] = useState(false);
  const [cargandoExamenActivo, setCargandoExamenActivo] = useState(false);

  const [resultados, setResultados] = useState(null);
  const [cargandoResultados, setCargandoResultados] = useState(false);

  const timerRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  const initExamState = (examData) => {
    setExamen(examData);
    setTiempoRestante(examData.tiempo_restante);
    setPreguntaActivaIndex(0);
    const initialResponses = {};
    examData.preguntas.forEach((p) => {
      initialResponses[p.id] = {
        opcion: p.respuesta_usuario || null,
        duda: p.marcada_duda || false,
      };
    });
    setRespuestasUsuario(initialResponses);
  };

  const cargarExamenExistente = async (id) => {
    setCargandoExamenActivo(true);
    try {
      const data = await fetchExamen(id);
      if (data.estado === 'terminado') {
        localStorage.removeItem(STORAGE_KEY);
        if (onSessionEnd) onSessionEnd();
      } else {
        initExamState(data);
        setVista('examen-activo');
      }
    } catch (err) {
      localStorage.removeItem(STORAGE_KEY);
      console.error(err);
    } finally {
      setCargandoExamenActivo(false);
    }
  };

  useEffect(() => {
    const pausedExamId = localStorage.getItem(STORAGE_KEY);
    if (pausedExamId) {
      cargarExamenExistente(parseInt(pausedExamId, 10));
    }
  }, []);

  const triggerAutoSave = async (pausar = false) => {
    if (!examen || vista !== 'examen-activo') return;

    const respuestasPayload = Object.keys(respuestasUsuario).map((pId) => ({
      pregunta_id: parseInt(pId, 10),
      respuesta_usuario: respuestasUsuario[pId].opcion,
      marcada_duda: respuestasUsuario[pId].duda,
    }));

    try {
      await saveExamenProgress(examen.id, {
        tiempo_restante: tiempoRestante,
        respuestas: respuestasPayload,
        pausar,
      });
      setUltimoGuardado(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoSubmit = async () => {
    clearInterval(timerRef.current);
    clearInterval(autoSaveTimerRef.current);

    setVista('resultados');
    setCargandoResultados(true);

    try {
      const respuestasPayload = Object.keys(respuestasUsuario).map((pId) => ({
        pregunta_id: parseInt(pId, 10),
        respuesta_usuario: respuestasUsuario[pId].opcion,
        marcada_duda: respuestasUsuario[pId].duda,
      }));

      await saveExamenProgress(examen.id, {
        tiempo_restante: 0,
        respuestas: respuestasPayload,
        pausar: false,
      });

      const data = await finishExamen(examen.id);
      setResultados(data);
      localStorage.removeItem(STORAGE_KEY);
      if (onSessionEnd) onSessionEnd();
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoResultados(false);
    }
  };

  useEffect(() => {
    if (vista === 'examen-activo' && examen && examen.estado === 'activo') {
      timerRef.current = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      autoSaveTimerRef.current = setInterval(() => {
        triggerAutoSave();
      }, 10000);
    } else {
      clearInterval(timerRef.current);
      clearInterval(autoSaveTimerRef.current);
    }

    return () => {
      clearInterval(timerRef.current);
      clearInterval(autoSaveTimerRef.current);
    };
  }, [vista, examen, respuestasUsuario, tiempoRestante]);

  const iniciarExamen = async (configPayload) => {
    setCreandoExamen(true);
    try {
      const data = await createExamen(configPayload);
      initExamState(data);
      localStorage.setItem(STORAGE_KEY, data.id);
      setVista('examen-activo');
    } catch (err) {
      alert(err.message || 'Error al crear el examen.');
    } finally {
      setCreandoExamen(false);
    }
  };

  const responderPregunta = (preguntaId, opcionLetra) => {
    setRespuestasUsuario((prev) => {
      const updated = {
        ...prev,
        [preguntaId]: {
          ...prev[preguntaId],
          opcion: prev[preguntaId]?.opcion === opcionLetra ? null : opcionLetra,
        },
      };
      setTimeout(() => triggerAutoSave(), 100);
      return updated;
    });
  };

  const toggleDudaPregunta = (preguntaId) => {
    setRespuestasUsuario((prev) => {
      const updated = {
        ...prev,
        [preguntaId]: {
          ...prev[preguntaId],
          duda: !prev[preguntaId]?.duda,
        },
      };
      setTimeout(() => triggerAutoSave(), 100);
      return updated;
    });
  };

  const pausarYSalir = async () => {
    await triggerAutoSave(true);
    clearInterval(timerRef.current);
    clearInterval(autoSaveTimerRef.current);
    localStorage.removeItem(STORAGE_KEY);
    setExamen(null);
    if (onSessionEnd) onSessionEnd();
    setVista('dashboard');
  };

  const entregarExamen = async () => {
    if (
      !confirm(
        '¿Estás seguro de que deseas finalizar y corregir el examen? No podrás cambiar las respuestas después.'
      )
    ) {
      return;
    }

    await triggerAutoSave(false);
    clearInterval(timerRef.current);
    clearInterval(autoSaveTimerRef.current);

    setCargandoResultados(true);
    setVista('resultados');

    try {
      const data = await finishExamen(examen.id);
      setResultados(data);
      localStorage.removeItem(STORAGE_KEY);
      if (onSessionEnd) onSessionEnd();
    } catch (err) {
      alert('Error al corregir el examen.');
      setVista('examen-activo');
    } finally {
      setCargandoResultados(false);
    }
  };

  const verExamenCorregido = async (examenId) => {
    setCargandoResultados(true);
    setVista('resultados');
    try {
      const data = await finishExamen(examenId);
      setResultados(data);
    } catch (err) {
      console.error(err);
      setVista('historial');
    } finally {
      setCargandoResultados(false);
    }
  };

  return {
    examen,
    preguntaActivaIndex,
    setPreguntaActivaIndex,
    respuestasUsuario,
    tiempoRestante,
    ultimoGuardado,
    creandoExamen,
    cargandoExamenActivo,
    resultados,
    cargandoResultados,
    iniciarExamen,
    cargarExamenExistente,
    responderPregunta,
    toggleDudaPregunta,
    pausarYSalir,
    entregarExamen,
    verExamenCorregido,
  };
}
