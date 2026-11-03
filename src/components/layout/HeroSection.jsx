'use client';

import React from 'react';

/**
 * COMPONENTE HeroSection (Frontispicio y Portada del Ensayo)
 *
 * Principio SOLID: Responsabilidad Única (SRP) en la presentación del frontispicio.
 * Plantea la tesis central del ensayo: el egocentrismo humano como jaula perceptual,
 * la dificultad para entender el dolor ajeno y cómo la comunicación honesta acorta distancias.
 * Adaptado a temática de libro clásico con letra capitular decorada.
 */
export function HeroSection() {
  return (
    <section data-chapter="00. Introducción: La trampa del juicio" className="book-page-folio">
      {/* Frontispicio del Tratado */}
      <div className="book-frontispiece">
        <h1 className="hero-title hero-enter" style={{ '--i': 0 }}>
          ¿Existen traumas en las moscas?
        </h1>

        <div className="book-ornament" aria-hidden="true">
          <span>❦</span>
        </div>

        <p className="hero-subtitle hero-enter" style={{ '--i': 1 }}>
          Una reflexión sobre nuestro egocentrismo como especie, cómo la comunicación ayuda a acercarnos más y nuestros propios sesgos.
        </p>
      </div>

      {/* Tarjeta de autoría editorial */}
      <div className="author-card hero-enter" style={{ '--i': 2 }}>
        <div className="author-info">
          <div className="author-avatar" aria-hidden="true">§</div>
          <div>
            {/* Autor principal y coautoría de modelos de IA */}
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)', fontStyle: 'italic' }}>
              Escrito por Duglas Altamar Gómez
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--accent-amber)', fontStyle: 'italic', marginTop: '1px' }}>
              Coautores: Gemini 3.8 Flash y Claude Opus 5.5
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              Reflexión + 4 experimentos interactivos
            </div>
          </div>
        </div>

        <div className="author-scroll-hint">
          <span>BAJA PARA RECORRER EL ENSAYO</span>
          <svg
            className="scroll-hint-arrow"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent-amber)"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Texto en prosa con letra capitular */}
      <div className="prose-section">
        <p>
          <span className="drop-cap">S</span>i en una conversación informal dices que una mosca puede quedar traumatizada,
          la mayoría de la gente se va a reir. Nos da risa porque inmediatamente imaginamos a un insecto recostado en la
          silla de un terapeuta, tratando de poner en palabras su angustia. Esperamos que el dolor se parezca al nuestro,
          es decir que venga acompañado de lágrimas, quejas o confesiones. Si no lo vemos expresado en nuestro propio idioma,
          asumimos que no existe.
        </p>
        <p>
          Ese es nuestro <strong>egocentrismo</strong>. Y no me refiero a la arrogancia cotidiana de quien quiere ser el
          centro de atención en una fiesta. Me refiero a un sesgo biológico mucho más profundo e inevitable. Estamos tan
          encerrados dentro de nuestra propia piel que solemos convertir nuestra experiencia personal en la única vara
          para medir a los demás.
        </p>
        <p>
          Nos pasa con los animales, pero sobre todo <strong>nos pasa entre nosotros</strong>. Solemos decir{' '}
          <em>«eso no es para tanto»</em> o <em>«no entiendo por qué se pone así»</em>, porque juzgamos la herida ajena
          desde la comodidad de nuestros propios sentidos.
        </p>
        <div className="pull-quote">
          «Comprender a alguien diferente a nosotros es difícil. Pero esa distancia se acorta en el instante en que
          decidimos escuchar, dispuestos a desarmar nuestros prejuicios y suspender el juicio.»
        </div>
        <p>
          Para entender a una mosca —y para aprender a entender a cualquier otro ser vivo que nos rodea— primero tenemos
          que aprender a desmontar esa mirada. Y el primer paso empieza con una vieja pregunta en medio de un bosque solitario.
        </p>
      </div>
    </section>
  );
}

