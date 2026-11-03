'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { TraumaPredictionService } from '../../domain/services/TraumaPredictionService';
import {
  iso,
  pt,
  groundEllipse,
  shadeFaces,
  castShadowPath,
  cylinder,
  box,
  lcg,
  rotateZ,
  buildFlyModel,
  easeInOutCubic,
} from '../../domain/services/IsoEngine';

/**
 * COMPONENTE: BehavioralArenaFigure (Experimento 03)
 *
 * Diorama isométrico (mismo motor y luz que los Experimentos 01 y 02). Cuatro moscas con pasados
 * distintos pasan exactamente la misma prueba en la misma arena de cristal:
 *   pasa una sombra por encima → se abre la puerta de salida → hay azúcar y alcohol.
 * Lo físico (cian) es idéntico en las cuatro escenas: la sombra y la puerta.
 * Lo que arrastra cada mosca de su pasado (ámbar) cambia: su estela, su intención y su alerta.
 * Resultado: con solo conocer la historia, predecimos la conducta.
 */

// --------------------------------------------------------------------------
// Escenografía: mesa de laboratorio con una arena de cristal
// --------------------------------------------------------------------------
const BENCH = { w: 10, d: 6, t: 0.5 };
const O = iso(0, 0, 0);
const screenOffset = (x, y, z) => {
  const p = iso(x, y, z);
  return [p[0] - O[0], p[1] - O[1]];
};
const poly = (pts3d) => pts3d.map((p) => pt(iso(p[0], p[1], p[2]))).join(' ');

const benchTop = [iso(0, 0), iso(BENCH.w, 0), iso(BENCH.w, BENCH.d), iso(0, BENCH.d)];
const BENCH_POLYS = shadeFaces([
  { pts: [[0, 0, 0], [BENCH.w, 0, 0], [BENCH.w, BENCH.d, 0], [0, BENCH.d, 0]], hint: [0, 0, 1], mat: 'bench' },
  { pts: [[BENCH.w, 0, 0], [BENCH.w, BENCH.d, 0], [BENCH.w, BENCH.d, -BENCH.t], [BENCH.w, 0, -BENCH.t]], hint: [1, 0, 0], mat: 'bench' },
  { pts: [[0, BENCH.d, 0], [BENCH.w, BENCH.d, 0], [BENCH.w, BENCH.d, -BENCH.t], [0, BENCH.d, -BENCH.t]], hint: [0, 1, 0], mat: 'bench' },
]);

// Arena de cristal
const A = { x0: 2, x1: 8, y0: 0.9, y1: 5.1, h: 0.55 };
const DOOR = { x0: 4.5, x1: 5.5 };
const ARENA_FLOOR = poly([[A.x0, A.y0, 0], [A.x1, A.y0, 0], [A.x1, A.y1, 0], [A.x0, A.y1, 0]]);
const WALL_BACK_LEFT = poly([[A.x0, A.y0, 0], [DOOR.x0, A.y0, 0], [DOOR.x0, A.y0, A.h], [A.x0, A.y0, A.h]]);
const WALL_BACK_RIGHT = poly([[DOOR.x1, A.y0, 0], [A.x1, A.y0, 0], [A.x1, A.y0, A.h], [DOOR.x1, A.y0, A.h]]);
const WALL_LEFT = poly([[A.x0, A.y0, 0], [A.x0, A.y1, 0], [A.x0, A.y1, A.h], [A.x0, A.y0, A.h]]);
const WALL_RIGHT = poly([[A.x1, A.y0, 0], [A.x1, A.y1, 0], [A.x1, A.y1, A.h], [A.x1, A.y0, A.h]]);
const WALL_FRONT = poly([[A.x0, A.y1, 0], [A.x1, A.y1, 0], [A.x1, A.y1, A.h], [A.x0, A.y1, A.h]]);
// Cuadrícula del suelo de la arena (escala de laboratorio)
const GRID = [
  ...Array.from({ length: 5 }, (_, i) => [iso(A.x0 + 1 + i, A.y0, 0), iso(A.x0 + 1 + i, A.y1, 0)]),
  ...Array.from({ length: 3 }, (_, i) => [iso(A.x0, A.y0 + 1.05 * (i + 1), 0), iso(A.x1, A.y0 + 1.05 * (i + 1), 0)]),
];
const RIM = poly([[A.x0, A.y0, A.h], [A.x1, A.y0, A.h], [A.x1, A.y1, A.h], [A.x0, A.y1, A.h]]);
const DOOR_PANEL = shadeFaces(box(DOOR.x0, DOOR.x1, A.y0 - 0.05, A.y0 + 0.05, 0, A.h, 'bench'));
const DOOR_FRAME = poly([[DOOR.x0, A.y0, 0], [DOOR.x0, A.y0, A.h], [DOOR.x1, A.y0, A.h], [DOOR.x1, A.y0, 0]]);
const DOOR_LABEL = iso((DOOR.x0 + DOOR.x1) / 2, A.y0, A.h + 1.05);

// Comederos: azúcar a la izquierda, alcohol a la derecha
const SUGAR = { x: 3.3, y: 4.0 };
const ETHANOL = { x: 6.7, y: 4.0 };
const FEEDERS = [
  ...cylinder(SUGAR.x, SUGAR.y, 0.38, 0, 0.22, 12, 'ceramic', 'sugar'),
  ...cylinder(ETHANOL.x, ETHANOL.y, 0.38, 0, 0.22, 12, 'ceramic', 'ethanol'),
];
const FEEDER_POLYS = shadeFaces(FEEDERS);
const FEEDER_SHADOWS = [SUGAR, ETHANOL].map((f) => castShadowPath(cylinder(f.x, f.y, 0.38, 0, 0.22, 12, 'ceramic').flatMap((x) => x.pts)));
const SUGAR_LABEL = iso(SUGAR.x, SUGAR.y + 0.75, 0);
const ETHANOL_LABEL = iso(ETHANOL.x, ETHANOL.y + 0.75, 0);

// --------------------------------------------------------------------------
// La mosca (modelo compartido) y su comportamiento según su pasado
// --------------------------------------------------------------------------
const FLY = buildFlyModel(2.8); // la arena es un plano cercano: la mosca se ve más grande
const FLY_FACE_COUNT = FLY.faces.length;

const C = { x: 5, y: 3.1 };
const lerp = (a, b, p) => a + (b - a) * p;

// Cada escena tiene dos fases: «1 · Su pasado» (0 → TEST) y «2 · La prueba» (TEST → END).
// T son los tiempos de la prueba, medidos desde TEST; es idéntica para todas las moscas.
const TEST = 3800;
const T = {
  arrive: 700, // la mosca aparece en la arena
  shadowStart: 1500,
  shadowDur: 800,
  doorAt: 2300,
  doorDur: 400,
  result: 4000,
};
const END = TEST + 9500; // más de 5 s con el resultado en pantalla para poder leerlo
const STATIC_T = TEST + 5400;

// Exploración inicial idéntica en las cuatro escenas
const explore = (t) => {
  const a = (Math.max(0, t - T.arrive) / 1000) * Math.PI * 0.9;
  return [C.x + Math.cos(a) * 0.6, C.y + Math.sin(a) * 0.6, 0];
};
const P1 = explore(T.shadowStart);

// Recorrido en zigzag (determinista) para la mosca hipervigilante
const ZIGZAG = (() => {
  const rand = lcg(13);
  const pts = [P1];
  for (let i = 0; i < 16; i++) {
    pts.push([lerp(A.x0 + 0.5, A.x1 - 0.5, rand()), lerp(A.y0 + 0.5, A.y1 - 0.5, rand()), 0]);
  }
  return pts;
})();
const ZIG_STEP = 260;

const toward = (target, from = P1, stop = 0.8) => {
  const dx = target.x - from[0];
  const dy = target.y - from[1];
  const d = Math.hypot(dx, dy);
  return [target.x - (dx / d) * stop, target.y - (dy / d) * stop, 0];
};
const SUGAR_SPOT = toward(SUGAR);
const ETHANOL_SPOT = toward(ETHANOL);

const walkTo = (t, t0, t1, from, to) => {
  const p = easeInOutCubic(Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
  return [lerp(from[0], to[0], p), lerp(from[1], to[1], p), 0];
};
const eatBob = (t, spot) => [spot[0], spot[1], 0.03 * Math.max(0, Math.sin(t / 140))];

const BEHAVIOR = {
  baseline: (t) => {
    if (t < T.shadowStart + 300) return t < T.shadowStart ? explore(t) : P1; // pequeño respingo
    if (t < 3500) return walkTo(t, T.shadowStart + 300, 3500, P1, SUGAR_SPOT);
    return eatBob(t, SUGAR_SPOT);
  },
  shadow: (t) => {
    if (t < T.shadowStart) return explore(t);
    const k = t - T.shadowStart;
    if (k < 320) return [P1[0], P1[1], 0.5 * Math.sin((k / 320) * Math.PI)]; // salto de susto
    const seg = (k - 320) / ZIG_STEP;
    const i = Math.floor(seg) % (ZIGZAG.length - 1);
    const f = seg - Math.floor(seg);
    const a = ZIGZAG[i];
    const b = ZIGZAG[i + 1];
    return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), 0.18 * Math.sin(f * Math.PI)];
  },
  heat: (t) => (t < T.shadowStart ? explore(t) : P1), // se queda inmóvil para siempre
  rejection: (t) => {
    if (t < T.shadowStart + 250) return t < T.shadowStart ? explore(t) : P1;
    if (t < 3000) return walkTo(t, T.shadowStart + 250, 3000, P1, ETHANOL_SPOT);
    return eatBob(t, ETHANOL_SPOT);
  },
};

// --------------------------------------------------------------------------
// Fase 1 · Su pasado (lo que vivió cada mosca antes de la prueba)
// --------------------------------------------------------------------------
const START = explore(0);
const PAST_SWEEPS = [400, 1500, 2600]; // sombras repetidas (escena B)
const SWEEP_PAST_DUR = 700;
const HEAT = { on: 300, off: 3300 }; // suelo a 40 °C con la puerta cerrada (escena C)
const FEM = { x: 6.4, y: 2.3 }; // la hembra que rechaza al macho (escena D)
const REJECTIONS = [900, 2300];

const hopBetween = (t, t0, dur, a, b, height = 0.5) => {
  const p = Math.min(1, Math.max(0, (t - t0) / dur));
  const e = easeInOutCubic(p);
  return [lerp(a[0], b[0], e), lerp(a[1], b[1], e), height * Math.sin(p * Math.PI)];
};

const REST_B = [
  [C.x - 0.9, C.y + 0.3, 0],
  [C.x + 1.0, C.y - 0.7, 0],
  [C.x - 0.4, C.y + 1.0, 0],
  [C.x + 0.4, C.y - 0.2, 0],
];

const WALLRUN = (() => {
  const rand = lcg(29);
  const pts = [[C.x - 0.9, C.y + 0.3, 0]];
  for (let i = 0; i < 12; i++) {
    const side = i % 4;
    const u = rand();
    pts.push(
      side === 0
        ? [A.x0 + 0.45, lerp(A.y0 + 0.5, A.y1 - 0.5, u), 0]
        : side === 1
        ? [lerp(A.x0 + 0.6, A.x1 - 0.6, u), A.y0 + 0.45, 0]
        : side === 2
        ? [A.x1 - 0.45, lerp(A.y0 + 0.5, A.y1 - 0.5, u), 0]
        : [lerp(A.x0 + 0.6, A.x1 - 0.6, u), A.y1 - 0.45, 0]
    );
  }
  return pts;
})();
const WALL_STEP = 300;

const APPROACH = [FEM.x - 0.85, FEM.y + 0.3, 0];
const RETREAT = [C.x - 0.9, C.y + 0.7, 0];
const PUSHED = [lerp(APPROACH[0], RETREAT[0], 0.6), lerp(APPROACH[1], RETREAT[1], 0.6), 0];

const PAST = {
  baseline: (t) => {
    const a = (t / 2400) * Math.PI * 2;
    return [C.x + Math.cos(a) * 1.1, C.y + Math.sin(a) * 0.8, 0];
  },
  shadow: (t) => {
    for (let i = PAST_SWEEPS.length - 1; i >= 0; i--) {
      const t0 = PAST_SWEEPS[i] + 250;
      if (t >= t0) return hopBetween(t, t0, 360, REST_B[i], REST_B[i + 1]);
    }
    return REST_B[0];
  },
  heat: (t) => {
    if (t < HEAT.on) return WALLRUN[0];
    const seg = Math.min((t - HEAT.on) / WALL_STEP, WALLRUN.length - 1.001);
    const i = Math.floor(seg);
    const f = seg - i;
    const a = WALLRUN[i];
    const b = WALLRUN[i + 1];
    return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), 0.08 * Math.sin(f * Math.PI)];
  },
  rejection: (t) => {
    if (t < REJECTIONS[0]) return walkTo(t, 0, REJECTIONS[0], RETREAT, APPROACH);
    if (t < 1500) return hopBetween(t, REJECTIONS[0], 400, APPROACH, PUSHED, 0.25);
    if (t < REJECTIONS[1]) return walkTo(t, 1500, REJECTIONS[1], PUSHED, APPROACH);
    if (t < 3000) return hopBetween(t, REJECTIONS[1], 400, APPROACH, RETREAT, 0.25);
    return RETREAT;
  },
};

// Posición de la mosca en cualquier instante de la escena
const posAt = (scene, t) => {
  if (t >= TEST) return BEHAVIOR[scene](t - TEST);
  const p = PAST[scene](t);
  const blend = Math.max(0, (t - (TEST - 500)) / 500); // se coloca en la salida de la prueba
  if (blend <= 0) return p;
  const e = easeInOutCubic(blend);
  return [lerp(p[0], START[0], e), lerp(p[1], START[1], e), lerp(p[2], 0, e)];
};

// Sombras que cruzan: las del pasado (solo B) y la de la prueba (todas)
const sweepsFor = (scene) => [
  ...(scene === 'shadow' ? PAST_SWEEPS.map((t0) => ({ t0, dur: SWEEP_PAST_DUR })) : []),
  { t0: TEST + T.shadowStart, dur: T.shadowDur },
];

const TEST_INTRO =
  'Ahora, la misma prueba para todas: pasa una sombra, se abre la puerta y hay azúcar y alcohol. ¿Qué hará?';

const SCENES = {
  baseline: {
    letter: 'A',
    name: 'Sin sustos',
    past: 'Su pasado: una vida tranquila',
    outcome: 'come tranquila',
    eye: 'Explora y va al azúcar',
    pastText: 'Escena A · Su pasado: esta mosca ha vivido días tranquilos, sin sustos.',
    result: 'Se asusta un instante, se recupera y va a comer azúcar con calma.',
  },
  shadow: {
    letter: 'B',
    name: 'Sombras repetidas',
    past: 'Su pasado: sombras que pasaban una y otra vez',
    outcome: 'alerta sin fin',
    eye: 'Saltos en zigzag, no come',
    pastText: 'Escena B · Su pasado: una sombra pasaba sobre ella una y otra vez, como un pájaro a punto de atraparla.',
    result: 'La sombra ya pasó, pero su alarma sigue encendida: salta en zigzag sin parar y se olvida de comer.',
  },
  heat: {
    letter: 'C',
    name: 'Calor sin salida',
    past: 'Su pasado: un calor del que no podía escapar',
    outcome: 'podría salir… y no lo intenta',
    eye: 'Inmóvil, ignora la puerta',
    pastText: 'Escena C · Su pasado: el suelo se calentaba a 40 °C y la puerta estaba cerrada. Corriera adonde corriera, no había escapatoria.',
    result: 'La puerta está abierta y podría salir, pero ni lo intenta: aprendió que moverse no servía de nada. Es la indefensión aprendida.',
  },
  rejection: {
    letter: 'D',
    name: 'Rechazo',
    past: 'Su pasado: rechazado una y otra vez por una hembra',
    outcome: 'directa al alcohol',
    eye: 'Ignora el azúcar, busca alcohol',
    pastText: 'Escena D · Su pasado: este macho cortejó a una hembra una y otra vez… y ella siempre lo rechazó.',
    result: 'Tanto rechazo dejó su recompensa cerebral (el Neuropéptido F) por los suelos: ignora el azúcar y va directo al alcohol, como quien bebe para compensar.',
  },
};
const ORDER = ['baseline', 'shadow', 'heat', 'rejection'];

// Intenciones (ámbar): hacia dónde le empuja su pasado
const INTENT = {
  baseline: poly([[P1[0], P1[1], 0.25], [lerp(P1[0], SUGAR_SPOT[0], 0.5), lerp(P1[1], SUGAR_SPOT[1], 0.5), 0.6], [SUGAR_SPOT[0], SUGAR_SPOT[1], 0.25]]),
  rejection: poly([[P1[0], P1[1], 0.25], [lerp(P1[0], ETHANOL_SPOT[0], 0.5), lerp(P1[1], ETHANOL_SPOT[1], 0.5), 0.6], [ETHANOL_SPOT[0], ETHANOL_SPOT[1], 0.25]]),
  heat: poly([[P1[0], P1[1], 0.2], [(DOOR.x0 + DOOR.x1) / 2, A.y0 + 0.2, 0.2]]),
};

const TRAIL_LEN = 46;

// La hembra: mismo modelo, otro color, mirando hacia el macho
const FEM_TURN = Math.PI * 0.85;
const FEMALE_FACES = FLY.faces.map((f) => ({
  pts: f.pts.map((p) => {
    const r = rotateZ(p, FEM_TURN);
    return [r[0] + FEM.x, r[1] + FEM.y, r[2]];
  }),
  hint: rotateZ(f.hint, FEM_TURN),
  mat: 'flyFemale',
}));
const FEMALE_POLYS = shadeFaces(FEMALE_FACES);
const FEMALE_SHADOW = castShadowPath(FEMALE_FACES.flatMap((f) => f.pts));
const FEMALE_EYES = FLY.eyes.map((e) => {
  const r = rotateZ(e, FEM_TURN);
  return iso(r[0] + FEM.x, r[1] + FEM.y, r[2]);
});
const FEM_LABEL = iso(FEM.x, FEM.y - 0.7, 0);
const REJECT_AT = iso(FEM.x - 0.45, FEM.y + 0.15, 1.9);
const HEAT_LABEL = iso((A.x0 + A.x1) / 2, A.y1, A.h + 0.35);

function Facets({ polys }) {
  return polys.map((p, i) => (
    <polygon key={i} points={p.points} fill={p.fill} stroke={p.fill} strokeWidth="0.6" strokeLinejoin="round" />
  ));
}

// --------------------------------------------------------------------------
// Componente
// --------------------------------------------------------------------------
export function BehavioralArenaFigure() {
  const [scene, setScene] = useState('baseline');
  const [stage, setStage] = useState('past'); // past | ready | test | result
  const [cycle, setCycle] = useState(0);
  const [playing, setPlaying] = useState(true);

  const reduceMotion = useReducedMotion();
  const articleRef = useRef(null);

  const flyGroupRef = useRef(null);
  const flyFacetRefs = useRef([]);
  const eyeRefs = useRef([]);
  const wingRefs = useRef([]);
  const flyShadowRef = useRef(null);
  const trailRef = useRef(null);
  const alarmRefs = useRef([]);
  const shadowBandRef = useRef(null);
  const shadowEdgeRef = useRef(null);
  const doorRef = useRef(null);
  const doorFrameRef = useRef(null);
  const progressRefs = useRef({});
  const doorLabelRef = useRef(null);
  const heatRef = useRef(null);
  const heatLabelRef = useRef(null);
  const femaleRef = useRef(null);
  const rejectRef = useRef(null);

  const simRef = useRef({
    t: 0,
    scene: 'baseline',
    stage: 'past',
    playing: true,
    visible: false,
    seen: false,
    heading: Math.PI / 2,
  });

  useEffect(() => {
    if (!reduceMotion) return;
    const s = simRef.current;
    s.playing = false;
    s.t = STATIC_T;
    setPlaying(false);
  }, [reduceMotion]);

  const paint = useCallback((t, currentScene) => {
    const s = simRef.current;
    const behave = (tt) => posAt(currentScene, tt);
    const pos = behave(t);
    const tau = t - TEST; // tiempo dentro de la prueba

    // Orientación: mira hacia donde se mueve
    const prev = behave(Math.max(0, t - 40));
    if (Math.hypot(pos[0] - prev[0], pos[1] - prev[1]) > 0.002) s.heading = Math.atan2(pos[1] - prev[1], pos[0] - prev[0]);
    const place = (p) => {
      const r = rotateZ(p, s.heading);
      return [r[0] + pos[0], r[1] + pos[1], r[2] + pos[2]];
    };

    // Mosca: caras giradas, sombreadas y reordenadas en cada fotograma
    const faces = FLY.faces.map((f) => ({ pts: f.pts.map(place), hint: rotateZ(f.hint, s.heading), mat: f.mat }));
    const polys = shadeFaces(faces);
    for (let i = 0; i < FLY_FACE_COUNT; i++) {
      const el = flyFacetRefs.current[i];
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
    FLY.eyes.forEach((e, i) => {
      const q = iso(...place(e));
      eyeRefs.current[i]?.setAttribute('cx', q[0].toFixed(1));
      eyeRefs.current[i]?.setAttribute('cy', q[1].toFixed(1));
    });
    const moving = Math.hypot(pos[0] - prev[0], pos[1] - prev[1]) > 0.002 || pos[2] > 0.05;
    FLY.wings.forEach((w, i) => {
      const el = wingRefs.current[i];
      if (!el) return;
      el.setAttribute('points', w.map((p) => pt(iso(...place(p)))).join(' '));
      el.setAttribute('opacity', moving && currentScene === 'shadow' ? (Math.floor(t / 30) % 2 ? 0.3 : 0.8) : 0.65);
    });
    flyShadowRef.current?.setAttribute('d', castShadowPath(faces.flatMap((f) => f.pts)));
    flyGroupRef.current?.setAttribute('opacity', Math.min(1, t / 500).toFixed(2));

    // Estela: la huella visible de su estado interno
    const trail = [];
    for (let i = TRAIL_LEN - 1; i >= 0; i--) {
      const tt = t - i * 45;
      if (tt < 0) continue;
      const p = behave(tt);
      trail.push(pt(iso(p[0], p[1], 0.02)));
    }
    trailRef.current?.setAttribute('points', trail.join(' '));

    // Alarma encendida (solo la mosca de las sombras): anillos que no se apagan
    alarmRefs.current.forEach((el, i) => {
      if (!el) return;
      if (currentScene !== 'shadow' || tau < T.shadowStart + 200) {
        el.setAttribute('opacity', 0);
        return;
      }
      const ph = ((t / 700 + i * 0.5) % 1);
      const e = groundEllipse(0.25 + ph * 0.7);
      const c = iso(pos[0], pos[1], 0);
      el.setAttribute('cx', c[0].toFixed(1));
      el.setAttribute('cy', c[1].toFixed(1));
      el.setAttribute('rx', e.rx.toFixed(1));
      el.setAttribute('ry', e.ry.toFixed(1));
      el.setAttribute('opacity', (0.8 * (1 - ph)).toFixed(2));
    });

    // Sombras que cruzan la arena (las del pasado de B y la de la prueba)
    const sweep = sweepsFor(currentScene).find((sw) => t >= sw.t0 && t <= sw.t0 + sw.dur);
    const k = sweep ? (t - sweep.t0) / sweep.dur : -1;
    if (k < 0 || k > 1) {
      shadowBandRef.current?.setAttribute('opacity', 0);
      shadowEdgeRef.current?.setAttribute('opacity', 0);
    } else {
      const sx = lerp(0.5, 10.5, k);
      shadowBandRef.current?.setAttribute('points', poly([[sx - 1.6, 0, 0], [sx, 0, 0], [sx, BENCH.d, 0], [sx - 1.6, BENCH.d, 0]]));
      shadowBandRef.current?.setAttribute('opacity', 1);
      const edge = [iso(sx, 0, 0), iso(sx, BENCH.d, 0)];
      shadowEdgeRef.current?.setAttribute('x1', edge[0][0]);
      shadowEdgeRef.current?.setAttribute('y1', edge[0][1]);
      shadowEdgeRef.current?.setAttribute('x2', edge[1][0]);
      shadowEdgeRef.current?.setAttribute('y2', edge[1][1]);
      shadowEdgeRef.current?.setAttribute('opacity', 1);
    }

    // …y se abre la puerta de salida
    const d = Math.min(1, Math.max(0, (tau - T.doorAt) / T.doorDur));
    const [, dy] = screenOffset(0, 0, easeInOutCubic(d) * (A.h + 0.1));
    doorRef.current?.setAttribute('transform', `translate(0 ${dy.toFixed(1)})`);
    doorFrameRef.current?.setAttribute('data-open', d > 0 ? 'true' : 'false');
    if (doorLabelRef.current) {
      doorLabelRef.current.textContent = d > 0 ? '¡salida abierta!' : 'salida cerrada';
      doorLabelRef.current.setAttribute('data-open', d > 0 ? 'true' : 'false');
    }

    // Pasado de C: el suelo arde
    const heatOn = currentScene === 'heat' && t > HEAT.on && t < HEAT.off + 400;
    const heatLevel = heatOn ? Math.min(1, (t - HEAT.on) / 300) * Math.min(1, (HEAT.off + 400 - t) / 400) : 0;
    heatRef.current?.setAttribute('opacity', (heatLevel * (0.55 + 0.15 * Math.sin(t / 140))).toFixed(2));
    heatLabelRef.current?.setAttribute('opacity', heatLevel.toFixed(2));

    // Pasado de D: la hembra y sus rechazos
    if (femaleRef.current) {
      const shown = currentScene === 'rejection' ? Math.min(1, t / 300) * Math.min(1, Math.max(0, (TEST - 300 - t) / 400)) : 0;
      const kick = REJECTIONS.some((r) => t > r && t < r + 250) ? -6 : 0;
      femaleRef.current.setAttribute('opacity', shown.toFixed(2));
      femaleRef.current.setAttribute('transform', `translate(0 ${kick})`);
    }
    if (rejectRef.current) {
      const on = currentScene === 'rejection' && REJECTIONS.some((r) => t > r && t < r + 900);
      rejectRef.current.setAttribute('opacity', on ? 1 : 0);
    }

    const bar = progressRefs.current[currentScene];
    if (bar) bar.style.transform = `scaleX(${Math.min(1, t / END)})`;
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
        if (s.t >= END) {
          s.t = 0;
          s.scene = ORDER[(ORDER.indexOf(s.scene) + 1) % ORDER.length];
          setScene(s.scene);
          setCycle((c) => c + 1);
        }
      }

      const tau = s.t - TEST;
      const nextStage = tau < 0 ? 'past' : tau < T.shadowStart ? 'ready' : tau < T.result ? 'test' : 'result';
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
  const protocol = TraumaPredictionService.getProtocol(scene);
  const chem = protocol.neurochemistry;
  const isResult = stage === 'result';
  const isPast = stage === 'past';
  const outcomeAt = (() => {
    // La mosca en zigzag no se queda quieta: su etiqueta va fija en un rincón libre de la arena
    if (scene === 'shadow') return iso(3.0, 1.5, 1.2);
    const p = posAt(scene, STATIC_T);
    return iso(p[0], p[1], 0.9);
  })();

  return (
    <article className="experiment-card" id="simulador-trauma-mosca" ref={articleRef}>
      <div className="exp-header">
        <div className="exp-title-row">
          <span className="exp-tag">EXPERIMENTO 03</span>
          <h3 className="exp-title">La misma prueba, cuatro pasados: ¿qué hará cada mosca?</h3>
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
                      layoutId="arena-pill"
                      className="active-tab-indicator"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="protocol-kicker">
                    Escena {sc.letter} &middot; {TraumaPredictionService.getProtocol(id).kicker}
                  </span>
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
            aria-label={`${current.name}. ${isPast ? current.pastText : isResult ? current.result : TEST_INTRO}`}
          >
            <defs>
              <filter id="arena-soft" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.4" />
              </filter>
              <filter id="arena-blur-strong" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
              <filter id="arena-shadow-blur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
              <radialGradient id="arena-key-light" cx="22%" cy="18%" r="70%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.16" />
                <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="arena-vignette" cx="50%" cy="48%" r="70%">
                <stop offset="65%" stopColor="#000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
              </radialGradient>
              <linearGradient id="arena-top-sheen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFF6D8" stopOpacity="0.14" />
                <stop offset="70%" stopColor="#FFF6D8" stopOpacity="0" />
              </linearGradient>
              <clipPath id="arena-bench-clip">
                <polygon points={benchTop.map(pt).join(' ')} />
              </clipPath>
            </defs>

            <rect x="0" y="0" width="640" height="400" fill="url(#arena-key-light)" />

            <text x="20" y="32" className="forest-title">
              Escena {current.letter} &middot; {current.name}
            </text>
            <text x="20" y="52" className="forest-note">
              {current.past}
            </text>
            <text x="620" y="32" textAnchor="end" className="arena-phase" data-past={isPast}>
              {isPast ? '1 · SU PASADO' : '2 · LA PRUEBA'}
            </text>

            {/* Todo el diorama: en tonos de recuerdo mientras se muestra el pasado */}
            <g className="arena-scene" data-past={isPast}>

            {/* Mesa de laboratorio */}
            <polygon
              points={[iso(0.3, BENCH.d, -BENCH.t), iso(BENCH.w, BENCH.d, -BENCH.t), iso(BENCH.w, 0.3, -BENCH.t), iso(BENCH.w + 0.9, 0.6, -BENCH.t - 0.25), iso(BENCH.w + 0.6, BENCH.d + 0.6, -BENCH.t - 0.25), iso(0.6, BENCH.d + 0.9, -BENCH.t - 0.25)]
                .map(pt)
                .join(' ')}
              className="forest-slab-shadow"
              filter="url(#arena-blur-strong)"
            />
            <Facets polys={BENCH_POLYS} />
            <polygon points={benchTop.map(pt).join(' ')} fill="url(#arena-top-sheen)" />

            {/* Suelo de la arena y paredes del fondo */}
            <polygon points={ARENA_FLOOR} className="arena-floor" />
            <polygon ref={heatRef} points={ARENA_FLOOR} className="arena-heat" opacity="0" />
            {GRID.map(([a, b], i) => (
              <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="arena-grid" />
            ))}
            <polygon points={WALL_LEFT} className="arena-glass" />
            <polygon points={WALL_BACK_LEFT} className="arena-glass" />
            <polygon points={WALL_BACK_RIGHT} className="arena-glass" />
            <polygon ref={doorFrameRef} points={DOOR_FRAME} className="arena-door-frame" data-open="false" />
            <g ref={doorRef}>
              <Facets polys={DOOR_PANEL} />
            </g>
            <text ref={doorLabelRef} x={DOOR_LABEL[0]} y={DOOR_LABEL[1]} textAnchor="middle" className="arena-door-label" data-open="false">
              salida cerrada
            </text>

            <g clipPath="url(#arena-bench-clip)">
              {/* Sombras proyectadas */}
              <g className="forest-cast" filter="url(#arena-soft)">
                {FEEDER_SHADOWS.map((d, i) => (
                  <path key={i} d={d} />
                ))}
                <path ref={flyShadowRef} />
                <path d={FEMALE_SHADOW} className="forest-presence" data-hidden={!(scene === 'rejection' && isPast)} />
              </g>

              {/* La prueba: la sombra que cruza (cian), idéntica para todas */}
              <polygon ref={shadowBandRef} className="arena-shadow-band" filter="url(#arena-shadow-blur)" opacity="0" />
              <line ref={shadowEdgeRef} className="arena-shadow-edge" opacity="0" />

              {/* Estado interno: estela y alarma */}
              <polyline ref={trailRef} className="arena-trail" />
              {[0, 1].map((i) => (
                <ellipse key={i} ref={(el) => (alarmRefs.current[i] = el)} className="arena-alarm" opacity="0" />
              ))}
            </g>

            {/* Comederos */}
            <Facets polys={FEEDER_POLYS} />
            <text x={SUGAR_LABEL[0]} y={SUGAR_LABEL[1]} textAnchor="middle" className="forest-note">
              azúcar
            </text>
            <text x={ETHANOL_LABEL[0]} y={ETHANOL_LABEL[1]} textAnchor="middle" className="forest-note">
              alcohol
            </text>

            {/* Intención (ámbar): hacia dónde le empuja su pasado */}
            {(stage === 'test' || isResult) && INTENT[scene] && (
              <polyline key={`int${cycle}`} points={INTENT[scene]} className={`arena-intent ${scene === 'heat' ? 'is-refused' : ''}`} />
            )}

            {/* Pasado de D: la hembra que lo rechaza */}
            <g ref={femaleRef} opacity="0">
              <Facets polys={FEMALE_POLYS} />
              {FEMALE_EYES.map((e, i) => (
                <circle key={i} cx={e[0]} cy={e[1]} r="2.6" className="umwelt-eye" />
              ))}
              <text x={FEM_LABEL[0]} y={FEM_LABEL[1] - 26} textAnchor="middle" className="forest-note">
                hembra
              </text>
            </g>
            <text ref={rejectRef} x={REJECT_AT[0]} y={REJECT_AT[1]} textAnchor="middle" className="arena-reject" opacity="0">
              ✕ lo rechaza
            </text>

            {/* Mosca */}
            <g ref={flyGroupRef} opacity="0">
              {Array.from({ length: FLY_FACE_COUNT }, (_, i) => (
                <polygon key={i} ref={(el) => (flyFacetRefs.current[i] = el)} strokeWidth="0.6" strokeLinejoin="round" />
              ))}
              {FLY.eyes.map((_, i) => (
                <circle key={i} ref={(el) => (eyeRefs.current[i] = el)} r="2.6" className="umwelt-eye" />
              ))}
              {FLY.wings.map((_, i) => (
                <polygon key={i} ref={(el) => (wingRefs.current[i] = el)} className="umwelt-wing" />
              ))}
            </g>

            {/* Paredes delanteras del cristal */}
            <polygon points={WALL_RIGHT} className="arena-glass is-front" />
            <polygon points={WALL_FRONT} className="arena-glass is-front" />
            <polygon points={RIM} className="arena-rim" />

            {/* Pasado de C: cartel del calor */}
            <text ref={heatLabelRef} x={HEAT_LABEL[0]} y={HEAT_LABEL[1]} textAnchor="middle" className="arena-heat-label" opacity="0">
              40 °C · puerta cerrada · sin escapatoria
            </text>
            </g>

            {isResult && (
              <text key={`out${cycle}`} x={outcomeAt[0]} y={outcomeAt[1] - 18} textAnchor="middle" className="pum-label">
                {current.outcome}
              </text>
            )}

            <rect x="0" y="0" width="640" height="400" fill="url(#arena-vignette)" pointerEvents="none" />

            <g transform="translate(20 380)" className="forest-legend">
              <line x1="0" y1="0" x2="18" y2="0" className="arena-shadow-edge" />
              <text x="26" y="4">la prueba: sombra y puerta</text>
              <circle cx="190" cy="0" r="5" className="legend-sound" />
              <text x="202" y="4">lo que arrastra de su pasado</text>
            </g>
          </svg>
        </div>

        <div className="forest-caption" aria-live="polite">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.p
              key={`${scene}-${stage === 'ready' ? 'test' : stage}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] } }}
              exit={{ opacity: 0, transition: { duration: 0.12, ease: [0.23, 1, 0.32, 1] } }}
              className={isResult ? 'is-result' : ''}
              data-scene={scene === 'baseline' ? 'empty' : 'person'}
            >
              {isPast ? current.pastText : isResult ? current.result : TEST_INTRO}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="telemetry-row">
          <div className="telemetry-pill">
            <span>¿LA PRUEBA ES LA MISMA?</span>
            <strong style={{ color: 'var(--accent-cyan)' }}>Sí: sombra, puerta y comida idénticas</strong>
          </div>
          <div className="telemetry-pill">
            <span>¿QUÉ HACE?</span>
            <strong style={{ color: 'var(--accent-amber)' }}>
              {isResult ? current.eye : isPast ? 'Primero, mira su pasado…' : 'Observa…'}
            </strong>
          </div>
        </div>

        {/* Estado interno que deja su pasado */}
        <div className="control-box arena-state">
          <div className="arena-state-head">
            <span className="control-label-kicker">Lo que su pasado dejó dentro</span>
            <span className="citation-tag">{protocol.citation}</span>
          </div>
          {[
            ['Alerta defensiva', chem.arousal, 'var(--accent-crimson)'],
            ['Recompensa cerebral (Neuropéptido F)', chem.npf, 'var(--accent-violet)'],
            ['Ganas de moverse', chem.motorInitiative, 'var(--accent-emerald)'],
          ].map(([label, value, color]) => (
            <div className="metric-bar-group" key={label}>
              <div className="metric-bar-header">
                <span>{label}</span>
                <strong>{value}%</strong>
              </div>
              <div className="metric-track">
                <div className="metric-fill" style={{ background: color, transform: `scaleX(${value / 100})` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="readout-box" style={{ marginTop: '16px' }}>
          <strong>¿Por qué pasa esto?</strong> {protocol.predictionText.replace(/^PREDICCIÓN:\s*/, '')}
        </div>
      </div>
    </article>
  );
}
