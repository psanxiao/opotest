import React, { useState } from 'react';

function formatTiempo(segundos) {
  const mins = Math.floor(segundos / 60);
  const secs = segundos % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ActiveExamView({
  examen,
  preguntaActivaIndex,
  setPreguntaActivaIndex,
  respuestasUsuario,
  onResponderPregunta,
  onToggleDudaPregunta,
  tiempoRestante,
  ultimoGuardado,
  onPausarYSalir,
  onEntregarExamen,
}) {
  const [mostrarModalPreguntasMovil, setMostrarModalPreguntasMovil] = useState(false);

  if (!examen) return null;
  const pregunta = examen.preguntas[preguntaActivaIndex];
  if (!pregunta) return null;

  const respuestaActual = respuestasUsuario[pregunta.id]?.opcion;
  const esDuda = respuestasUsuario[pregunta.id]?.duda || false;
  const tiempoCritico = tiempoRestante < 300;

  return (
    <div className="examen-layout">
      <div className="examen-sidebar">
        <div className={`timer-box ${tiempoCritico ? 'warning' : ''}`}>
          ⏱️ {formatTiempo(tiempoRestante)}
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <h4 style={{ marginBottom: '12px', fontSize: '0.9rem', textAlign: 'center' }}>
            Navegación
          </h4>
          <div className="preguntas-nav-grid">
            {examen.preguntas.map((p, idx) => {
              const resp = respuestasUsuario[p.id];
              let clase = 'nav-btn';
              if (idx === preguntaActivaIndex) clase += ' active';
              if (resp?.duda) clase += ' duda';
              else if (resp?.opcion) clase += ' answered';

              return (
                <button
                  key={p.id}
                  className={clase}
                  onClick={() => setPreguntaActivaIndex(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onPausarYSalir}>
          ⏸️ Pausar y Salir
        </button>
      </div>

      <div className="examen-content-panel">
        <div className="glass-panel pregunta-card">
          <div className="pregunta-header">
            <span style={{ fontWeight: '700', color: 'var(--primary)' }}>
              Pregunta {preguntaActivaIndex + 1} de {examen.preguntas.length}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {ultimoGuardado && (
                <span className="saving-indicator">
                  <span className="saving-dot"></span> Autoguardado {ultimoGuardado}
                </span>
              )}
              <button
                className={`btn ${esDuda ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  minHeight: 'auto',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  backgroundColor: esDuda ? 'var(--warning)' : 'transparent',
                  color: esDuda ? 'white' : 'var(--text)',
                  borderColor: esDuda ? 'var(--warning)' : 'var(--border)',
                }}
                onClick={() => onToggleDudaPregunta(pregunta.id)}
              >
                📌 {esDuda ? 'En duda' : 'Marcar duda'}
              </button>
            </div>
          </div>

          <p className="pregunta-enunciado">{pregunta.enunciado}</p>

          <div className="opciones-list">
            {pregunta.opciones.map((opcion, index) => {
              const letra = String.fromCharCode(65 + index);
              const esSeleccionada = respuestaActual === letra;

              return (
                <div
                  key={index}
                  className={`opcion-item ${esSeleccionada ? 'selected' : ''}`}
                  onClick={() => onResponderPregunta(pregunta.id, letra)}
                >
                  <span className="opcion-letra">{letra}</span>
                  <span>{opcion}</span>
                </div>
              );
            })}
          </div>

          <div className="pregunta-actions">
            <button
              className="btn btn-secondary"
              disabled={preguntaActivaIndex === 0}
              onClick={() => setPreguntaActivaIndex((prev) => prev - 1)}
            >
              Anterior
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                style={{ display: 'none' }}
                id="btn-nav-mobile"
                onClick={() => setMostrarModalPreguntasMovil(true)}
              >
                🔢
              </button>

              {preguntaActivaIndex === examen.preguntas.length - 1 ? (
                <button
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--success)' }}
                  onClick={onEntregarExamen}
                >
                  🏁 Entregar Examen
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setPreguntaActivaIndex((prev) => prev + 1)}
                >
                  Siguiente
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {mostrarModalPreguntasMovil && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            className="glass-panel"
            style={{ backgroundColor: 'var(--bg)', width: '100%', maxWidth: '400px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h4>Navegación de Preguntas</h4>
              <button className="btn btn-text" onClick={() => setMostrarModalPreguntasMovil(false)}>
                ✖️
              </button>
            </div>
            <div
              className="preguntas-nav-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}
            >
              {examen.preguntas.map((p, idx) => {
                const resp = respuestasUsuario[p.id];
                let clase = 'nav-btn';
                if (idx === preguntaActivaIndex) clase += ' active';
                if (resp?.duda) clase += ' duda';
                else if (resp?.opcion) clase += ' answered';

                return (
                  <button
                    key={p.id}
                    className={clase}
                    onClick={() => {
                      setPreguntaActivaIndex(idx);
                      setMostrarModalPreguntasMovil(false);
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                className="btn btn-secondary"
                style={{ flexGrow: 1 }}
                onClick={onPausarYSalir}
              >
                ⏸️ Pausar Examen
              </button>
              <button
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--success)', flexGrow: 1 }}
                onClick={onEntregarExamen}
              >
                🏁 Entregar
              </button>
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media (max-width: 768px) {
            #btn-nav-mobile { display: inline-flex !important; }
          }
        `,
        }}
      />
    </div>
  );
}
