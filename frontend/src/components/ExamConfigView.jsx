import React from 'react';

export default function ExamConfigView({
  temas,
  temasSeleccionados,
  setTemasSeleccionados,
  numPreguntas,
  setNumPreguntas,
  duracionMinutos,
  setDuracionMinutos,
  penalizacion,
  setPenalizacion,
  forzarGeneracion,
  setForzarGeneracion,
  creandoExamen,
  onIniciarExamen,
  onAtras,
}) {
  const toggleSeleccionTema = (temaId) => {
    setTemasSeleccionados((prev) =>
      prev.includes(temaId) ? prev.filter((id) => id !== temaId) : [...prev, temaId]
    );
  };

  const toggleSeleccionarTodosTemas = () => {
    if (temasSeleccionados.length === temas.length) {
      setTemasSeleccionados([]);
    } else {
      setTemasSeleccionados(temas.map((t) => t.id));
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '8px' }}>Configuración de tu Examen</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        Ajusta las condiciones del simulador tipo test.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '1rem' }}>1. Selecciona los Temas a Evaluar</label>
            <button
              className="btn btn-text"
              style={{ fontSize: '0.85rem' }}
              onClick={toggleSeleccionarTodosTemas}
            >
              {temasSeleccionados.length === temas.length
                ? 'Deseleccionar todos'
                : 'Seleccionar todos'}
            </button>
          </div>
          <div className="temas-select-list">
            {temas.map((t) => (
              <div
                key={t.id}
                className="tema-select-item"
                onClick={() => toggleSeleccionTema(t.id)}
                style={{
                  backgroundColor: temasSeleccionados.includes(t.id)
                    ? 'var(--primary-light)'
                    : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={temasSeleccionados.includes(t.id)}
                  onChange={() => {}}
                />
                <div>
                  <span style={{ fontWeight: '600', display: 'block' }}>{t.titulo}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Tiene {t.num_preguntas} preguntas de banco
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
          }}
        >
          <div className="form-group">
            <label>2. Número de Preguntas</label>
            <select
              className="form-control"
              value={numPreguntas}
              onChange={(e) => setNumPreguntas(parseInt(e.target.value))}
            >
              <option value="5">5 preguntas (Prueba rápida)</option>
              <option value="10">10 preguntas</option>
              <option value="20">20 preguntas</option>
              <option value="50">50 preguntas</option>
              <option value="100">100 preguntas</option>
            </select>
          </div>

          <div className="form-group">
            <label>3. Tiempo Límite</label>
            <select
              className="form-control"
              value={duracionMinutos}
              onChange={(e) => setDuracionMinutos(parseInt(e.target.value))}
            >
              <option value="5">5 minutos</option>
              <option value="10">10 minutos</option>
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="60">60 minutos (1 hora)</option>
              <option value="90">90 minutos</option>
              <option value="120">120 minutos (2 horas)</option>
            </select>
          </div>

          <div className="form-group">
            <label>4. Penalización de Fallos</label>
            <select
              className="form-control"
              value={penalizacion}
              onChange={(e) => setPenalizacion(parseFloat(e.target.value))}
            >
              <option value="0.0">No penalizar fallos (0 puntos)</option>
              <option value="0.25">Cada fallo resta 1/4 (-0.25)</option>
              <option value="0.33">Cada fallo resta 1/3 (-0.33) [Económico]</option>
              <option value="0.5">Cada fallo resta 1/2 (-0.50)</option>
            </select>
          </div>
        </div>

        <div
          className="form-group"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '10px',
            marginTop: '4px',
          }}
        >
          <input
            type="checkbox"
            id="forzar-generacion-checkbox"
            checked={forzarGeneracion}
            onChange={(e) => setForzarGeneracion(e.target.checked)}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
          <label
            htmlFor="forzar-generacion-checkbox"
            style={{ fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}
          >
            🔄 Forzar generación de preguntas nuevas (invoca a Gemini para añadir nuevas preguntas al
            temario)
          </label>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          <button className="btn btn-secondary" style={{ flexGrow: 1 }} onClick={onAtras}>
            Atrás
          </button>
          <button
            className="btn btn-primary"
            style={{ flexGrow: 2 }}
            onClick={onIniciarExamen}
            disabled={creandoExamen || temasSeleccionados.length === 0}
          >
            {creandoExamen
              ? 'Preparando preguntas y conectando con Gemini...'
              : '🚀 Iniciar Examen'}
          </button>
        </div>
      </div>
    </div>
  );
}
