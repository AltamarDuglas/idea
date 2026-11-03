'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * COMPONENTE ScientificTooltip
 * Principio SOLID: Responsabilidad Única (SRP) para glosarios y fichas flotantes.
 * Permite revelar información científica o definiciones al pasar el cursor (hover)
 * o al tocar en dispositivos móviles (tap/touch), adaptado a la temática editorial.
 *
 * @param {string} term - Término o palabra interactiva.
 * @param {string} title - Título de la tarjeta flotante.
 * @param {React.ReactNode} children - Contenido o definición explicativa.
 */
export function ScientificTooltip({ term, title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Cerrar el tooltip al hacer clic fuera en dispositivos táctiles
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('pointerdown', handleOutsideClick);
    }
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [isOpen]);

  return (
    <span
      ref={containerRef}
      className="scientific-tooltip-wrapper"
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className="scientific-tooltip-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        style={{
          background: 'none',
          border: 'none',
          padding: '0 2px',
          font: 'inherit',
          color: 'var(--accent-amber)',
          textDecoration: 'underline dotted var(--accent-amber-border)',
          textUnderlineOffset: '3px',
          cursor: 'pointer',
          fontStyle: 'italic',
          fontWeight: 600,
        }}
        title="Toca o pasa el cursor para ver la ficha biológica"
      >
        {term}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.span
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            role="tooltip"
            className="scientific-tooltip-bubble"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '280px',
              maxWidth: '85vw',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--accent-amber-border)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--card-lift)',
              padding: '12px 14px',
              zIndex: 999,
              textAlign: 'left',
              fontStyle: 'normal',
              pointerEvents: 'auto',
            }}
          >
            {title && (
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-amber)',
                  marginBottom: '4px',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '3px',
                }}
              >
                {title}
              </span>
            )}
            <span
              style={{
                display: 'block',
                fontSize: '12px',
                lineHeight: '1.55',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {children}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
