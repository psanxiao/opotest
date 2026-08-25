import React, { useState } from 'react';

export default function DashboardView({
  temas,
  cargandoTemas,
  onSubirPDF,
  onEliminarTema,
  onConfigurarNuevoExamen,
  onIniciarTestTema,
}) {
  const [archivoPDF, setArchivoPDF] = useState(null);
  const [tituloNuevoTema, setTituloNuevoTema] = useState('');
  const [subiendoPDF, setSubiendoPDF] = useState(false);
  const [mensajeErrorSubida, setMensajeErrorSubida] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!archivoPDF) return;

    setSubiendoPDF(true);
    setMensajeErrorSubida('');

    try {
      await onSubirPDF(archivoPDF, tituloNuevoTema);
      setArchivoPDF(null);
      setTituloNuevoTema('');
      const fileInput = document.getElementById('pdf-file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setMensajeErrorSubida(err.message || 'Error al subir el archivo PDF.');
    } finally {
      setSubiendoPDF(false);
    }
  };

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
        <div>
          <h2>Tus Temas de Oposición</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Sube tus temas en formato PDF y genera exámenes personalizados.
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={temas.length === 0}
          onClick={onConfigurarNuevoExamen}
        >
          ⚙️ Configurar Nuevo Examen
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '32px',
          alignItems: 'start',
        }}
        className="config-layout"
      >
        <div className="glass-panel">
          <h3 style={{ marginBottom: '16px' }}>Subir Nuevo Tema</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Título del Tema (opcional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Tema 1: La Constitución Española"
                value={tituloNuevoTema}
                onChange={(e) => setTituloNuevoTema(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Archivo PDF del Tema</label>
              <div
                className={`dropzone ${archivoPDF ? 'active' : ''}`}
                onClick={() => document.getElementById('pdf-file-input').click()}
              >
                <span className="dropzone-icon">📄</span>
                {archivoPDF ? (
                  <div>
                    <strong style={{ display: 'block', wordBreak: 'break-all' }}>
                      {archivoPDF.name}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ({(archivoPDF.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <div>
                    <strong>Haz clic para seleccionar</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Solo archivos PDF
                    </p>
                  </div>
                )}
              </div>
              <input
                id="pdf-file-input"
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files[0]) {
                    setArchivoPDF(e.target.files[0]);
                  }
                }}
              />
            </div>

            {mensajeErrorSubida && (
              <div
                style={{
                  color: 'var(--danger)',
                  backgroundColor: 'var(--danger-light)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  fontWeight: '500',
                }}
              >
                ⚠️ {mensajeErrorSubida}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={!archivoPDF || subiendoPDF}
            >
              {subiendoPDF ? 'Procesando y extrayendo texto...' : 'Cargar Tema en la Base de Datos'}
            </button>
          </form>
        </div>

        <div className="glass-panel">
          <h3 style={{ marginBottom: '16px' }}>Temarios Cargados</h3>

          {cargandoTemas ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Cargando temario...</div>
          ) : temas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>📚</span>
              Aún no has subido ningún tema. Carga un PDF en el panel izquierdo para comenzar.
            </div>
          ) : (
            <div className="temas-grid">
              {temas.map((t) => (
                <div
                  key={t.id}
                  className="glass-panel tema-card"
                  style={{ padding: '16px', backgroundColor: 'var(--input-bg)' }}
                >
                  <div>
                    <h4
                      style={{
                        fontSize: '1.05rem',
                        marginBottom: '4px',
                        wordBreak: 'break-word',
                      }}
                    >
                      {t.titulo}
                    </h4>
                    <div className="tema-meta">Cargado el: {t.fecha_creacion.split(' ')[0]}</div>
                  </div>

                  <div>
                    <div className="tema-stats">
                      <span>📝 {t.num_preguntas} preguntas creadas</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{
                          padding: '6px 12px',
                          minHeight: 'auto',
                          fontSize: '0.85rem',
                          flexGrow: 1,
                        }}
                        onClick={() => onIniciarTestTema(t.id)}
                      >
                        Hacer test
                      </button>
                      <button
                        className="btn btn-text"
                        style={{
                          padding: '6px 12px',
                          minHeight: 'auto',
                          color: 'var(--danger)',
                        }}
                        onClick={() => onEliminarTema(t.id, t.titulo)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
