'use client';

import React, { useState, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { TopNavbar } from '../components/layout/TopNavbar';
import { HeroSection } from '../components/layout/HeroSection';
import { TreeParadoxFigure } from '../components/figures/TreeParadoxFigure';
import { DrosophilaUmweltFigure } from '../components/figures/DrosophilaUmweltFigure';
import { BehavioralArenaFigure } from '../components/figures/BehavioralArenaFigure';
import { EvolutionaryMirrorFigure } from '../components/figures/EvolutionaryMirrorFigure';
import { BibliographySection } from '../components/layout/BibliographySection';
import { BlueprintCard } from '../components/ui/BlueprintCard';
import { ScientificTooltip } from '../components/ui/ScientificTooltip';

/**
 * PÁGINA PRINCIPAL (Page)
 *
 * Ensayo narrativo e interactivo: "¿Existen traumas en las moscas?"
 * Una reflexión sobre el egocentrismo humano, la empatía radical y la comunicación abierta.
 * Escrito por Duglas Altamar Gómez.
 * Coautores: Gemini 3.8 Flash y Claude Opus 5.5.
 * Principios SOLID, arquitectura por capítulos, microinteracciones y estilo libro clásico.
 */
export default function Home() {
  const [currentChapter, setCurrentChapter] = useState('00. Introducción: La trampa del juicio');
  const [blueprintsVisible, setBlueprintsVisible] = useState(true);

  // Sincronizar el folio/capítulo visible con la barra superior de lectura
  useEffect(() => {
    const sections = document.querySelectorAll('section[data-chapter]');
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const title = entry.target.getAttribute('data-chapter');
            if (title) setCurrentChapter(title);
          }
        });
      },
      { rootMargin: '-20% 0px -65% 0px' }
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {/* Barra de navegación superior fija */}
      <TopNavbar
        currentChapter={currentChapter}
        blueprintsVisible={blueprintsVisible}
        onToggleBlueprints={() => setBlueprintsVisible(!blueprintsVisible)}
      />

      <main className="main-container">
        {/* CAPÍTULO 00: FRONTISPICIO / PORTADA DEL ENSAYO */}
        <HeroSection />

        {/* CAPÍTULO 01: EL BOSQUE Y LA HUMILDAD DE LA MIRADA */}
        <section data-chapter="01. El Bosque y la Humildad de la Mirada" className="book-page-folio">
          <div className="chapter-divider">
            <span className="chapter-number">CAPÍTULO 01 &bull; FOLIO 1</span>
            <div className="chapter-line" />
          </div>
          <h2 className="section-heading">Si un árbol cae en el bosque y nadie lo escucha, ¿hace ruido?</h2>

          <div className="prose-section">
            <p>
              <span className="drop-cap">D</span>urante generaciones nos hemos hecho la famosa pregunta:{' '}
              <em>«Si un árbol cae en medio del bosque y no hay nadie para escucharlo, ¿hace ruido?»</em>. La respuesta
              no es un truco de palabras, es nuestra primera gran lección de <strong>humildad cognitiva</strong>.
            </p>
            <p>
              Solemos confundir dos cosas radicalmente distintas:
            </p>
            <ol style={{ paddingLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>1. La física objetiva:</strong> Al chocar contra la tierra, el árbol empuja las moléculas de aire y
                crea ondas mecánicas de presión. Esas ondas existen con absoluta certeza física en el bosque, haya o no
                haya alguien mirando.
              </li>
              <li>
                <strong>2. La sensación subjetiva:</strong> El estruendo que tú escuchas no viaja por el aire. El sonido es
                una <strong>fabricación mental</strong>. Ocurre únicamente cuando esas ondas golpean tu tímpano, activan tu
                cóclea y tu cerebro decide traducir ese impacto físico en una sensación.
              </li>
            </ol>
            <p>
              Sin un oído ni un cerebro en el bosque, <strong>no hay sonido</strong>. Hay aire en movimiento en medio de un
              silencio absoluto.
            </p>
            <div className="pull-quote">
              «Tu mente no es una ventana transparente al universo. Es un traductor que inventa tu propia versión del
              mundo. Si comprendes que tu percepción no es la verdad absoluta, das el primer paso para dejar de juzgar a los
              demás desde tus propios sesgos.»
            </div>
            <p>
              Comprueba tú mismo esta diferencia en el primer experimento interactivo:
            </p>
          </div>

          {/* FIGURA 01: LA PARADOJA DEL BOSQUE */}
          <TreeParadoxFigure />

          <BlueprintCard
            visible={blueprintsVisible}
            figureNumber="01"
            tag="#canvas-arbol-bosque"
            text="Simulación directa de la paradoja clásica del árbol. Compara qué ocurre si el bosque está vacío frente a si hay una persona escuchando. Puedes cambiar la distancia de la persona y comprobar con tus propios altavoces si el colapso genera ruido o silencio absoluto."
          />
        </section>

        {/* CAPÍTULO 02: EL UMWELT: CADA UNO EN SU BURBUJA */}
        <section data-chapter="02. El Umwelt: Cada Uno en su Burbuja" className="book-page-folio">
          <div className="chapter-divider">
            <span className="chapter-number">CAPÍTULO 02 &bull; FOLIO 2</span>
            <div className="chapter-line" />
          </div>
          <h2 className="section-heading">El Umwelt: Cada especie (y cada persona) habita un mundo distinto</h2>

          <div className="prose-section">
            <p>
              <span className="drop-cap">E</span>n 1934, el biólogo Jakob von Uexküll acuñó el término{' '}
              <strong>Umwelt</strong> para describir la «burbuja perceptual» en la que vive cada animal. Dos seres vivos
              pueden compartir exactamente la misma habitación física y, sin embargo, habitar mundos completamente
              diferentes.
            </p>
            <p>
              Mira a la pequeña mosca de la fruta (
              <ScientificTooltip
                term="Drosophila melanogaster"
                title="Ficha biológica • Drosophila melanogaster"
              >
                Conocida popularmente como mosca del vinagre o de la fruta. Es el organismo modelo por excelencia en
                genética y neurociencia: cuenta con ~140.000 neuronas (cuyo conectoma completo ha sido cartografiado),
                comparte más del 60% de genes vinculados a enfermedades humanas y sintetiza los mismos mensajeros
                químicos clave (dopamina, serotonina y neuropéptido F).
              </ScientificTooltip>
              ) que se posa cerca de ti:
            </p>
            <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Tus ojos humanos procesan unos <strong>60 destellos de luz por segundo</strong>. Tu tiempo corre al ritmo
                de un mamífero grande y pesado. Cuando lanzas tu mano para espantarla, sientes que te mueves con gran
                rapidez.
              </li>
              <li>
                El ojo compuesto de la mosca procesa hasta <strong>250 imágenes por segundo</strong>. Para ella, tu mano no
                es un proyectil veloz: es una masa gigantesca que desciende en cámara lenta, como si flotara a través de un
                aire denso como la miel.
              </li>
            </ul>
            <p>
              La mosca no vive en una versión &quot;inferior&quot; de tu mundo; vive en <strong>su propio mundo</strong>.
            </p>
            <div className="pull-quote">
              «Esto mismo ocurre entre nosotros todos los días. Cada persona que cruzas por la calle carga con su propio
              Umwelt. Ya sea una historia que no conoces, un ritmo interno distinto o cicatrices invisibles que alteran cómo
              procesa lo que vive. Querer que alguien reaccione exactamente como tú no es empatía, es ceguera perceptual.»
            </div>
            <p>
              Si queremos saber si una experiencia adversa marca a una mosca, no podemos esperar que llore como un humano.
              Tenemos que aprender a buscar las huellas del dolor en su propia escala biológica:
            </p>
          </div>

          {/* FIGURA 02: EL FILTRO DEL UMWELT */}
          <DrosophilaUmweltFigure />

          <BlueprintCard
            visible={blueprintsVisible}
            figureNumber="02"
            tag="#filtro-umwelt"
            text="La misma mano intenta atrapar a la misma mosca dos veces. La línea cian es su recorrido real, idéntico en ambas escenas. Las siluetas ámbar son las imágenes que capta cada ojo: con ojos humanos, pocas y separadas (un borrón); con ojos de mosca, muchas y juntas (cámara lenta)."
          />
        </section>

        {/* CAPÍTULO 03: APRENDER A ESCUCHAR: LA PRUEBA CIENTÍFICA DEL TRAUMA */}
        <section data-chapter="03. Aprender a Escuchar: La Prueba Científica" className="book-page-folio">
          <div className="chapter-divider">
            <span className="chapter-number">CAPÍTULO 03 &bull; FOLIO 3</span>
            <div className="chapter-line" />
          </div>
          <h2 className="section-heading">Aprender a escuchar: Cómo predecir la conducta de una mente traumatizada</h2>

          <div className="prose-section">
            <p>
              <span className="drop-cap">A</span>quí es donde la ciencia nos da la mayor lección de comunicación: durante
              siglos creímos que los insectos eran simples autómatas insensibles porque no tenían palabras para quejarse.
              Pero cuando dejamos de exigirles que hablaran en nuestro idioma y empezamos a observar sus señales con
              curiosidad y respeto, la realidad se volvió evidente.
            </p>
            <p>
              Si definimos el trauma de forma limpia y despojada de orgullo antropocéntrico:
            </p>
            <div className="pull-quote">
              <strong>Trauma:</strong> Una experiencia hostil tan intensa que deja una huella duradera en el sistema
              nervioso y altera de forma permanente el comportamiento futuro del organismo.
            </div>
            <p>
              Entonces la pregunta deja de ser una discusión abstracta:{' '}
              <strong>las moscas sí tienen traumas, y esos traumas nos permiten predecir exactamente qué harán después con rigor matemático.</strong>
            </p>
            <p>
              Con apenas 140.000 neuronas (frente a nuestros 86.000 millones), La{' '}
              <ScientificTooltip
                term="Drosophila melanogaster"
                title="Ficha biológica • Drosophila melanogaster"
              >
                Conocida popularmente como mosca del vinagre o de la fruta. Organismo modelo de la neurogenética con ~140.000 neuronas.
              </ScientificTooltip>{' '}
              utiliza los mismos mensajeros químicos del estrés y la recompensa que nosotros. Compruébalo en los tres
              experimentos reales más reveladores de la neurobiología moderna:
            </p>
            <ol style={{ paddingLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>1. La herida del rechazo (Science, 2012):</strong> Cuando a una mosca macho la rechazan
                repetidamente las hembras, su nivel de <em>Neuropéptido F</em> (equivalente a nuestro Neuropéptido Y de
                recompensa) se desploma. Al darle a elegir, la mosca rechazada va directo al alimento con 15% de alcohol
                para compensar artificialmente el déficit químico.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>2. El fantasma de la amenaza (Current Biology, 2015):</strong> Tras pasar sombras aéreas
                repetidas simulando un depredador, la mosca entra en un estado interno de <em>alerta defensiva persistente</em>.
                Aunque apagues la sombra y le ofrezcas azúcar, no come: permanece congelada o corre en zigzag, en un estado
                idéntico a la hipervigilancia del estrés postraumático.
              </li>
              <li>
                <strong>3. La resignación aprendida (J. Exp. Biology, 2013):</strong> Expuesta a ráfagas de calor sin
                salida, la mosca aprende que luchar no sirve de nada. Cuando por fin se abre la compuerta de escape,{' '}
                <em>ya no intenta huir</em>: se queda inmóvil tolerando el castigo térmico. Ha caído en indefensión
                aprendida.
              </li>
            </ol>
          </div>

          {/* FIGURA 03: ARENA CONDUCTUAL */}
          <BehavioralArenaFigure />

          <BlueprintCard
            visible={blueprintsVisible}
            figureNumber="03"
            tag="#simulador-trauma-mosca"
            text="Cuatro moscas pasan la misma prueba: una sombra cruza (cian), se abre la puerta y hay azúcar y alcohol. Lo único distinto es su pasado, y su conducta lo delata: la tranquila va al azúcar; la de las sombras salta en zigzag sin parar; la del calor no se mueve aunque la puerta esté abierta; y la rechazada va directa al alcohol."
          />
        </section>

        {/* CAPÍTULO 04: EL ESPEJO EVOLUTIVO */}
        <section data-chapter="04. El Espejo Evolutivo y la Empatía" className="book-page-folio">
          <div className="chapter-divider">
            <span className="chapter-number">CAPÍTULO 04 &bull; FOLIO 4</span>
            <div className="chapter-line" />
          </div>
          <h2 className="section-heading">El espejo evolutivo: El puente de la empatía y la comunicación</h2>

          <div className="prose-section">
            <p>
              <span className="drop-cap">A</span>l llegar aquí, la pregunta inicial se invierte y nos devuelve el golpe a
              nosotros:
            </p>
            <p>
              Si una criatura con un cerebro del tamaño de un grano de arena busca alcohol para adormecer su frustración tras
              un rechazo, o se rinde ante la adversidad porque aprendió que no puede escapar...{' '}
              <strong>
                ¿no será que nuestras propias emociones humanas son mucho más biológicas, antiguas y compartidas de lo que
                nuestro orgullo tolera admitir?
              </strong>
            </p>
            <p>
              Nos gusta creer que nuestras penas, nuestras ansiedades y nuestros duelos son creaciones elevadas y exclusivas
              del alma humana. Pero la neurobiología evolutiva nos susurra una verdad más humilde y más hermosa:
            </p>
            <div className="pull-quote">
              «Los circuitos del miedo, del apego y de la desesperanza se inventaron cientos de millones de años antes de que
              el primer ser humano pronunciara una palabra. La evolución no inventó el dolor desde cero para nosotros: tomó
              los mismos ladrillos ancestrales que ya estaban en los insectos y les puso encima una corteza capaz de hablar.»
            </div>
            <p>
              Es verdad: meterse al cien por ciento dentro de la mente de otro —sea una mosca o la persona que tienes al
              lado— es una tarea imposible. Siempre habrá una frontera entre dos mundos subjetivos.
            </p>
            <p>
              <strong>Pero esa frontera se vuelve transitable cuando decidimos comunicarnos.</strong> Cuando estamos
              dispuestos a escuchar de verdad, a desarmar nuestros prejuicios y a suspender nuestros propios sesgos.
            </p>
            <p>
              La próxima vez que alguien cercano a ti reaccione de una forma que no comprendas, o la próxima vez que veas una
              mosca parada en tu ventana, recuerda esto: no le exijas que sienta el mundo exactamente como tú lo sientes.
              Pregúntate qué sombras invisibles han cruzado sobre su vida y qué heridas están reprogramando su conducta.
            </p>
            <p style={{ fontStyle: 'italic', color: 'var(--accent-amber)', fontWeight: 600 }}>
              Comprender al otro no requiere magia: solo requiere la valentía de aceptar que tu mirada no es la única.
            </p>
          </div>

          {/* FIGURA 04: EL ESPEJO EVOLUTIVO */}
          <EvolutionaryMirrorFigure />

          <BlueprintCard
            visible={blueprintsVisible}
            figureNumber="04"
            tag="#espejo-evolutivo"
            text="La misma sombra (cian) pasa sobre una mosca, sobre una persona y sobre las dos a la vez. Encima de cada una se enciende su alarma (ámbar): ojos, centro de alarma, cuerpo. El camino es el mismo en las dos; solo en la persona se enciende además la corteza, que convierte el susto en palabras."
          />
        </section>

        {/* CAPÍTULO 05: REFERENCIAS BIBLIOGRÁFICAS */}
        <section className="book-page-folio">
          <BibliographySection />
        </section>
      </main>
    </MotionConfig>
  );
}

