'use client';

import React, { useEffect, useState } from 'react';

/**
 * COMPONENTE TopNavbar (Cabecera de Libro y Cinta Marcapáginas)
 * Principio SOLID: Responsabilidad Única (SRP).
 * Diseñado Mobile-First: Muestra el folio/capítulo activo, cinta marcapáginas
 * y controles compactos adaptados a pantallas táctiles.
 */
export function TopNavbar({
  currentChapter = '00. Introducción: El punto de partida',
  blueprintsVisible = true,
  onToggleBlueprints,
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLight, setIsLight] = useState(false);

  // Escuchar el desplazamiento vertical para actualizar el marcapáginas de lectura
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      setScrollProgress(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Alternar entre modo oscuro (Biblioteca Nocturna) y claro (Papel Vergé Marfil)
  const toggleTheme = () => {
    const nextState = !isLight;
    setIsLight(nextState);
    if (nextState) {
      document.documentElement.classList.add('light-theme');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.removeAttribute('data-theme');
    }
  };

  return (
    <>
      {/* Progreso de lectura superior */}
      <div className="progress-track" aria-hidden="true">
        <div className="progress-bar" style={{ transform: `scaleX(${scrollProgress / 100})` }} />
      </div>

      {/* Cinta marcapáginas clásica */}
      <div className="ribbon-bookmark" title={`Lectura: ${Math.round(scrollProgress)}%`} aria-hidden="true" />

      {/* Cabecera del libro fija */}
      <header className="top-navbar">
        <div className="navbar-inner">
          <div className="brand-cluster">
            <div className="brand-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div className="chapter-meta">
              <span className="chapter-kicker">Tratado &bull; Folio de Lectura</span>
              <span className="chapter-current">{currentChapter}</span>
            </div>
          </div>

          <div className="nav-controls">
            {/* Botón para alternar los escolios / notas del autor */}
            <button
              type="button"
              className="btn-pill"
              onClick={onToggleBlueprints}
              title="Mostrar u ocultar notas al margen"
            >
              <span
                className="status-dot"
                style={{ background: blueprintsVisible ? 'var(--accent-amber)' : 'var(--text-muted)' }}
              />
              <span>{blueprintsVisible ? 'Notas: ON' : 'Notas: OFF'}</span>
            </button>

            {/* Conmutador de luz / pergamino claro */}
            <button
              type="button"
              className="btn-icon-only"
              onClick={toggleTheme}
              title="Cambiar tono pergamino / biblioteca nocturna"
              aria-label="Cambiar tema claro u oscuro"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
