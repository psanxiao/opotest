import React from 'react';

export default function ResultsView({ resultados, cargandoResultados, onVolver }) {
  if (cargandoResultados) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
        <span
          style={{
            fontSize: '3rem',
            display: 'block',
            animation: 'spin 1.5s infinite linear',
          }}
        >
          🔄
        </span>
        <h3 style={{ marginTop: '16px' }}>Corrigiendo y evaluando tu examen...</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          Gemini está revisando la validez e interpretando tus resultados.
        </p>
        <style
          dangerouslySetInnerHTML={{
            __html: `@keyframes spin { from {transform:rotate(0deg);} to {transform:rotate(360deg);} }`,
          }}
        />
      </div>
    );
  }

  if (!resultados) return null;

  let colorNota = 'var(--danger)';
  if (resultados.nota >= 7) colorNota = 'var(--success)';
  else if (resultados.nota >= 5) colorNota = 'var(--warning)';

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <h2>Revisión de Resultados</h2>
        <button className="btn btn-primary" onClick={onVolver}>
          Volver a Temas
        </button>
      </div>

      <div className="resultados-score-box">
        <span
          style={{
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Calificación Obtenida
        </span>
        <div className="nota-numero" style={{ color: colorNota }}>
          {resultados.nota.toFixed(2)}
        </div>
        <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
          Sobre 10 puntos posibles
        </span>

        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-val aciertos">✓ {resultados.aciertos}</span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Aciertos
            </p>
          </div>
          <div className="stat-item">
            <span className="stat-val fallos">✗ {resultados.fallos}</span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Fallos
            </p>
          </div>
          <div className="stat-item">
            <span className="stat-val blancos">○ {resultados.blancos}</span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Blancos
            </p>
          </div>
        </div>

        {resultados.penalizacion > 0 && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px' }}>
            * Se aplicó penalización: Cada respuesta incorrecta restó {resultados.penalizacion} de una
            correcta.
          </p>
        )}
      </div>

      <h3 style={{ marginBottom: '16px' }}>Corrección Pregunta a Pregunta</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {resultados.preguntas.map((pregunta, idx) => {
          const respUsuario = pregunta.respuesta_usuario;
          const respCorrecta = pregunta.correcta;

          return (
            <div key={pregunta.id} className="glass-panel" style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span style={{ fontWeight: '700', color: 'var(--primary)' }}>
                  Pregunta {idx + 1}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {pregunta.marcada_duda && (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        backgroundColor: 'var(--warning)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontWeight: '600',
                      }}
                    >
                      Duda
                    </span>
                  )}

                  {!respUsuario ? (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        backgroundColor: 'var(--border)',
                        color: 'var(--text-muted)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontWeight: '600',
                      }}
                    >
                      Sin responder
                    </span>
                  ) : respUsuario === respCorrecta ? (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        backgroundColor: 'var(--success-light)',
                        color: 'var(--success)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontWeight: '600',
                      }}
                    >
                      Correcta
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        backgroundColor: 'var(--danger-light)',
                        color: 'var(--danger)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontWeight: '600',
                      }}
                    >
                      Incorrecta
                    </span>
                  )}
                </div>
              </div>

              <p style={{ fontWeight: '600', marginBottom: '16px', fontSize: '1.1rem' }}>
                {pregunta.enunciado}
              </p>

              <div className="opciones-list">
                {pregunta.opciones.map((opcion, opIdx) => {
                  const letra = String.fromCharCode(65 + opIdx);

                  let clase = 'opcion-item';
                  if (letra === respCorrecta) {
                    clase += ' correct';
                  } else if (letra === respUsuario && respUsuario !== respCorrecta) {
                    clase += ' incorrect';
                  }

                  return (
                    <div key={opIdx} className={clase} style={{ cursor: 'default' }}>
                      <span className="opcion-letra">{letra}</span>
                      <span>{opcion}</span>
                    </div>
                  );
                })}
              </div>

              {pregunta.explicacion && (
                <div className="explicacion-box">
                  <div className="explicacion-titulo">💡 Explicación / Fundamento:</div>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text)' }}>
                    {pregunta.explicacion}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <button className="btn btn-primary" onClick={onVolver}>
          Terminar Revisión
        </button>
      </div>
    </div>
  );
}
