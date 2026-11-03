'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { OBSERVER_TYPES, AcousticPhysics } from '../../domain/models/AcousticPhysics';
import { webAudioSynthesizer } from '../../domain/services/WebAudioSynthesizer';
import {
  U,
  iso,
  pt,
  groundEllipse,
  shadeFaces,
  castShadowPath,
  lcg,
  box,
  buildPineModel as buildTreeModel,
  placeModel as placeTree,
  easeInOutCubic,
} from '../../domain/services/IsoEngine';

/**
 * COMPONENTE: TreeParadoxFigure (Experimento 01)
 *
 * Diorama isométrico en SVG que se reproduce solo y alterna dos escenas:
 * - Escena A: el bosque está vacío. El árbol cae, las ondas de aire se expanden… y nada más.
 * - Escena B: hay una persona. Las mismas ondas llegan a su oído y su cerebro fabrica el «¡pum!».
 *
 * Motor 3D mínimo en SVG plano (src/domain/services/IsoEngine.js):
 * - Cada objeto es un conjunto de caras con vértices (x, y, z) que se proyectan en isométrico.
 * - Una sola luz fija (arriba a la izquierda) sombrea cada cara plana: arriba claro,
 *   lado izquierdo medio, lado derecho oscuro. Así todo el diorama comparte la misma iluminación.
 * - Las caras de espaldas a la cámara se descartan y el resto se pinta de atrás hacia delante.
 * - Las sombras se proyectan sobre el suelo en la dirección de la luz y se difuminan con un filtro.
 * - Los árboles del fondo se funden un poco con el ambiente (perspectiva atmosférica).
 *
 * Las piezas que se mueven (árbol, ondas, polvo, barra de progreso) se actualizan por refs
 * en un único bucle; React solo se re-renderiza cuando cambia la escena o la etapa.
 */

// --------------------------------------------------------------------------
// Escenografía
// --------------------------------------------------------------------------
const GROUND = { w: 10, d: 6, t: 0.7, lip: 0.14 };
const TREE_BASE = { x: 2.4, y: 3 };
const PERSON = { x: 8.3, y: 3 };

const BACK_TREES = [
  { x: 0.8, y: 0.9, s: 0.8, seed: 11 },
  { x: 3.6, y: 0.7, s: 0.68, seed: 23 },
  { x: 5.8, y: 1.1, s: 0.86, seed: 37 },
  { x: 8.6, y: 0.8, s: 0.72, seed: 41 },
  { x: 1.9, y: 1.9, s: 0.6, seed: 53 },
];
const FRONT_TREES = [
  { x: 0.7, y: 4.3, s: 0.66, seed: 61 },
  { x: 1.6, y: 5.4, s: 0.78, seed: 73 },
  { x: 4.8, y: 5.3, s: 0.62, seed: 89 },
  { x: 7.0, y: 5.6, s: 0.7, seed: 97 },
];

const bakeTree = (t, fog) => {
  const placed = placeTree(buildTreeModel(t.seed, t.s), t, 0);
  return { polys: shadeFaces(placed.faces, fog), shadow: castShadowPath(placed.verts), base: iso(t.x, t.y, 0), s: t.s };
};
const BACK_BAKED = BACK_TREES.map((t) => bakeTree(t, 0.32));
const FRONT_BAKED = FRONT_TREES.map((t) => bakeTree(t, 0));

const MAIN_MODEL = buildTreeModel(5, 1.05);
const MAIN_FACE_COUNT = MAIN_MODEL.faces.length;
const MAIN_INITIAL = (() => {
  const placed = placeTree(MAIN_MODEL, TREE_BASE, 0);
  return { polys: shadeFaces(placed.faces), shadow: castShadowPath(placed.verts) };
})();

// Persona hecha de prismas, con la cabeza como esfera iluminada
const PX = PERSON.x;
const PY = PERSON.y;
const PERSON_FACES = [
  ...box(PX - 0.07, PX + 0.07, PY - 0.2, PY - 0.06, 0, 0.85, 'pants'),
  ...box(PX - 0.07, PX + 0.07, PY + 0.06, PY + 0.2, 0, 0.85, 'pants'),
  ...box(PX - 0.13, PX + 0.13, PY - 0.24, PY + 0.24, 0.85, 1.62, 'jacket'),
  ...box(PX - 0.06, PX + 0.06, PY - 0.36, PY - 0.25, 0.95, 1.58, 'jacket'),
  ...box(PX - 0.06, PX + 0.06, PY + 0.25, PY + 0.36, 0.95, 1.58, 'jacket'),
];
const PERSON_POLYS = shadeFaces(PERSON_FACES);
const HEAD_Z = 1.92;
const HEAD_R = 0.25;
const PERSON_SHADOW = castShadowPath([
  ...PERSON_FACES.flatMap((f) => f.pts),
  [PX - HEAD_R, PY, HEAD_Z],
  [PX + HEAD_R, PY, HEAD_Z],
  [PX, PY - HEAD_R, HEAD_Z],
  [PX, PY + HEAD_R, HEAD_Z],
  [PX, PY, HEAD_Z + HEAD_R],
]);
const P_FEET = iso(PX, PY, 0);
const P_HEAD = iso(PX, PY, HEAD_Z);
const P_HEAD_R = HEAD_R * U;
const P_EAR = [P_HEAD[0] - P_HEAD_R * 0.92, P_HEAD[1] + 1];

const soundArc = (R) => {
  const a = R * Math.cos(Math.PI / 5);
  const b = R * Math.sin(Math.PI / 5);
  return `M ${P_EAR[0] - a} ${P_EAR[1] - b} A ${R} ${R} 0 0 0 ${P_EAR[0] - a} ${P_EAR[1] + b}`;
};

// Bloque de tierra: tapa de hierba, labio de hierba en los cantos y caras de tierra
const G = GROUND;
const groundTop = [iso(0, 0), iso(G.w, 0), iso(G.w, G.d), iso(0, G.d)];
const SLAB = (() => {
  const faces = [
    { pts: [[0, 0, 0], [G.w, 0, 0], [G.w, G.d, 0], [0, G.d, 0]], hint: [0, 0, 1], mat: 'grass' },
    { pts: [[G.w, 0, -G.lip], [G.w, G.d, -G.lip], [G.w, G.d, -G.t], [G.w, 0, -G.t]], hint: [1, 0, 0], mat: 'soil' },
    { pts: [[0, G.d, -G.lip], [G.w, G.d, -G.lip], [G.w, G.d, -G.t], [0, G.d, -G.t]], hint: [0, 1, 0], mat: 'soil' },
    { pts: [[G.w, 0, 0], [G.w, G.d, 0], [G.w, G.d, -G.lip], [G.w, 0, -G.lip]], hint: [1, 0, 0], mat: 'grass' },
    { pts: [[0, G.d, 0], [G.w, G.d, 0], [G.w, G.d, -G.lip], [0, G.d, -G.lip]], hint: [0, 1, 0], mat: 'grass' },
  ];
  return shadeFaces(faces);
})();

// Vetas de tierra en los cantos
const STRATA = [-0.34, -0.52].flatMap((z) => [
  [iso(0, G.d, z), iso(G.w, G.d, z)],
  [iso(G.w, 0, z), iso(G.w, G.d, z)],
]);

// Manchas de hierba y matojos: posiciones deterministas (idénticas en servidor y cliente)
const { PATCHES, TUFTS } = (() => {
  const rand = lcg(7);
  const clear = (x, y) => Math.abs(y - 3) < 0.7 && x > 1.8 && x < 9;
  const patches = Array.from({ length: 9 }, () => {
    const x = 0.8 + rand() * 8.4;
    const y = 0.6 + rand() * 4.8;
    const r = 0.35 + rand() * 0.5;
    return [iso(x - r, y, 0), iso(x, y - r * 0.7, 0), iso(x + r, y, 0), iso(x, y + r * 0.7, 0)].map(pt).join(' ');
  });
  const tufts = Array.from({ length: 30 }, () => ({ x: 0.4 + rand() * 9.2, y: 0.4 + rand() * 5.2 })).filter(
    (t) => !clear(t.x, t.y)
  );
  return { PATCHES: patches, TUFTS: tufts };
})();

// --------------------------------------------------------------------------
// Línea de tiempo de cada escena (ms)
// --------------------------------------------------------------------------
const WAVE_SPEED = 2.6; // unidades por segundo
const IMPACT = { x: TREE_BASE.x + 2.3, y: TREE_BASE.y };
const IMPACT_SCREEN = iso(IMPACT.x, IMPACT.y, 0);
const RING_COUNT = 3;
const RING_GAP = 220;
const RING_LIFE = 2100;

const T = { raise: 700, fallStart: 1000, fallDur: 850 };
T.impact = T.fallStart + T.fallDur;
T.reach = T.impact + ((PERSON.x - IMPACT.x - 0.3) / WAVE_SPEED) * 1000;
T.end = 9500; // ~6 s con el resultado en pantalla para poder leerlo
const STATIC_T = T.reach + 600; // fotograma fijo para reduced-motion

const SCENES = {
  empty: {
    letter: 'A',
    name: 'Bosque vacío',
    observer: OBSERVER_TYPES.NONE,
    intro: 'Escena A: el bosque está vacío. Mira qué pasa cuando cae el árbol.',
    result: 'Silencio. El aire vibra igual, pero no hay ningún oído que lo convierta en sonido.',
  },
  person: {
    letter: 'B',
    name: 'Con una persona',
    observer: OBSERVER_TYPES.PERSON,
    intro: 'Escena B: ahora hay una persona en el bosque.',
    result: '¡Pum! Las mismas ondas llegan a su oído y su cerebro fabrica el ruido.',
  },
};

function thetaAt(t, startFallen) {
  if (t < T.raise && startFallen) return (Math.PI / 2) * (1 - easeInOutCubic(t / T.raise));
  if (t < T.fallStart) return 0;
  if (t < T.impact) {
    const p = (t - T.fallStart) / T.fallDur;
    return (Math.PI / 2) * p * p; // acelera como un cuerpo que cae
  }
  const k = t - T.impact;
  if (k < 320) return Math.PI / 2 - 0.07 * Math.abs(Math.sin((k / 320) * Math.PI * 2)) * (1 - k / 320);
  return Math.PI / 2;
}

// --------------------------------------------------------------------------
// Piezas estáticas
// --------------------------------------------------------------------------
function Facets({ polys }) {
  return polys.map((p, i) => (
    <polygon key={i} points={p.points} fill={p.fill} stroke={p.fill} strokeWidth="0.6" strokeLinejoin="round" />
  ));
}

function BakedTree({ tree }) {
  return (
    <g>
      <ellipse
        cx={tree.base[0]}
        cy={tree.base[1]}
        rx={groundEllipse(0.3 * tree.s).rx}
        ry={groundEllipse(0.3 * tree.s).ry}
        className="forest-contact"
      />
      <Facets polys={tree.polys} />
    </g>
  );
}

// --------------------------------------------------------------------------
// Componente
// --------------------------------------------------------------------------
export function TreeParadoxFigure() {
  const [scene, setScene] = useState('empty');
  const [stage, setStage] = useState('ready'); // ready | waves | result
  const [cycle, setCycle] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [soundOn, setSoundOn] = useState(false);

  const reduceMotion = useReducedMotion();
  const articleRef = useRef(null);

  // Refs de las piezas animadas
  const facetRefs = useRef([]);
  const mainShadowRef = useRef(null);
  const ringRefs = useRef([]);
  const ringGlowRefs = useRef([]);
  const puffRef = useRef(null);
  const progressRefs = useRef({});

  const simRef = useRef({
    t: 0,
    scene: 'empty',
    stage: 'ready',
    startFallen: false,
    playing: true,
    visible: false,
    seen: false,
    lastTheta: -1,
  });

  useEffect(() => {
    webAudioSynthesizer.setAudioEnabled(soundOn);
  }, [soundOn]);

  // Con reduced-motion no hay reproducción automática: se muestra el fotograma clave de cada escena
  useEffect(() => {
    if (!reduceMotion) return;
    const s = simRef.current;
    s.playing = false;
    s.t = STATIC_T;
    setPlaying(false);
  }, [reduceMotion]);

  const paint = useCallback((t, startFallen, currentScene) => {
    const s = simRef.current;
    const theta = thetaAt(t, startFallen);

    // El árbol solo se recalcula si se ha movido
    if (theta !== s.lastTheta) {
      s.lastTheta = theta;
      const placed = placeTree(MAIN_MODEL, TREE_BASE, theta);
      const polys = shadeFaces(placed.faces);
      for (let i = 0; i < MAIN_FACE_COUNT; i++) {
        const el = facetRefs.current[i];
        if (!el) continue;
        const p = polys[i];
        if (p) {
          el.setAttribute('points', p.points);
          el.setAttribute('fill', p.fill);
          el.setAttribute('stroke', p.fill);
        } else {
          el.setAttribute('points', '');
        }
      }
      if (mainShadowRef.current) mainShadowRef.current.setAttribute('d', castShadowPath(placed.verts));
    }

    // Ondas de presión sobre el suelo: trazo nítido + halo difuso
    for (let i = 0; i < RING_COUNT; i++) {
      const ring = ringRefs.current[i];
      const glow = ringGlowRefs.current[i];
      if (!ring || !glow) continue;
      const age = t - T.impact - i * RING_GAP;
      if (age < 0 || age > RING_LIFE) {
        ring.setAttribute('opacity', 0);
        glow.setAttribute('opacity', 0);
        continue;
      }
      const e = groundEllipse((WAVE_SPEED * age) / 1000);
      const fade = 1 - age / RING_LIFE;
      for (const el of [ring, glow]) {
        el.setAttribute('rx', e.rx);
        el.setAttribute('ry', e.ry);
      }
      ring.setAttribute('opacity', fade * 0.95);
      glow.setAttribute('opacity', fade * 0.5);
    }

    // Nube de polvo del impacto
    if (puffRef.current) {
      const age = t - T.impact;
      if (age < 0 || age > 700) {
        puffRef.current.setAttribute('opacity', 0);
      } else {
        const p = age / 700;
        const e = groundEllipse(0.6 + p * 1.3);
        puffRef.current.setAttribute('rx', e.rx);
        puffRef.current.setAttribute('ry', e.ry);
        puffRef.current.setAttribute('opacity', 0.5 * (1 - p));
      }
    }

    // Barra de progreso de la escena activa
    const bar = progressRefs.current[currentScene];
    if (bar) bar.style.transform = `scaleX(${Math.min(1, t / T.end)})`;
    const other = progressRefs.current[currentScene === 'empty' ? 'person' : 'empty'];
    if (other) other.style.transform = 'scaleX(0)';
  }, []);

  // Bucle único de animación
  useEffect(() => {
    let raf;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min(now - last, 50);
      last = now;
      const s = simRef.current;

      if (s.playing && s.visible) {
        s.t += dt;
        if (s.t >= T.end) {
          s.t = 0;
          s.startFallen = true;
          s.scene = s.scene === 'empty' ? 'person' : 'empty';
          setScene(s.scene);
          setCycle((c) => c + 1);
        }
      }

      const nextStage = s.t < T.impact ? 'ready' : s.t < T.reach ? 'waves' : 'result';
      if (nextStage !== s.stage) {
        s.stage = nextStage;
        setStage(nextStage);
        if (nextStage === 'result') {
          // Sin oyente el sintetizador no emite nada: silencio real en tus altavoces
          webAudioSynthesizer.playTreeCollapse(SCENES[s.scene].observer, 0.9);
        }
      }

      if (s.visible) paint(s.t, s.startFallen, s.scene);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paint]);

  // Solo se reproduce cuando la lámina está a la vista; la primera vez empieza desde cero
  useEffect(() => {
    const node = articleRef.current;
    if (!node || !('IntersectionObserver' in window)) {
      simRef.current.visible = true;
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        const s = simRef.current;
        s.visible = entry.isIntersecting;
        if (entry.isIntersecting && !s.seen) {
          s.seen = true;
          if (s.playing) s.t = 0;
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const selectScene = (next) => {
    const s = simRef.current;
    s.startFallen = thetaAt(s.t, s.startFallen) > 0.3;
    s.scene = next;
    if (reduceMotion && !s.playing) {
      s.t = STATIC_T;
    } else {
      s.t = 0;
      s.playing = true;
      setPlaying(true);
    }
    setScene(next);
    setCycle((c) => c + 1);
    paint(s.t, s.startFallen, next);
  };

  const togglePlaying = () => {
    const s = simRef.current;
    s.playing = !s.playing;
    setPlaying(s.playing);
  };

  const current = SCENES[scene];
  const isResult = stage === 'result';
  const hasPerson = scene === 'person';
  const hearing = hasPerson && isResult;
  const perception = AcousticPhysics.evaluatePerception(current.observer, isResult);

  return (
    <article className="experiment-card" id="canvas-arbol-bosque" ref={articleRef}>
      <div className="exp-header">
        <div className="exp-title-row">
          <span className="exp-tag">EXPERIMENTO 01</span>
          <h3 className="exp-title">El árbol que cae: ¿hace ruido si nadie lo escucha?</h3>
        </div>
        <div className={`ux-step-badge ${isResult ? 'completed' : ''} ${playing ? 'is-live' : ''}`}>
          <span className="pulse-beacon" />
          <span>
            ESCENA {current.letter} &bull; {playing ? 'Se reproduce sola' : 'En pausa'}
          </span>
        </div>
      </div>

      <div className="exp-body">
        {/* Controles mínimos: dos escenas, pausa y sonido */}
        <div className="forest-controls">
          <div className="protocol-grid forest-scenes">
            {Object.entries(SCENES).map(([id, sc]) => {
              const active = id === scene;
              return (
                <button
                  key={id}
                  type="button"
                  className={`protocol-tab ${active ? 'active-toggle' : ''}`}
                  aria-pressed={active}
                  onClick={() => selectScene(id)}
                >
                  {active && (
                    <motion.div
                      layoutId="presence-pill"
                      className="active-tab-indicator"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="protocol-kicker">Escena {sc.letter}</span>
                  <span className="protocol-name">{sc.name}</span>
                  <span className="scene-progress" aria-hidden="true">
                    <span ref={(el) => (progressRefs.current[id] = el)} />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="forest-actions">
            <button
              type="button"
              className="btn-icon-only"
              onClick={togglePlaying}
              aria-label={playing ? 'Pausar' : 'Reproducir'}
              title={playing ? 'Pausar' : 'Reproducir'}
            >
              {playing ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className="btn-pill"
              onClick={() => setSoundOn(!soundOn)}
              aria-pressed={soundOn}
              title="Oír el golpe en tus altavoces cuando hay alguien"
            >
              <span className="status-dot" style={{ background: soundOn ? 'var(--accent-amber)' : 'var(--text-muted)' }} />
              <span>{soundOn ? 'Sonido: sí' : 'Sonido: no'}</span>
            </button>
          </div>
        </div>

        {/* Diorama isométrico */}
        <div className="forest-stage">
          <svg
            className="forest-svg"
            viewBox="0 0 640 400"
            role="img"
            aria-label={`${current.name}. ${isResult ? current.result : current.intro}`}
          >
            <defs>
              <filter id="forest-soft" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.4" />
              </filter>
              <filter id="forest-blur-strong" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
              <radialGradient id="forest-key-light" cx="22%" cy="18%" r="70%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.16" />
                <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="forest-vignette" cx="50%" cy="48%" r="70%">
                <stop offset="65%" stopColor="#000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
              </radialGradient>
              <linearGradient id="forest-top-sheen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFF6D8" stopOpacity="0.14" />
                <stop offset="70%" stopColor="#FFF6D8" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="head-skin" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#F8E9D4" />
                <stop offset="55%" stopColor="#D8B28C" />
                <stop offset="100%" stopColor="#8E6748" />
              </radialGradient>
              <radialGradient id="head-hearing" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#FFF3C4" />
                <stop offset="55%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#B45309" />
              </radialGradient>
              <radialGradient id="ear-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
              <clipPath id="ground-clip">
                <polygon points={groundTop.map(pt).join(' ')} />
              </clipPath>
            </defs>

            {/* Luz ambiente cálida desde la fuente de luz */}
            <rect x="0" y="0" width="640" height="400" fill="url(#forest-key-light)" />

            {/* Título de la escena */}
            <text x="20" y="32" className="forest-title">
              Escena {current.letter} &middot; {current.name}
            </text>

            {/* Sombra del propio bloque sobre el fondo */}
            <polygon
              points={[iso(0.3, G.d, -G.t), iso(G.w, G.d, -G.t), iso(G.w, 0.3, -G.t), iso(G.w + 0.9, 0.6, -G.t - 0.25), iso(G.w + 0.6, G.d + 0.6, -G.t - 0.25), iso(0.6, G.d + 0.9, -G.t - 0.25)]
                .map(pt)
                .join(' ')}
              className="forest-slab-shadow"
              filter="url(#forest-blur-strong)"
            />

            {/* Bloque de tierra */}
            <Facets polys={SLAB} />
            <polygon points={groundTop.map(pt).join(' ')} fill="url(#forest-top-sheen)" />
            {STRATA.map(([a, b], i) => (
              <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="forest-strata" />
            ))}

            <g clipPath="url(#ground-clip)">
              {PATCHES.map((p, i) => (
                <polygon key={i} points={p} className="forest-patch" />
              ))}
              {TUFTS.map((tf, i) => {
                const [sx, sy] = iso(tf.x, tf.y, 0);
                return (
                  <path
                    key={i}
                    d={`M ${sx - 3} ${sy} L ${sx - 1} ${sy - 5} M ${sx} ${sy} L ${sx + 1} ${sy - 7} M ${sx + 3} ${sy} L ${sx + 4} ${sy - 4}`}
                    className="forest-tuft"
                  />
                );
              })}

              {/* Sombras proyectadas */}
              <g className="forest-cast" filter="url(#forest-soft)">
                {BACK_BAKED.map((t, i) => (
                  <path key={`bs${i}`} d={t.shadow} />
                ))}
                {FRONT_BAKED.map((t, i) => (
                  <path key={`fs${i}`} d={t.shadow} />
                ))}
                <path ref={mainShadowRef} d={MAIN_INITIAL.shadow} />
                <path d={PERSON_SHADOW} className="forest-presence" data-hidden={!hasPerson} />
              </g>

              {/* Ondas de aire sobre el suelo */}
              <ellipse
                ref={puffRef}
                cx={IMPACT_SCREEN[0]}
                cy={IMPACT_SCREEN[1]}
                rx="0"
                ry="0"
                className="forest-puff"
                filter="url(#forest-soft)"
                opacity="0"
              />
              {Array.from({ length: RING_COUNT }, (_, i) => (
                <g key={i}>
                  <ellipse
                    ref={(el) => (ringGlowRefs.current[i] = el)}
                    cx={IMPACT_SCREEN[0]}
                    cy={IMPACT_SCREEN[1]}
                    rx="0"
                    ry="0"
                    className="forest-ring-glow"
                    filter="url(#forest-soft)"
                    opacity="0"
                  />
                  <ellipse
                    ref={(el) => (ringRefs.current[i] = el)}
                    cx={IMPACT_SCREEN[0]}
                    cy={IMPACT_SCREEN[1]}
                    rx="0"
                    ry="0"
                    className="forest-ring"
                    opacity="0"
                  />
                </g>
              ))}
            </g>

            {/* Bosque de fondo (más fundido con el ambiente) */}
            {BACK_BAKED.map((t, i) => (
              <BakedTree key={`b${i}`} tree={t} />
            ))}

            {/* Árbol protagonista: un conjunto fijo de polígonos que el bucle reordena y sombrea */}
            <ellipse
              cx={iso(TREE_BASE.x, TREE_BASE.y)[0]}
              cy={iso(TREE_BASE.x, TREE_BASE.y)[1]}
              rx={groundEllipse(0.32).rx}
              ry={groundEllipse(0.32).ry}
              className="forest-contact"
            />
            {Array.from({ length: MAIN_FACE_COUNT }, (_, i) => {
              const p = MAIN_INITIAL.polys[i];
              return (
                <polygon
                  key={`m${i}`}
                  ref={(el) => (facetRefs.current[i] = el)}
                  points={p ? p.points : ''}
                  fill={p ? p.fill : 'none'}
                  stroke={p ? p.fill : 'none'}
                  strokeWidth="0.6"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* Lugar del oyente: persona o hueco vacío */}
            <g className="forest-presence" data-hidden={hasPerson}>
              <ellipse
                cx={P_FEET[0]}
                cy={P_FEET[1]}
                rx={groundEllipse(0.5).rx}
                ry={groundEllipse(0.5).ry}
                className="forest-empty-spot"
              />
              <text x={P_FEET[0]} y={P_FEET[1] + 30} textAnchor="middle" className="forest-note">
                aquí no hay nadie
              </text>
              {isResult && (
                <text key={`sil${cycle}`} x={P_FEET[0]} y={P_FEET[1] - 42} textAnchor="middle" className="forest-silence">
                  · · · silencio
                </text>
              )}
            </g>

            <g className="forest-presence" data-hidden={!hasPerson}>
              <ellipse
                cx={P_FEET[0]}
                cy={P_FEET[1]}
                rx={groundEllipse(0.28).rx}
                ry={groundEllipse(0.28).ry}
                className="forest-contact"
              />
              <Facets polys={PERSON_POLYS} />
              {/* Cabeza: brilla cuando el cerebro convierte el aire en sonido */}
              <circle cx={P_HEAD[0]} cy={P_HEAD[1]} r={P_HEAD_R * 3.2} fill="url(#ear-glow)" className="person-glow" data-on={hearing} />
              <circle cx={P_HEAD[0]} cy={P_HEAD[1]} r={P_HEAD_R} fill="url(#head-skin)" />
              <circle cx={P_HEAD[0]} cy={P_HEAD[1]} r={P_HEAD_R} fill="url(#head-hearing)" className="person-glow" data-on={hearing} />
              <path d={`M ${P_EAR[0] + 1.5} ${P_EAR[1] - 3} a 3 3 0 1 0 0 6`} className="person-ear" data-on={hearing} />
              {hearing && (
                <g key={`pum${cycle}`}>
                  {[8, 13, 18].map((R, i) => (
                    <path key={R} d={soundArc(R)} className="sound-mark" style={{ animationDelay: `${i * 70}ms` }} />
                  ))}
                  <text x={P_HEAD[0]} y={P_HEAD[1] - 24} textAnchor="middle" className="pum-label">
                    ¡PUM!
                  </text>
                </g>
              )}
            </g>

            {/* Bosque delantero */}
            {FRONT_BAKED.map((t, i) => (
              <BakedTree key={`f${i}`} tree={t} />
            ))}

            {/* Viñeta para centrar la mirada */}
            <rect x="0" y="0" width="640" height="400" fill="url(#forest-vignette)" pointerEvents="none" />

            {/* Leyenda */}
            <g transform="translate(20 380)" className="forest-legend">
              <ellipse cx="9" cy="0" rx="9" ry="4" className="forest-ring" opacity="0.95" />
              <text x="26" y="4">ondas de aire</text>
              <circle cx="128" cy="0" r="5" className="legend-sound" />
              <text x="140" y="4">sonido (dentro del cerebro)</text>
            </g>
          </svg>
        </div>

        {/* Lectura de la escena */}
        <div className="forest-caption" aria-live="polite">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.p
              key={`${scene}-${isResult}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] } }}
              exit={{ opacity: 0, transition: { duration: 0.12, ease: [0.23, 1, 0.32, 1] } }}
              className={isResult ? 'is-result' : ''}
              data-scene={scene}
            >
              {isResult ? current.result : current.intro}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="telemetry-row">
          <div className="telemetry-pill">
            <span>¿SE MUEVE EL AIRE?</span>
            <strong style={{ color: 'var(--accent-cyan)' }}>
              {stage === 'ready' ? 'Todavía no' : 'Sí, las ondas empujan el aire'}
            </strong>
          </div>
          <div className="telemetry-pill">
            <span>¿HAY RUIDO?</span>
            <strong style={{ color: perception.themeColor }}>{isResult ? perception.soundStatus : 'Esperando…'}</strong>
          </div>
        </div>

        <div className="readout-box" style={{ marginTop: '16px' }}>
          <strong>¿Por qué pasa esto?</strong>{' '}
          {hasPerson ? (
            <span>
              Cuando hay una persona, las ondas de aire golpean su tímpano y su cerebro las convierte en la
              sensación que llamamos <strong>«ruido»</strong>. El ruido no está flotando en el bosque: lo fabrica
              el cerebro al recibir el golpe de aire.
            </span>
          ) : (
            <span>
              El árbol cae y empuja el aire con fuerza, creando ondas físicas. Pero si no hay ningún oído ni
              cerebro para recibirlas, <strong>el bosque cae en silencio absoluto</strong>. Confundir las ondas de
              aire con la sensación de «oír un ruido» es el clásico error de nuestro egocentrismo humano.
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
