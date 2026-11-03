'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * COMPONENTE BlueprintCard (Nota de Dirección de Animación del Autor)
 * Permite visualizar las directrices creativas y bocetos conceptuales de cada figura.
 */
export function BlueprintCard({
  visible = true,
  figureNumber = '01',
  tag = '#canvas-arbol-bosque',
  text,
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto', transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] } }}
          exit={{ opacity: 0, height: 0, transition: { duration: 0.14, ease: [0.23, 1, 0.32, 1] } }}
          style={{ overflow: 'hidden' }}
          className="blueprint-note"
        >
          <div className="blueprint-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span>Nota de la lámina {figureNumber}</span>
          </div>
          <p className="blueprint-text">
            <strong>Qué observar:</strong> {text}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
