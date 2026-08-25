import React from 'react';

export default function Navbar({ vista, onNavigate, temaOscuro, onToggleTheme, onLogoClick }) {
  return (
    <header className="main-header">
      <div className="header-content">
        <div className="logo" onClick={onLogoClick}>
          <span>🛡️</span> OpoTest
        </div>

        <div className="header-actions">
          {vista !== 'examen-activo' && (
            <nav style={{ display: 'flex', gap: '16px' }}>
              <button
                className={`btn btn-text ${vista === 'dashboard' ? 'active' : ''}`}
                style={{
                  fontWeight: vista === 'dashboard' ? '700' : '500',
                  color: vista === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)',
                }}
                onClick={() => onNavigate('dashboard')}
              >
                Temarios
              </button>
              <button
                className={`btn btn-text ${vista === 'historial' ? 'active' : ''}`}
                style={{
                  fontWeight: vista === 'historial' ? '700' : '500',
                  color: vista === 'historial' ? 'var(--primary)' : 'var(--text-muted)',
                }}
                onClick={() => onNavigate('historial')}
              >
                Historial
              </button>
            </nav>
          )}

          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label="Cambiar tema visual"
          >
            {temaOscuro ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}
