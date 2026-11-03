'use client';

import React from 'react';

/**
 * COMPONENTE BibliographySection (Fuentes Bibliográficas)
 * Cita rigurosamente los artículos seminales de filosofía de la mente,
 * ecología sensorial y neurobiología de Drosophila que sustentan el ensayo.
 */
export function BibliographySection() {
  const references = [
    {
      field: 'FILOSOFÍA DE LA MENTE • 1974',
      title: 'Thomas Nagel — "What Is It Like to Be a Bat?"',
      desc: 'Publicado en The Philosophical Review. Define el límite insuperable de la subjetividad: aunque conozcamos toda la neurofisiología de otro organismo, nuestro sesgo cognitivo humano nos impide experimentar su mundo en primera persona.',
    },
    {
      field: 'BIOLOGÍA TEÓRICA • 1934',
      title: 'Jakob von Uexküll — "A Foray into the Worlds of Animals and Humans"',
      desc: 'Introduce el concepto de Umwelt: cada especie animal vive dentro de una burbuja sensorial propia y hermética, donde solo existen las señales físicas que tienen significado adaptativo para su supervivencia.',
    },
    {
      field: 'CALTECH / CURRENT BIOLOGY • 2015',
      title: 'Gibson, W. T., Gonzalez, C. R., & Anderson, D. J.',
      desc: '"Behavioral Responses to a Repetitive Visual Threat Stimulus Express a Persistent State of Defensive Arousal in Drosophila". Demuestra que sombras aéreas repetidas inducen un estado interno de alerta duradera análogo al estrés postraumático.',
    },
    {
      field: 'SCIENCE • 2012',
      title: 'Shohat-Ophir, G., Kaun, K. R., Azanchi, R., & Heberlein, U.',
      desc: '"Sexual Deprivation Increases Ethanol Intake in Drosophila". Demuestra cómo la experiencia social adversa y el rechazo reducen el Neuropéptido F cerebral y permiten predecir la búsqueda activa y selectiva de alcohol.',
    },
    {
      field: 'J. OF EXPERIMENTAL BIOLOGY • 2013',
      title: 'Yang, Z., Bertolucci, F., Wolf, R., & Heisenberg, M.',
      desc: '"Flies cope with uncontrollable stress by learned helplessness". Documenta el fenómeno de indefensión aprendida en moscas expuestas a estrés térmico incontrolable, suprimiendo permanentemente su iniciativa motora futura.',
    },
  ];

  return (
    <section data-chapter="05. Fuentes Bibliográficas">
      <div className="chapter-divider">
        <span className="chapter-number">REFERENCIAS CIENTÍFICAS</span>
        <div className="chapter-line" />
      </div>

      <h2 className="section-heading">Fuentes científicas y filosóficas para seguir tirando del hilo</h2>

      <div className="biblio-grid">
        {references.map((ref, index) => (
          <div key={index} className="biblio-card">
            <span className="biblio-year">{ref.field}</span>
            <h3 className="biblio-title">{ref.title}</h3>
            <p className="biblio-desc">{ref.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
