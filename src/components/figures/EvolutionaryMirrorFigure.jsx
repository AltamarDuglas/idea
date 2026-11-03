'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EvolutionaryContinuityService } from '../../domain/services/EvolutionaryContinuityService';
import {
  iso,
  pt,
  groundEllipse,
  shadeFaces,
  castShadowPath,
  groundSlab,
  buildPineModel,
  placeModel,
  buildFlyModel,
  buildPersonModel,
  rotateZ,
  lcg,
} from '../../domain/services/IsoEngine';

/**
 * COMPONENTE: EvolutionaryMirrorFigure (Experimento 04)
 *
 * Diorama isométrico (mismo motor y luz que los Experimentos 01–03). La misma sombra (cian) pasa
 * sobre una mosca, sobre una persona y, al final, sobre las dos a la vez. Encima de cada una flota
 * su circuito de alarma: la señal (ámbar) recorre el mismo camino antiguo — ojos → centro de
 * alarma → cuerpo — en las dos. Solo en la persona se enciende además una capa de arriba, la
 * corteza, que convierte el susto en palabras. El espejo: compartimos la raíz, no la narración.
 */

// --------------------------------------------------------------------------
// Escenografía
// --------------------------------------------------------------------------
const G = { w: 10, d: 6, t: 0.7 };
const groundTop = [iso(0, 0), iso(G.w, 0), iso(G.w, G.d), iso(0, G.d)];
const SLAB = groundSlab(G.w, G.d, G.t);
const STRATA = [-0.34, -0.52].flatMap((z) => [
  [iso(0, G.d, z), iso(G.w, G.d, z)],
  [iso(G.w, 0, z), iso(G.w, G.d, z)],
]);
const poly = (pts3d) => pts3d.map((p) => pt(iso(p[0], p[1], p[2]))).join(' ');
const O = iso(0, 0, 0);
const lerp = (a, b, p) => a + (b - a) * p;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Dos pinos en las esquinas delanteras, lejos de los circuitos flotantes
const PINES = [
  { x: 0.6, y: 5.4, s: 0.6, seed: 11 },
  { x: 9.5, y: 4.6, s: 0.62, seed: 37 },
].map((t) => {
  const placed = placeModel(buildPineModel(t.seed, t.s), t, 0);
  return { polys: shadeFaces(placed.faces), shadow: castShadowPath(placed.verts) };
});

// La mosca, grande y de perfil
const FLY_POS = { x: 2.7, y: 3.5 };
const FLY_TURN = 0; // de perfil, mirando hacia la persona
const FLY = buildFlyModel(4.2);
const flyPlace = (p) => {
  const r = rotateZ(p, FLY_TURN);
  return [r[0] + FLY_POS.x, r[1] + FLY_POS.y, r[2]];
};
const FLY_FACES = FLY.faces.map((f) => ({ pts: f.pts.map(flyPlace), hint: rotateZ(f.hint, FLY_TURN), mat: f.mat }));
const FLY_POLYS = shadeFaces(FLY_FACES);
const FLY_SHADOW = castShadowPath(FLY_FACES.flatMap((f) => f.pts));
const FLY_EYES = FLY.eyes.map((e) => iso(...flyPlace(e)));
const FLY_WINGS = FLY.wings.map((w) => w.map((p) => pt(iso(...flyPlace(p)))).join(' '));
const FLY_HEAD = iso(...flyPlace([0.2 * 4.2, 0, 0.16 * 4.2]));

// La persona
const HUM_POS = { x: 7.3, y: 3.4 };
const PERSON = buildPersonModel();
const HUM_FACES = PERSON.faces.map((f) => ({
  pts: f.pts.map((p) => [p[0] + HUM_POS.x, p[1] + HUM_POS.y, p[2]]),
  hint: f.hint,
  mat: f.mat,
}));
const HUM_POLYS = shadeFaces(HUM_FACES);
const HUM_SHADOW = castShadowPath([
  ...HUM_FACES.flatMap((f) => f.pts),
  [HUM_POS.x, HUM_POS.y, PERSON.headZ + PERSON.headR],
]);
const HUM_HEAD = iso(HUM_POS.x, HUM_POS.y, PERSON.headZ);
const HUM_HEAD_R = PERSON.headR * 34;

// --------------------------------------------------------------------------
// Circuitos de alarma flotando sobre cada organismo
// --------------------------------------------------------------------------
// Camino común: S (ojos) → H (centro de alarma) → M (cuerpo). Coordenadas relativas al centro de la placa.
const CORE = [
  [-0.95, 0.15],
  [0, -0.1],
  [0.95, 0.2],
];

function buildCircuit(center, z, extra, seed, labelCorner, w = 2.6, d = 1.8) {
  const rand = lcg(seed);
  const at = ([u, v]) => iso(center.x + u, center.y + v, z);
  const core = CORE.map(at);
  const others = Array.from({ length: extra }, () => at([(rand() - 0.5) * (w - 0.5), (rand() - 0.5) * (d - 0.5)]));
  const tile = poly([
    [center.x - w / 2, center.y - d / 2, z],
    [center.x + w / 2, center.y - d / 2, z],
    [center.x + w / 2, center.y + d / 2, z],
    [center.x - w / 2, center.y + d / 2, z],
  ]);
  // Neuronas secundarias unidas a su vecino más cercano del camino común (contexto, no se encienden)
  const links = others.map((o) => {
    const near = core.reduce((best, c) => (Math.hypot(c[0] - o[0], c[1] - o[1]) < Math.hypot(best[0] - o[0], best[1] - o[1]) ? c : best));
    return [o, near];
  });
  const label = labelCorner === 'left' ? iso(center.x - w / 2, center.y + d / 2, z) : iso(center.x + w / 2, center.y - d / 2, z);
  return { core, others, tile, links, label, labelAnchor: labelCorner === 'left' ? 'end' : 'start' };
}

const FLY_CIRCUIT = buildCircuit({ x: 2.5, y: 3.0 }, 2.55, 6, 5, 'left');
const HUM_CIRCUIT = buildCircuit({ x: 7.4, y: 3.0 }, 3.4, 8, 9, 'right');

// Corteza: una placa más amplia encima del circuito humano
const CORTEX_C = { x: 7.4, y: 3.0 };
const CORTEX_Z = 4.45;
const CORTEX = (() => {
  const rand = lcg(17);
  const w = 3.0;
  const d = 2.0;
  const nodes = Array.from({ length: 16 }, () =>
    iso(CORTEX_C.x + (rand() - 0.5) * (w - 0.4), CORTEX_C.y + (rand() - 0.5) * (d - 0.4), CORTEX_Z)
  ).sort((a, b) => a[0] - b[0]);
  const links = nodes.slice(1).map((n, i) => [nodes[i], n]);
  const tile = poly([
    [CORTEX_C.x - w / 2, CORTEX_C.y - d / 2, CORTEX_Z],
    [CORTEX_C.x + w / 2, CORTEX_C.y - d / 2, CORTEX_Z],
    [CORTEX_C.x + w / 2, CORTEX_C.y + d / 2, CORTEX_Z],
    [CORTEX_C.x - w / 2, CORTEX_C.y + d / 2, CORTEX_Z],
  ]);
  return { nodes, links, tile, label: iso(CORTEX_C.x - w / 2, CORTEX_C.y - d / 2, CORTEX_Z) };
})();

// --------------------------------------------------------------------------
// Línea de tiempo (la misma sombra para todos)
// --------------------------------------------------------------------------
const SHADOW = { start: 1200, dur: 900, x0: -0.5, x1: 11 };
// La señal empieza en cada organismo cuando el borde de la sombra le pasa por encima
const arrival = (x) => SHADOW.start + ((x - SHADOW.x0) / (SHADOW.x1 - SHADOW.x0)) * SHADOW.dur;
const SIG = { hop: 380, cortexStep: 50 };
const FLY_T0 = arrival(FLY_POS.x);
const HUM_T0 = arrival(HUM_POS.x);
const T = { result: HUM_T0 + 2 * SIG.hop + 16 * SIG.cortexStep + 300 };
T.end = T.result + 6000; // 6 s para leer el resultado
const STATIC_T = T.result + 500;

const SCENES = {
  fly: {
    letter: 'A',
    name: 'Una mosca',
    tag: '140.000 neuronas',
    intro: 'Escena A: una mosca. Pasa una sombra por encima… mira qué se enciende dentro.',
    result: 'La señal recorre un circuito antiguo: ojos → centro de alarma → cuerpo. Salta. Sin palabras, pero con el mismo miedo de fondo.',
    eye: 'Ojos → alarma → salto',
  },
  human: {
    letter: 'B',
    name: 'Una persona',
    tag: '86.000 millones de neuronas',
    intro: 'Escena B: una persona. La misma sombra.',
    result: 'Se enciende el mismo circuito antiguo y su cuerpo se encoge. Después, la corteza le pone palabras: «¡qué susto!».',
    eye: 'El mismo camino… y además palabras',
  },
  mirror: {
    letter: 'C',
    name: 'El espejo',
    tag: 'las dos a la vez',
    intro: 'Escena C: las dos a la vez, ante la misma sombra.',
    result: 'El mismo camino se enciende en las dos. Lo que nos diferencia es la capa de arriba, la que narra. ¿Proyectamos nuestra humanidad… o compartimos la misma herida?',
    eye: 'Misma raíz, distinta narración',
  },
};
const ORDER = ['fly', 'human', 'mirror'];
const showsFly = (scene) => scene !== 'human';
const showsHuman = (scene) => scene !== 'fly';

const READOUT = {
  fly: 'La mosca tiene apenas 140.000 neuronas, pero su circuito de alarma hace lo mismo que el nuestro: detecta la amenaza, enciende la alerta y mueve el cuerpo. Una mirada mecanicista diría que es solo un algoritmo de escape.',
  human:
    'Nuestro cerebro tiene 86.000 millones de neuronas. Debajo de todas ellas sigue funcionando el mismo circuito antiguo de alarma; encima, la corteza convierte el susto en una historia que podemos contar.',
  mirror: EvolutionaryContinuityService.evaluateStance(50).text,
};

function Facets({ polys }) {
  return polys.map((p, i) => (
    <polygon key={i} points={p.points} fill={p.fill} stroke={p.fill} strokeWidth="0.6" strokeLinejoin="round" />
  ));
}

function Circuit({ circuit, refs, label }) {
  return (
    <g>
      <polygon points={circuit.tile} className="mirror-tile" />
      {circuit.links.map(([a, b], i) => (
        <line key={`l${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="mirror-edge" />
      ))}
      {circuit.others.map((o, i) => (
        <circle key={`o${i}`} cx={o[0]} cy={o[1]} r="2.6" className="mirror-node is-minor" />
      ))}
      {[0, 1].map((i) => (
        <line
          key={`c${i}`}
          ref={(el) => (refs.edges[i] = el)}
          x1={circuit.core[i][0]}
          y1={circuit.core[i][1]}
          x2={circuit.core[i + 1][0]}
          y2={circuit.core[i + 1][1]}
          className="mirror-edge is-core"
          data-on="false"
        />
      ))}
      {circuit.core.map((c, i) => (
        <circle key={`n${i}`} ref={(el) => (refs.nodes[i] = el)} cx={c[0]} cy={c[1]} r="4.5" className="mirror-node" data-on="false" />
      ))}
      <circle ref={(el) => (refs.pulse = el)} r="3.5" className="mirror-pulse" opacity="0" />
      <text
        x={circuit.label[0] + (circuit.labelAnchor === 'end' ? -8 : 8)}
        y={circuit.label[1] + 4}
        textAnchor={circuit.labelAnchor}
        className="forest-note"
      >
        {label}
      </text>
    </g>
  );
}

// --------------------------------------------------------------------------
// Componente
// --------------------------------------------------------------------------
export function EvolutionaryMirrorFigure() {
  const [scene, setScene] = useState('fly');
  const [stage, setStage] = useState('ready'); // ready | signal | result
  const [cycle, setCycle] = useState(0);
  const [playing, setPlaying] = useState(true);

  const reduceMotion = useReducedMotion();
  const articleRef = useRef(null);

  const flyRefs = useRef({ nodes: [], edges: [], pulse: null });
  const humRefs = useRef({ nodes: [], edges: [], pulse: null });
  const cortexRefs = useRef([]);
  const cortexEdgeRefs = useRef([]);
  const flyBodyRef = useRef(null);
  const humBodyRef = useRef(null);
  const shadowBandRef = useRef(null);
  const shadowEdgeRef = useRef(null);
  const progressRefs = useRef({});

  const simRef = useRef({ t: 0, scene: 'fly', stage: 'ready', playing: true, visible: false, seen: false });

  useEffect(() => {
    if (!reduceMotion) return;
    const s = simRef.current;
    s.playing = false;
    s.t = STATIC_T;
    setPlaying(false);
  }, [reduceMotion]);

  const paint = useCallback((t, currentScene) => {
    // La señal recorre S → H → M a partir de t0
    const runCircuit = (refs, circuit, t0) => {
      const k = t - t0;
      refs.nodes.forEach((n, i) => n?.setAttribute('data-on', k >= i * SIG.hop ? 'true' : 'false'));
      refs.edges.forEach((e, i) => e?.setAttribute('data-on', k >= (i + 1) * SIG.hop ? 'true' : 'false'));
      const seg = k / SIG.hop;
      if (refs.pulse) {
        if (seg < 0 || seg >= 2) {
          refs.pulse.setAttribute('opacity', 0);
        } else {
          const i = Math.floor(seg);
          const f = seg - i;
          const a = circuit.core[i];
          const b = circuit.core[i + 1];
          refs.pulse.setAttribute('cx', lerp(a[0], b[0], f).toFixed(1));
          refs.pulse.setAttribute('cy', lerp(a[1], b[1], f).toFixed(1));
          refs.pulse.setAttribute('opacity', 1);
        }
      }
      return k - 2 * SIG.hop; // tiempo desde que la alarma llegó al cuerpo
    };

    const flyK = runCircuit(flyRefs.current, FLY_CIRCUIT, FLY_T0);
    const humK = runCircuit(humRefs.current, HUM_CIRCUIT, HUM_T0);

    // Reacción del cuerpo: la mosca salta, la persona se encoge
    if (flyBodyRef.current) {
      const hop = flyK > 0 && flyK < 420 ? Math.sin((flyK / 420) * Math.PI) * 0.7 * 34 : 0;
      flyBodyRef.current.setAttribute('transform', `translate(0 ${(-hop).toFixed(1)})`);
    }
    if (humBodyRef.current) {
      const duck = humK > 0 ? Math.min(1, humK / 160) * (humK < 900 ? 1 : Math.max(0, 1 - (humK - 900) / 500)) : 0;
      const shake = humK > 0 && humK < 400 ? Math.sin(humK / 25) * 1.5 : 0;
      humBodyRef.current.setAttribute('transform', `translate(${shake.toFixed(1)} ${(duck * 5).toFixed(1)})`);
    }

    // Corteza: solo la persona; se enciende después del cuerpo, neurona a neurona
    cortexRefs.current.forEach((n, i) => n?.setAttribute('data-on', humK >= i * SIG.cortexStep ? 'true' : 'false'));
    cortexEdgeRefs.current.forEach((e, i) => e?.setAttribute('data-on', humK >= (i + 1) * SIG.cortexStep ? 'true' : 'false'));

    // La misma sombra cruzando todo el claro
    const k = (t - SHADOW.start) / SHADOW.dur;
    if (k < 0 || k > 1) {
      shadowBandRef.current?.setAttribute('opacity', 0);
      shadowEdgeRef.current?.setAttribute('opacity', 0);
    } else {
      const sx = lerp(SHADOW.x0, SHADOW.x1, k);
      shadowBandRef.current?.setAttribute('points', poly([[sx - 1.8, 0, 0], [sx, 0, 0], [sx, G.d, 0], [sx - 1.8, G.d, 0]]));
      shadowBandRef.current?.setAttribute('opacity', 1);
      const a = iso(sx, 0, 0);
      const b = iso(sx, G.d, 0);
      shadowEdgeRef.current?.setAttribute('x1', a[0]);
      shadowEdgeRef.current?.setAttribute('y1', a[1]);
      shadowEdgeRef.current?.setAttribute('x2', b[0]);
      shadowEdgeRef.current?.setAttribute('y2', b[1]);
      shadowEdgeRef.current?.setAttribute('opacity', 1);
    }

    const bar = progressRefs.current[currentScene];
    if (bar) bar.style.transform = `scaleX(${Math.min(1, t / T.end)})`;
    ORDER.filter((id) => id !== currentScene).forEach((id) => {
      if (progressRefs.current[id]) progressRefs.current[id].style.transform = 'scaleX(0)';
    });
  }, []);

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
          s.scene = ORDER[(ORDER.indexOf(s.scene) + 1) % ORDER.length];
          setScene(s.scene);
          setCycle((c) => c + 1);
        }
      }

      const nextStage = s.t < SHADOW.start ? 'ready' : s.t < T.result ? 'signal' : 'result';
      if (nextStage !== s.stage) {
        s.stage = nextStage;
        setStage(nextStage);
      }

      if (s.visible) paint(s.t, s.scene);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paint]);

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
    paint(s.t, next);
  };

  const togglePlaying = () => {
    const s = simRef.current;
    s.playing = !s.playing;
    setPlaying(s.playing);
  };

  const current = SCENES[scene];
  const isResult = stage === 'result';

  return (
    <article className="experiment-card" id="espejo-evolutivo" ref={articleRef}>
      <div className="exp-header">
        <div className="exp-title-row">
          <span className="exp-tag">EXPERIMENTO 04</span>
          <h3 className="exp-title">El espejo: ¿el mismo miedo en una mosca y en ti?</h3>
        </div>
        <div className={`ux-step-badge ${isResult ? 'completed' : ''} ${playing ? 'is-live' : ''}`}>
          <span className="pulse-beacon" />
          <span>
            ESCENA {current.letter} &bull; {playing ? 'Se reproduce sola' : 'En pausa'}
          </span>
        </div>
      </div>

      <div className="exp-body">
        <div className="forest-controls">
          <div className="protocol-grid forest-scenes mirror-scenes">
            {ORDER.map((id) => {
              const sc = SCENES[id];
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
                      layoutId="mirror-pill"
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
          </div>
        </div>

        <div className="forest-stage">
          <svg
            className="forest-svg"
            viewBox="0 0 640 400"
            role="img"
            aria-label={`${current.name}. ${isResult ? current.result : current.intro}`}
          >
            <defs>
              <filter id="mirror-soft" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.4" />
              </filter>
              <filter id="mirror-blur-strong" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
              <filter id="mirror-shadow-blur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
              <radialGradient id="mirror-key-light" cx="22%" cy="18%" r="70%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.16" />
                <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="mirror-vignette" cx="50%" cy="48%" r="70%">
                <stop offset="65%" stopColor="#000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
              </radialGradient>
              <linearGradient id="mirror-top-sheen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFF6D8" stopOpacity="0.14" />
                <stop offset="70%" stopColor="#FFF6D8" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="mirror-head" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#F8E9D4" />
                <stop offset="55%" stopColor="#D8B28C" />
                <stop offset="100%" stopColor="#8E6748" />
              </radialGradient>
              <clipPath id="mirror-ground-clip">
                <polygon points={groundTop.map(pt).join(' ')} />
              </clipPath>
            </defs>

            <rect x="0" y="0" width="640" height="400" fill="url(#mirror-key-light)" />

            <text x="20" y="32" className="forest-title">
              Escena {current.letter} &middot; {current.name}
            </text>
            <text x="20" y="52" className="forest-note">
              {current.tag}
            </text>

            {/* Claro del bosque */}
            <polygon
              points={[iso(0.3, G.d, -G.t), iso(G.w, G.d, -G.t), iso(G.w, 0.3, -G.t), iso(G.w + 0.9, 0.6, -G.t - 0.25), iso(G.w + 0.6, G.d + 0.6, -G.t - 0.25), iso(0.6, G.d + 0.9, -G.t - 0.25)]
                .map(pt)
                .join(' ')}
              className="forest-slab-shadow"
              filter="url(#mirror-blur-strong)"
            />
            <Facets polys={SLAB} />
            <polygon points={groundTop.map(pt).join(' ')} fill="url(#mirror-top-sheen)" />
            {STRATA.map(([a, b], i) => (
              <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="forest-strata" />
            ))}

            <g clipPath="url(#mirror-ground-clip)">
              <g className="forest-cast" filter="url(#mirror-soft)">
                {PINES.map((p, i) => (
                  <path key={i} d={p.shadow} />
                ))}
                <path d={FLY_SHADOW} className="forest-presence" data-hidden={!showsFly(scene)} />
                <path d={HUM_SHADOW} className="forest-presence" data-hidden={!showsHuman(scene)} />
              </g>
              {/* La misma sombra para todos (cian) */}
              <polygon ref={shadowBandRef} className="arena-shadow-band" filter="url(#mirror-shadow-blur)" opacity="0" />
              <line ref={shadowEdgeRef} className="arena-shadow-edge" opacity="0" />
            </g>

            {/* La mosca y su circuito */}
            <g className="forest-presence" data-hidden={!showsFly(scene)}>
              <line x1={FLY_HEAD[0]} y1={FLY_HEAD[1]} x2={FLY_CIRCUIT.core[0][0]} y2={FLY_CIRCUIT.core[0][1]} className="mirror-tether" />
              <g ref={flyBodyRef}>
                <Facets polys={FLY_POLYS} />
                {FLY_EYES.map((e, i) => (
                  <circle key={i} cx={e[0]} cy={e[1]} r="4" className="umwelt-eye" />
                ))}
                {FLY_WINGS.map((w, i) => (
                  <polygon key={i} points={w} className="umwelt-wing" opacity="0.65" />
                ))}
              </g>
              <Circuit circuit={FLY_CIRCUIT} refs={flyRefs.current} label="mosca · 140.000 neuronas" />
            </g>

            {/* La persona, su circuito y la corteza */}
            <g className="forest-presence" data-hidden={!showsHuman(scene)}>
              <line x1={HUM_HEAD[0]} y1={HUM_HEAD[1] - HUM_HEAD_R} x2={HUM_CIRCUIT.core[0][0]} y2={HUM_CIRCUIT.core[0][1]} className="mirror-tether" />
              <g ref={humBodyRef}>
                <ellipse
                  cx={iso(HUM_POS.x, HUM_POS.y)[0]}
                  cy={iso(HUM_POS.x, HUM_POS.y)[1]}
                  rx={groundEllipse(0.28).rx}
                  ry={groundEllipse(0.28).ry}
                  className="forest-contact"
                />
                <Facets polys={HUM_POLYS} />
                <circle cx={HUM_HEAD[0]} cy={HUM_HEAD[1]} r={HUM_HEAD_R} fill="url(#mirror-head)" />
              </g>
              <Circuit circuit={HUM_CIRCUIT} refs={humRefs.current} label="persona · circuito antiguo" />

              <g>
                <polygon points={CORTEX.tile} className="mirror-tile is-cortex" />
                {CORTEX.links.map(([a, b], i) => (
                  <line
                    key={`cl${i}`}
                    ref={(el) => (cortexEdgeRefs.current[i] = el)}
                    x1={a[0]}
                    y1={a[1]}
                    x2={b[0]}
                    y2={b[1]}
                    className="mirror-edge is-cortex"
                    data-on="false"
                  />
                ))}
                {CORTEX.nodes.map((n, i) => (
                  <circle key={`cn${i}`} ref={(el) => (cortexRefs.current[i] = el)} cx={n[0]} cy={n[1]} r="3" className="mirror-node is-cortex" data-on="false" />
                ))}
                <line
                  x1={HUM_CIRCUIT.core[1][0]}
                  y1={HUM_CIRCUIT.core[1][1]}
                  x2={CORTEX.nodes[7][0]}
                  y2={CORTEX.nodes[7][1]}
                  className="mirror-tether"
                />
                <text x={CORTEX.label[0]} y={CORTEX.label[1] - 8} className="forest-note">
                  corteza · 86.000 millones · pone palabras
                </text>
              </g>

              {isResult && (
                <text key={`say${cycle}`} x={HUM_HEAD[0] + 18} y={HUM_HEAD[1] + 4} className="pum-label">
                  «¡qué susto!»
                </text>
              )}
            </g>

            {PINES.map((p, i) => (
              <Facets key={i} polys={p.polys} />
            ))}

            {isResult && showsFly(scene) && (
              <text key={`fly${cycle}`} x={FLY_HEAD[0] - 70} y={FLY_HEAD[1] + 34} textAnchor="end" className="pum-label">
                (sin palabras)
              </text>
            )}

            <rect x="0" y="0" width="640" height="400" fill="url(#mirror-vignette)" pointerEvents="none" />

            <g transform="translate(20 380)" className="forest-legend">
              <line x1="0" y1="0" x2="18" y2="0" className="arena-shadow-edge" />
              <text x="26" y="4">la misma amenaza</text>
              <circle cx="140" cy="0" r="5" className="legend-sound" />
              <text x="152" y="4">la alarma por dentro (ojos → alarma → cuerpo)</text>
            </g>
          </svg>
        </div>

        <div className="forest-caption" aria-live="polite">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.p
              key={`${scene}-${isResult}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] } }}
              exit={{ opacity: 0, transition: { duration: 0.12, ease: [0.23, 1, 0.32, 1] } }}
              className={isResult ? 'is-result' : ''}
              data-scene="person"
            >
              {isResult ? current.result : current.intro}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="telemetry-row">
          <div className="telemetry-pill">
            <span>¿LA AMENAZA ES LA MISMA?</span>
            <strong style={{ color: 'var(--accent-cyan)' }}>Sí, la misma sombra</strong>
          </div>
          <div className="telemetry-pill">
            <span>¿QUÉ SE ENCIENDE DENTRO?</span>
            <strong style={{ color: 'var(--accent-amber)' }}>{stage === 'ready' ? 'Todavía nada' : current.eye}</strong>
          </div>
        </div>

        <div className="readout-box" style={{ marginTop: '16px', borderColor: 'var(--accent-amber-border)' }}>
          <strong>¿Por qué pasa esto?</strong> {READOUT[scene]}
        </div>
      </div>
    </article>
  );
}
