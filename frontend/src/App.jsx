import React, { useEffect, useState } from 'react';
import { deleteTema, fetchHistorial, fetchTemas, uploadTemaPDF } from './api';
import ActiveExamView from './components/ActiveExamView';
import DashboardView from './components/DashboardView';
import ExamConfigView from './components/ExamConfigView';
import HistoryView from './components/HistoryView';
import Navbar from './components/Navbar';
import ResultsView from './components/ResultsView';
import { useExamSession } from './hooks/useExamSession';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const [vista, setVista] = useState('dashboard');
  const [temas, setTemas] = useState([]);
  const [cargandoTemas, setCargandoTemas] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const [temasSeleccionados, setTemasSeleccionados] = useState([]);
  const [numPreguntas, setNumPreguntas] = useState(10);
  const [duracionMinutos, setDuracionMinutos] = useState(15);
  const [penalizacion, setPenalizacion] = useState(0.33);
  const [forzarGeneracion, setForzarGeneracion] = useState(false);

  const { temaOscuro, toggleTheme } = useTheme();

  const loadTemas = async () => {
    setCargandoTemas(true);
    try {
      const data = await fetchTemas();
      setTemas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoTemas(false);
    }
  };

  const loadHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const data = await fetchHistorial();
      setHistorial(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const examSession = useExamSession({
    vista,
    setVista,
    onSessionEnd: () => {
      loadHistorial();
      loadTemas();
    },
  });

  useEffect(() => {
    loadTemas();
    loadHistorial();
  }, []);

  const handleSubirPDF = async (file, title) => {
    await uploadTemaPDF(file, title);
    loadTemas();
  };

  const handleEliminarTema = async (id, title) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar el tema "${title}"? Se borrarán todas sus preguntas de examen asociadas.`
      )
    ) {
      return;
    }
    await deleteTema(id);
    loadTemas();
  };

  const handleIniciarExamen = async () => {
    if (temasSeleccionados.length === 0) {
      alert('Debes seleccionar al menos un tema para el examen.');
      return;
    }
    await examSession.iniciarExamen({
      tema_ids: temasSeleccionados,
      num_preguntas: numPreguntas,
      duracion: duracionMinutos,
      penalizacion: parseFloat(penalizacion),
      forzar_generacion: forzarGeneracion,
    });
  };

  const handleLogoClick = () => {
    if (
      vista !== 'examen-activo' ||
      confirm('¿Deseas salir del examen activo? Se guardará tu progreso.')
    ) {
      if (vista === 'examen-activo') examSession.pausarYSalir();
      else setVista('dashboard');
    }
  };

  return (
    <div className="app-container">
      <Navbar
        vista={vista}
        onNavigate={(v) => {
          if (v === 'historial') loadHistorial();
          setVista(v);
        }}
        temaOscuro={temaOscuro}
        onToggleTheme={toggleTheme}
        onLogoClick={handleLogoClick}
      />

      <main className="main-content">
        {examSession.cargandoExamenActivo ? (
          <div style={{ textAlign: 'center', padding: '100px' }}>
            Reanudando examen guardado...
          </div>
        ) : (
          <>
            {vista === 'dashboard' && (
              <DashboardView
                temas={temas}
                cargandoTemas={cargandoTemas}
                onSubirPDF={handleSubirPDF}
                onEliminarTema={handleEliminarTema}
                onConfigurarNuevoExamen={() => {
                  setTemasSeleccionados(temas.map((t) => t.id));
                  setVista('config-examen');
                }}
                onIniciarTestTema={(temaId) => {
                  setTemasSeleccionados([temaId]);
                  setVista('config-examen');
                }}
              />
            )}

            {vista === 'config-examen' && (
              <ExamConfigView
                temas={temas}
                temasSeleccionados={temasSeleccionados}
                setTemasSeleccionados={setTemasSeleccionados}
                numPreguntas={numPreguntas}
                setNumPreguntas={setNumPreguntas}
                duracionMinutos={duracionMinutos}
                setDuracionMinutos={setDuracionMinutos}
                penalizacion={penalizacion}
                setPenalizacion={setPenalizacion}
                forzarGeneracion={forzarGeneracion}
                setForzarGeneracion={setForzarGeneracion}
                creandoExamen={examSession.creandoExamen}
                onIniciarExamen={handleIniciarExamen}
                onAtras={() => setVista('dashboard')}
              />
            )}

            {vista === 'examen-activo' && (
              <ActiveExamView
                examen={examSession.examen}
                preguntaActivaIndex={examSession.preguntaActivaIndex}
                setPreguntaActivaIndex={examSession.setPreguntaActivaIndex}
                respuestasUsuario={examSession.respuestasUsuario}
                onResponderPregunta={examSession.responderPregunta}
                onToggleDudaPregunta={examSession.toggleDudaPregunta}
                tiempoRestante={examSession.tiempoRestante}
                ultimoGuardado={examSession.ultimoGuardado}
                onPausarYSalir={examSession.pausarYSalir}
                onEntregarExamen={examSession.entregarExamen}
              />
            )}

            {vista === 'resultados' && (
              <ResultsView
                resultados={examSession.resultados}
                cargandoResultados={examSession.cargandoResultados}
                onVolver={() => setVista('dashboard')}
              />
            )}

            {vista === 'historial' && (
              <HistoryView
                historial={historial}
                cargandoHistorial={cargandoHistorial}
                onReanudarExamen={examSession.cargarExamenExistente}
                onVerResultados={examSession.verExamenCorregido}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
