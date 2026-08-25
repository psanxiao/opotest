import React from 'react';

export default function HistoryView({
  historial,
  cargandoHistorial,
  onReanudarExamen,
  onVerResultados,
}) {
  return (
    <div className="glass-panel">
      <h2>Historial de Simulaciones</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        Estadísticas y evolución de tus exámenes.
      </p>

      {cargandoHistorial ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando historial...</div>
      ) : historial.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>📊</span>
          Aún no has realizado ningún examen. Configura uno y pon a prueba tus conocimientos.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {historial.map((ex) => {
            const colorNota =
              ex.nota >= 7 ? 'var(--success)' : ex.nota >= 5 ? 'var(--warning)' : 'var(--danger)';
            return (
              <div key={ex.id} className="historial-item">
                <div className="historial-meta">
                  <h4 style={{ textTransform: 'capitalize' }}>
                    Examen{' '}
                    {ex.estado === 'activo'
                      ? 'en curso ⏳'
                      : ex.estado === 'pausado'
                      ? 'pausado ⏸️'
                      : 'finalizado 🏁'}
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {ex.temas.map((t, idx) => (
                      <span key={idx} className="historial-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="tema-meta" style={{ marginTop: '8px' }}>
                    Fecha: {ex.fecha} | Duración: {ex.tiempo_total / 60} min | {ex.num_preguntas}{' '}
                    preguntas
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {ex.estado === 'terminado' && ex.nota !== null ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div className="historial-score" style={{ color: colorNota }}>
                          {ex.nota.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {ex.aciertos} A / {ex.fallos} F / {ex.blancos} B
                        </div>
                      </div>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', minHeight: 'auto' }}
                        onClick={() => onVerResultados(ex.id)}
                      >
                        Revisar
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 16px', minHeight: 'auto', fontSize: '0.9rem' }}
                      onClick={() => onReanudarExamen(ex.id)}
                    >
                      Continuar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
