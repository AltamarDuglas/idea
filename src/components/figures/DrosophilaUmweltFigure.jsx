'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  iso,
  pt,
  shadeFaces,
  castShadowPath,
  silhouettePath,
  box,
  cylinder,
  bicone,
  buildFlyModel,
  SHADOW_DX,
  SHADOW_DY,
  easeInOutCubic,
} from '../../domain/services/IsoEngine';

/**
 * COMPONENTE: DrosophilaUmweltFigure (Experimento 02)
 *
 * Diorama isométrico (mismo motor y luz que el Experimento 01) que se reproduce solo y alterna:
 * - Escena A: una mano intenta atrapar a una mosca, vista con ojos humanos (~60 imágenes/s).
 * - Escena B: la misma mano, vista con ojos de mosca (hasta 250 imágenes/s): cámara lenta ×4.
 *
 * Lo físico (cian) es idéntico en ambas: la trayectoria real de la mano y el momento en que la
 * mosca despega. Lo vivido (ámbar) cambia: las "imágenes" que capta cada ojo, dibujadas como
 * siluetas fantasma de la mano. Pocas y separadas = borrón; muchas y juntas = cámara lenta.
 */

// --------------------------------------------------------------------------
// Escenografía: una mesa de madera con un bodegón
// --------------------------------------------------------------------------
const TABLE = { w: 10, d: 6, t: 0.5 };
const O = iso(0, 0, 0);
const screenOffset = (x, y, z) => {
  const p = iso(x, y, z);
  return [p[0] - O[0], p[1] - O[1]];
};

const tableTop = [iso(0, 0), iso(TABLE.w, 0), iso(TABLE.w, TABLE.d), iso(0, TABLE.d)];
const TABLE_POLYS = shadeFaces([
  { pts: [[0, 0, 0], [TABLE.w, 0, 0], [TABLE.w, TABLE.d, 0], [0, TABLE.d, 0]], hint: [0, 0, 1], mat: 'wood' },
  { pts: [[TABLE.w, 0, 0], [TABLE.w, TABLE.d, 0], [TABLE.w, TABLE.d, -TABLE.t], [TABLE.w, 0, -TABLE.t]], hint: [1, 0, 0], mat: 'wood' },
  { pts: [[0, TABLE.d, 0], [TABLE.w, TABLE.d, 0], [TABLE.w, TABLE.d, -TABLE.t], [0, TABLE.d, -TABLE.t]], hint: [0, 1, 0], mat: 'wood' },
]);
const PLANKS = [1.2, 2.4, 3.6, 4.8].map((y) => [iso(0, y, 0), iso(TABLE.w, y, 0)]);

// Bodegón: taza al fondo, plato con fruta y libro delante (lejos del recorrido de la mano)
const MUG = [
  ...cylinder(8.7, 1.3, 0.38, 0, 0.85, 12, 'ceramic', 'flyBody'),
  ...box(9.08, 9.26, 1.25, 1.35, 0.25, 0.62, 'ceramic'),
];
const PLATE = cylinder(5.6, 4.7, 0.85, 0, 0.07, 14, 'ceramic');
const FRUIT = [
  ...bicone(5.35, 4.55, 0.32, 0.07, 0.62, 8, 'fruitRed', 3),
  ...bicone(5.98, 4.88, 0.3, 0.07, 0.58, 8, 'fruitGreen', 9),
  ...box(5.33, 5.37, 4.53, 4.57, 0.69, 0.84, 'trunk'),
];
const BOOK = [
  ...box(1.2, 2.6, 4.4, 5.4, 0, 0.05, 'book'),
  ...box(1.26, 2.54, 4.44, 5.36, 0.05, 0.23, 'ceramic'),
  ...box(1.2, 2.6, 4.4, 5.4, 0.23, 0.28, 'book'),
];
const BACK_POLYS = shadeFaces(MUG);
const FRONT_POLYS = shadeFaces([...PLATE, ...FRUIT, ...BOOK]);
const STATIC_SHADOWS = [MUG, PLATE, FRUIT, BOOK].map((faces) => castShadowPath(faces.flatMap((f) => f.pts)));

// --------------------------------------------------------------------------
// La mano (prismas) y la mosca, modeladas en el origen y desplazadas por el bucle
// --------------------------------------------------------------------------
const HAND_FACES = [
  ...box(-1.6, -0.05, -0.34, 0.34, 0, 0.34, 'jacket'),
  ...box(0, 0.85, -0.42, 0.42, 0.02, 0.26, 'skin'),
  ...[0, 1, 2, 3].flatMap((k) => {
    const y = -0.3 + k * 0.2;
    return box(0.85, 1.45 - Math.abs(k - 1.5) * 0.08, y - 0.075, y + 0.075, 0.05, 0.2, 'skin');
  }),
  ...box(0.35, 0.85, -0.6, -0.44, 0.06, 0.22, 'skin'),
];
const HAND_POLYS = shadeFaces(HAND_FACES);
const HAND_VERTS = HAND_FACES.flatMap((f) => f.pts);
const HAND_SILHOUETTE = silhouettePath(HAND_VERTS);
const HAND_SHADOW = castShadowPath(HAND_VERTS);
const TIP = [1.45, 0, 0.12];

const FLY = buildFlyModel(1.8);
const FLY_FACES = FLY.faces;
const FLY_POLYS = shadeFaces(FLY_FACES);
const FLY_SHADOW = castShadowPath(FLY_FACES.flatMap((f) => f.pts));
const FLY_EYES = FLY.eyes.map((p) => iso(p[0], p[1], p[2]));
const FLY_WINGS = FLY.wings.map((w) => w.map((p) => pt(iso(p[0], p[1], p[2]))).join(' '));

// --------------------------------------------------------------------------
// Física (idéntica en las dos escenas) y línea de tiempo
// --------------------------------------------------------------------------
const lerp = (a, b, p) => a + (b - a) * p;

// La mano barre en picado a velocidad constante a lo largo de su recorrido
const handAt = (p) => [lerp(1.4, 4.85, p), 3, 0.2 + 1.9 * (1 - p) * (1 - p)];

const F0 = [6.6, 3, 0];
const F1 = [8.6, 1.0, 2.6];
const flyAt = (q) => {
  const e = 1 - (1 - q) * (1 - q); // despegue explosivo
  return [lerp(F0[0], F1[0], e), lerp(F0[1], F1[1], e), F0[2] + (F1[2] - F0[2]) * Math.sin((e * Math.PI) / 2)];
};

// Tiempos físicos (ms reales del suceso)
const ACT = { swoop: 700, takeoff: 330, flight: 450 };
ACT.end = Math.max(ACT.swoop, ACT.takeoff + ACT.flight);

// Trayectoria real de la punta de los dedos (cian) y su sombra sobre la mesa
const TRAJECTORY = Array.from({ length: 25 }, (_, i) => {
  const h = handAt(i / 24);
  return [h[0] + TIP[0], h[1] + TIP[1], h[2] + TIP[2]];
});
const TRAJECTORY_PTS = TRAJECTORY.map((p) => pt(iso(p[0], p[1], p[2]))).join(' ');
const TRAJECTORY_SHADOW_PTS = TRAJECTORY.map((p) => pt(iso(p[0] + p[2] * SHADOW_DX, p[1] + p[2] * SHADOW_DY, 0))).join(' ');
const ESCAPE_PTS = Array.from({ length: 13 }, (_, i) => {
  const f = flyAt(i / 12);
  return pt(iso(f[0], f[1], f[2] + 0.2));
}).join(' ');

const GHOST_POOL = 18;

const SCENES = {
  human: {
    letter: 'A',
    name: 'Ojos humanos',
    tag: 'unas 60 imágenes por segundo',
    slow: 1, // la escena se reproduce a velocidad real
    frameEvery: 160, // ms reales entre imagen e imagen (artístico, proporcional a 60 Hz)
    intro: 'Escena A: miramos con ojos humanos, unas 60 imágenes por segundo.',
    result: '¡Zas! La mano pasa como un borrón y la mosca parece desaparecer por arte de magia.',
    eye: 'Pocas imágenes: un borrón',
  },
  fly: {
    letter: 'B',
    name: 'Ojos de mosca',
    tag: 'hasta 250 imágenes por segundo',
    slow: 4, // cuatro veces más imágenes = la misma acción vivida en cámara lenta
    frameEvery: 40,
    intro: 'Escena B: la misma mano, vista con ojos de mosca: hasta 250 imágenes por segundo.',
    result: 'Para la mosca, la mano llega en cámara lenta: le sobra tiempo para verla venir y escapar.',
    eye: 'Muchas imágenes: cámara lenta',
  },
};

const T = { raise: 700, start: 1000, hold: 5200 }; // hold: tiempo para leer el resultado
const actEndAt = (scene) => T.start + ACT.end * SCENES[scene].slow;
const sceneEndAt = (scene) => actEndAt(scene) + T.hold;
const staticAt = (scene) => actEndAt(scene) + 300; // fotograma clave para reduced-motion

// --------------------------------------------------------------------------
// Piezas estáticas
// --------------------------------------------------------------------------
function Facets({ polys }) {
  return polys.map((p, i) => (
    <polygon key={i} points={p.points} fill={p.fill} stroke={p.fill} strokeWidth="0.6" strokeLinejoin="round" />
  ));
}

const HEX_PATH = (() => {
  const r = 9;
  const h = r * Math.sqrt(3);
  const hex = (cx, cy) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
  return { w: r * 3, h, a: hex(r, h / 2), b: hex(r * 2.5, h) };
})();

// --------------------------------------------------------------------------
// Componente
// --------------------------------------------------------------------------
export function DrosophilaUmweltFigure() {
  const [scene, setScene] = useState('human');
  const [stage, setStage] = useState('ready'); // ready | swoop | result
  const [cycle, setCycle] = useState(0);
  const [playing, setPlaying] = useState(true);

  const reduceMotion = useReducedMotion();
  const articleRef = useRef(null);

  const handRef = useRef(null);
  const handShadowRef = useRef(null);
  const motionBlurRef = useRef(null); // Referencia al filtro de desenfoque cinético para la mano humana
  const flyRef = useRef(null);
  const flyShadowRef = useRef(null);
  const wingsRef = useRef(null);
  const ghostRefs = useRef([]);
  const counterRef = useRef(null);
  const progressRefs = useRef({});

  const simRef = useRef({
    t: 0,
    scene: 'human',
    stage: 'ready',
    returning: false, // la mano y la mosca vuelven a su sitio al empezar la escena
    playing: true,
    visible: false,
    seen: false,
  });

  useEffect(() => {
    if (!reduceMotion) return;
    const s = simRef.current;
    s.playing = false;
    s.t = staticAt(s.scene);
    setPlaying(false);
  }, [reduceMotion]);

  const paint = useCallback((t, returning, currentScene) => {
    const sc = SCENES[currentScene];
    const tau = Math.max(0, (t - T.start) / sc.slow); // tiempo físico transcurrido
    const backP = returning && t < T.raise ? easeInOutCubic(t / T.raise) : null;

    // Mano
    let hand;
    if (backP !== null) {
      const a = handAt(1);
      const b = handAt(0);
      hand = [lerp(a[0], b[0], backP), lerp(a[1], b[1], backP), lerp(a[2], b[2], backP) + Math.sin(backP * Math.PI) * 0.6];
    } else {
      hand = handAt(Math.min(1, tau / ACT.swoop));
    }
    const [hx, hy] = screenOffset(hand[0], hand[1], hand[2]);
    handRef.current?.setAttribute('transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)})`);
    const [hsx, hsy] = screenOffset(hand[0] + hand[2] * SHADOW_DX, hand[1] + hand[2] * SHADOW_DY, 0);
    handShadowRef.current?.setAttribute('transform', `translate(${hsx.toFixed(1)} ${hsy.toFixed(1)})`);

    // Desenfoque de movimiento (motion blur) inmersivo:
    // - En ojos humanos (~60 Hz): el tiempo de integración retiniano funde la mano rápida en un borrón dinámico
    //   proporcional a la velocidad del manotazo. Al detenerse sobre la mesa o antes de caer, recupera su nitidez.
    // - En ojos de mosca (250 Hz): muestreo ultrarrápido (cámara lenta x4), la mano se percibe nítida en cada instante.
    if (currentScene === 'human') {
      if (backP !== null) {
        // En reposicionamiento de retorno: leve desenfoque cinético suave
        motionBlurRef.current?.setAttribute('stdDeviation', '2.5 3.0');
        handRef.current?.setAttribute('filter', 'url(#umwelt-hand-motion-blur)');
      } else if (tau > 0 && tau < ACT.swoop) {
        // Descenso rápido en picado: desenfoque pronunciado a lo largo del vector de desplazamiento
        const progress = tau / ACT.swoop;
        const velocity = Math.sin(progress * Math.PI); // Velocidad máxima en el centro de la trayectoria
        const blurX = (velocity * 9.0 + 2.0).toFixed(1);
        const blurY = (velocity * 12.0 + 2.5).toFixed(1);
        motionBlurRef.current?.setAttribute('stdDeviation', `${blurX} ${blurY}`);
        handRef.current?.setAttribute('filter', 'url(#umwelt-hand-motion-blur)');
      } else {
        // Mano en reposo estático (arriba antes de iniciar o detenida sobre la mesa)
        motionBlurRef.current?.setAttribute('stdDeviation', '0 0');
        handRef.current?.removeAttribute('filter');
      }
    } else {
      // Visión de mosca: cámara lenta x4 nítida sin desenfoque retiniano
      motionBlurRef.current?.setAttribute('stdDeviation', '0 0');
      handRef.current?.removeAttribute('filter');
    }

    // Mosca
    let fly;
    let flying = false;
    if (backP !== null) {
      const e = 1 - Math.pow(1 - backP, 3);
      fly = [lerp(F1[0], F0[0], e), lerp(F1[1], F0[1], e), lerp(F1[2], F0[2], e)];
      flying = backP < 1;
    } else if (tau < ACT.takeoff) {
      fly = F0;
    } else {
      const q = Math.min(1, (tau - ACT.takeoff) / ACT.flight);
      fly = flyAt(q);
      flying = q < 1;
    }
    const [fx, fy] = screenOffset(fly[0], fly[1], fly[2]);
    flyRef.current?.setAttribute('transform', `translate(${fx.toFixed(1)} ${fy.toFixed(1)})`);
    const [fsx, fsy] = screenOffset(fly[0] + fly[2] * SHADOW_DX, fly[1] + fly[2] * SHADOW_DY, 0);
    flyShadowRef.current?.setAttribute('transform', `translate(${fsx.toFixed(1)} ${fsy.toFixed(1)})`);
    flyShadowRef.current?.setAttribute('opacity', Math.max(0.25, 1 - fly[2] * 0.3).toFixed(2));
    // Aleteo: en cámara lenta las alas también baten más despacio
    const flap = flying ? (Math.floor(t / (24 * sc.slow)) % 2 ? 0.25 : 0.75) : 0.6;
    wingsRef.current?.setAttribute('opacity', flap);

    // Imágenes que capta el ojo: siluetas fantasma de la mano en cada instante muestreado
    let captured = 0;
    for (let i = 0; i < GHOST_POOL; i++) {
      const el = ghostRefs.current[i];
      if (!el) continue;
      const ti = i * sc.frameEvery;
      if (backP !== null || ti > ACT.swoop || tau < ti || t < T.start) {
        el.setAttribute('opacity', 0);
        continue;
      }
      captured++;
      const g = handAt(ti / ACT.swoop);
      const [gx, gy] = screenOffset(g[0], g[1], g[2]);
      el.setAttribute('transform', `translate(${gx.toFixed(1)} ${gy.toFixed(1)})`);
      const age = (tau - ti) * sc.slow; // edad en tiempo de pantalla
      el.setAttribute('opacity', (0.85 * Math.max(0.35, 1 - age / 1600)).toFixed(2));
      // En visión humana, las siluetas fantasma también se perciben como borrones desenfocados
      if (currentScene === 'human') {
        el.setAttribute('filter', 'url(#umwelt-ghost-blur)');
      } else {
        el.removeAttribute('filter');
      }
    }
    if (counterRef.current) counterRef.current.textContent = `imágenes captadas: ${captured}`;

    const bar = progressRefs.current[currentScene];
    if (bar) bar.style.transform = `scaleX(${Math.min(1, t / sceneEndAt(currentScene))})`;
    const other = progressRefs.current[currentScene === 'human' ? 'fly' : 'human'];
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
        if (s.t >= sceneEndAt(s.scene)) {
          s.t = 0;
          s.returning = true;
          s.scene = s.scene === 'human' ? 'fly' : 'human';
          setScene(s.scene);
          setCycle((c) => c + 1);
        }
      }

      const nextStage = s.t < T.start ? 'ready' : s.t < actEndAt(s.scene) ? 'swoop' : 'result';
      if (nextStage !== s.stage) {
        s.stage = nextStage;
        setStage(nextStage);
      }

      if (s.visible) paint(s.t, s.returning, s.scene);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paint]);

  // Solo se reproduce a la vista; la primera vez empieza desde cero
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
    s.returning = s.t >= T.start;
    s.scene = next;
    if (reduceMotion && !s.playing) {
      s.t = staticAt(next);
    } else {
      s.t = 0;
      s.playing = true;
      setPlaying(true);
    }
    setScene(next);
    setCycle((c) => c + 1);
    paint(s.t, s.returning, next);
  };

  const togglePlaying = () => {
    const s = simRef.current;
    s.playing = !s.playing;
    setPlaying(s.playing);
  };

  const current = SCENES[scene];
  const isResult = stage === 'result';
  const isFlyEye = scene === 'fly';
  const flyStart = iso(F0[0], F0[1], F0[2]);
  const flyEnd = iso(F1[0], F1[1], F1[2]);

  return (
    <article className="experiment-card" id="filtro-umwelt" ref={articleRef}>
      <div className="exp-header">
        <div className="exp-title-row">
          <span className="exp-tag">EXPERIMENTO 02</span>
          <h3 className="exp-title">La mano que se acerca: ¿la ves igual que una mosca?</h3>
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
                      layoutId="umwelt-pill"
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
              <filter id="umwelt-soft" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.4" />
              </filter>
              {/* Filtro de desenfoque de movimiento cinético dinámico para la mano en visión humana (~60 Hz) */}
              <filter id="umwelt-hand-motion-blur" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur ref={motionBlurRef} stdDeviation="0 0" />
              </filter>
              {/* Filtro de persistencia retiniana y borrón para las siluetas fantasma captadas por el ojo humano */}
              <filter id="umwelt-ghost-blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4.5 5.5" />
              </filter>
              <filter id="umwelt-blur-strong" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
              <radialGradient id="umwelt-key-light" cx="22%" cy="18%" r="70%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.16" />
                <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="umwelt-vignette" cx="50%" cy="48%" r="70%">
                <stop offset="65%" stopColor="#000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
              </radialGradient>
              <linearGradient id="umwelt-top-sheen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFF6D8" stopOpacity="0.14" />
                <stop offset="70%" stopColor="#FFF6D8" stopOpacity="0" />
              </linearGradient>
              <pattern id="umwelt-hex" width={HEX_PATH.w} height={HEX_PATH.h} patternUnits="userSpaceOnUse">
                <polygon points={HEX_PATH.a} className="umwelt-hex-cell" />
                <polygon points={HEX_PATH.b} className="umwelt-hex-cell" />
              </pattern>
              <clipPath id="umwelt-table-clip">
                <polygon points={tableTop.map(pt).join(' ')} />
              </clipPath>
            </defs>

            <rect x="0" y="0" width="640" height="400" fill="url(#umwelt-key-light)" />

            <text x="20" y="32" className="forest-title">
              Escena {current.letter} &middot; {current.name}
            </text>
            <text x="20" y="52" className="forest-note">
              {current.tag}
            </text>

            {/* Mesa */}
            <polygon
              points={[iso(0.3, TABLE.d, -TABLE.t), iso(TABLE.w, TABLE.d, -TABLE.t), iso(TABLE.w, 0.3, -TABLE.t), iso(TABLE.w + 0.9, 0.6, -TABLE.t - 0.25), iso(TABLE.w + 0.6, TABLE.d + 0.6, -TABLE.t - 0.25), iso(0.6, TABLE.d + 0.9, -TABLE.t - 0.25)]
                .map(pt)
                .join(' ')}
              className="forest-slab-shadow"
              filter="url(#umwelt-blur-strong)"
            />
            <Facets polys={TABLE_POLYS} />
            <polygon points={tableTop.map(pt).join(' ')} fill="url(#umwelt-top-sheen)" />

            <g clipPath="url(#umwelt-table-clip)">
              {PLANKS.map(([a, b], i) => (
                <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="umwelt-plank" />
              ))}

              {/* Sombras proyectadas */}
              <g className="forest-cast" filter="url(#umwelt-soft)">
                {STATIC_SHADOWS.map((d, i) => (
                  <path key={i} d={d} />
                ))}
                <path ref={handShadowRef} d={HAND_SHADOW} />
                <path ref={flyShadowRef} d={FLY_SHADOW} />
              </g>

              {/* Sombra de la trayectoria sobre la mesa */}
              <polyline points={TRAJECTORY_SHADOW_PTS} className="umwelt-path-shadow" />
            </g>

            {/* Objetos del fondo */}
            <Facets polys={BACK_POLYS} />

            {/* Lo físico: la trayectoria real de la mano, igual en las dos escenas */}
            <polyline points={TRAJECTORY_PTS} className="umwelt-path" data-active={stage === 'swoop'} />

            {/* Lo vivido: cada imagen que capta el ojo */}
            <g className="umwelt-ghosts">
              {Array.from({ length: GHOST_POOL }, (_, i) => (
                <path key={i} ref={(el) => (ghostRefs.current[i] = el)} d={HAND_SILHOUETTE} className="umwelt-ghost" opacity="0" />
              ))}
            </g>

            {/* Mosca */}
            <g ref={flyRef} transform={`translate(${screenOffset(...F0).map((v) => v.toFixed(1)).join(' ')})`}>
              <Facets polys={FLY_POLYS} />
              {FLY_EYES.map((e, i) => (
                <circle key={i} cx={e[0]} cy={e[1]} r="2.6" className="umwelt-eye" />
              ))}
              <g ref={wingsRef} opacity="0.6">
                {FLY_WINGS.map((w, i) => (
                  <polygon key={i} points={w} className="umwelt-wing" />
                ))}
              </g>
            </g>

            {/* Mano */}
            <g ref={handRef} transform={`translate(${screenOffset(...handAt(0)).map((v) => v.toFixed(1)).join(' ')})`}>
              <Facets polys={HAND_POLYS} />
            </g>

            {/* Lo que vive la mosca: ve venir el golpe y planea su huida */}
            {isFlyEye && stage !== 'ready' && (
              <polyline key={`esc${cycle}`} points={ESCAPE_PTS} className="umwelt-escape" />
            )}
            {isFlyEye && stage === 'swoop' && (
              <text key={`slow${cycle}`} x="620" y="32" textAnchor="end" className="umwelt-slow">
                cámara lenta ×4
              </text>
            )}
            {isResult && !isFlyEye && (
              <text key={`zas${cycle}`} x={flyStart[0] + 30} y={flyStart[1] - 74} textAnchor="middle" className="pum-label">
                ¡zas! ¿dónde está?
              </text>
            )}
            {isResult && isFlyEye && (
              <text key={`safe${cycle}`} x={flyEnd[0]} y={flyEnd[1] - 34} textAnchor="middle" className="pum-label">
                a salvo
              </text>
            )}

            {/* Objetos delanteros */}
            <Facets polys={FRONT_POLYS} />

            {/* Ojo compuesto: la retícula de omatidios aparece solo con ojos de mosca */}
            <rect x="0" y="0" width="640" height="400" fill="url(#umwelt-hex)" className="umwelt-hex" data-on={isFlyEye} />

            <rect x="0" y="0" width="640" height="400" fill="url(#umwelt-vignette)" pointerEvents="none" />

            <text ref={counterRef} x="620" y="390" textAnchor="end" className="umwelt-counter">
              imágenes captadas: 0
            </text>

            <g transform="translate(20 380)" className="forest-legend">
              <line x1="0" y1="0" x2="18" y2="0" className="umwelt-path" data-active="true" />
              <text x="26" y="4">trayectoria real de la mano</text>
              <circle cx="190" cy="0" r="5" className="legend-sound" />
              <text x="202" y="4">imágenes que capta el ojo</text>
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
              data-scene={isFlyEye ? 'person' : 'empty'}
            >
              {isResult ? current.result : current.intro}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="telemetry-row">
          <div className="telemetry-pill">
            <span>¿LA MANO VA IGUAL DE RÁPIDO?</span>
            <strong style={{ color: 'var(--accent-cyan)' }}>Sí, en las dos escenas</strong>
          </div>
          <div className="telemetry-pill">
            <span>¿CÓMO LO VE EL OJO?</span>
            <strong style={{ color: 'var(--accent-amber)' }}>{current.eye}</strong>
          </div>
        </div>

        <div className="readout-box" style={{ marginTop: '16px' }}>
          <strong>¿Por qué pasa esto?</strong>{' '}
          {isFlyEye ? (
            <span>
              La mosca procesa hasta <strong>250 imágenes por segundo</strong>. Con cuatro veces más imágenes de la misma
              acción, tu mano se mueve en cámara lenta, como una estatua pesada flotando en el aire: tiene tiempo de
              sobra para despegar.
            </span>
          ) : (
            <span>
              Nuestros ojos procesan unos <strong>60 destellos de luz por segundo</strong>. Entre imagen e imagen la mano
              recorre mucho camino, así que la vemos como un borrón y la huida de la mosca nos parece instantánea.
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
