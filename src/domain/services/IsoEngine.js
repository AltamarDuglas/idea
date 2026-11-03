/**
 * MOTOR ISOMÉTRICO MÍNIMO PARA LÁMINAS EN SVG
 *
 * Fuente única del estilo de las láminas (diorama isométrico). Todas las figuras importan
 * desde aquí: luz, paleta y proyección no se redefinen en ningún componente.
 *
 * Convenciones:
 * - Mundo en unidades; x hacia la derecha-abajo, y hacia la izquierda-abajo, z hacia arriba.
 * - Una cara es { pts: [[x,y,z], ...] (≥3, planos), hint: [nx,ny,nz] (hacia fuera), mat: 'clave' }.
 * - Todo es determinista: usa lcg(seed), nunca Math.random() durante el render.
 */

// --------------------------------------------------------------------------
// Proyección (viewBox 0 0 640 400, bloque de suelo de 10 × 6 unidades)
// --------------------------------------------------------------------------
export const U = 34;
export const COS30 = Math.cos(Math.PI / 6);
export const SIN30 = 0.5;
export const OX = 261;
export const OY = 95;

export const iso = (x, y, z = 0) => [OX + (x - y) * COS30 * U, OY + (x + y) * SIN30 * U - z * U];
export const isoP = (p) => iso(p[0], p[1], p[2]);
export const pt = ([sx, sy]) => `${sx.toFixed(1)},${sy.toFixed(1)}`;

// Un círculo de radio r sobre el suelo se proyecta como una elipse alineada con los ejes
export const groundEllipse = (r) => ({ rx: r * U * COS30 * Math.SQRT2, ry: r * U * SIN30 * Math.SQRT2 });

// --------------------------------------------------------------------------
// Álgebra
// --------------------------------------------------------------------------
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const normalize = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export const lcg = (seed) => () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

// --------------------------------------------------------------------------
// Luz, cámara y paleta (idénticas en todas las láminas)
// --------------------------------------------------------------------------
export const LIGHT = normalize([-0.9, 0.35, 1.3]); // arriba a la izquierda de la pantalla
export const VIEW = normalize([1, 1, 1]); // hacia la cámara isométrica
export const SHADOW_DX = -LIGHT[0] / LIGHT[2];
export const SHADOW_DY = -LIGHT[1] / LIGHT[2];

export const MATERIALS = {
  leaf: { h: 145, s: 44, l0: 13, l1: 42 },
  leafAlt: { h: 128, s: 40, l0: 15, l1: 46 },
  trunk: { h: 24, s: 40, l0: 14, l1: 36 },
  grass: { h: 92, s: 32, l0: 18, l1: 36 },
  soil: { h: 24, s: 30, l0: 11, l1: 27 },
  jacket: { h: 30, s: 48, l0: 22, l1: 50 },
  pants: { h: 220, s: 16, l0: 14, l1: 32 },
  skin: { h: 26, s: 46, l0: 30, l1: 74 },
  wood: { h: 30, s: 38, l0: 14, l1: 40 },
  ceramic: { h: 40, s: 18, l0: 30, l1: 84 },
  fruitRed: { h: 2, s: 62, l0: 18, l1: 52 },
  fruitGreen: { h: 75, s: 50, l0: 20, l1: 52 },
  book: { h: 205, s: 38, l0: 14, l1: 40 },
  flyBody: { h: 35, s: 22, l0: 8, l1: 30 },
  flyFemale: { h: 32, s: 42, l0: 20, l1: 58 },
  bench: { h: 210, s: 12, l0: 16, l1: 46 },
  sugar: { h: 135, s: 55, l0: 22, l1: 55 },
  ethanol: { h: 275, s: 50, l0: 24, l1: 60 },
  // Añade aquí materiales nuevos con la misma forma { h, s, l0, l1 }
};

const FOG_L = 10; // luminosidad del ambiente hacia la que se funden los objetos lejanos

export function shadeColor(mat, n, fog = 0) {
  const m = MATERIALS[mat];
  const d = Math.max(0, dot(n, LIGHT));
  let l = m.l0 + (m.l1 - m.l0) * d;
  let s = m.s;
  if (fog) {
    l += (FOG_L - l) * fog;
    s *= 1 - fog * 0.5;
  }
  return `hsl(${m.h}, ${s.toFixed(0)}%, ${l.toFixed(1)}%)`;
}

/**
 * Sombrea, descarta caras traseras y ordena de atrás hacia delante.
 * Devuelve [{ points, fill, depth }] listo para <polygon points fill stroke={fill} strokeWidth="0.6" />.
 */
export function shadeFaces(faces, fog = 0) {
  const out = [];
  for (const f of faces) {
    let n = normalize(cross(sub(f.pts[1], f.pts[0]), sub(f.pts[2], f.pts[0])));
    if (dot(n, f.hint) < 0) n = [-n[0], -n[1], -n[2]];
    if (dot(n, VIEW) <= 0.01) continue;
    const c = f.pts.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
    out.push({
      points: f.pts.map((p) => pt(isoP(p))).join(' '),
      fill: shadeColor(f.mat, n, fog),
      depth: dot(c, VIEW) / f.pts.length,
    });
  }
  return out.sort((a, b) => a.depth - b.depth);
}

/** Sombra proyectada: envolvente convexa de los vértices llevados al suelo siguiendo la luz. */
export function castShadowPath(points3d) {
  return hullPath(points3d.map((p) => iso(p[0] + p[2] * SHADOW_DX, p[1] + p[2] * SHADOW_DY, 0)));
}

/** Silueta en pantalla de un objeto (envolvente convexa de sus vértices proyectados). */
export function silhouettePath(points3d) {
  return hullPath(points3d.map(isoP));
}

/** Envolvente convexa (monotone chain) de puntos 2D como path SVG cerrado. */
export function hullPath(points2d) {
  const pts = [...points2d];
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const turn = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && turn(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && turn(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  return `M ${hull.map(pt).join(' L ')} Z`;
}

// --------------------------------------------------------------------------
// Primitivas
// --------------------------------------------------------------------------

/** Prisma rectangular alineado con los ejes (sin cara inferior). */
export function box(x0, x1, y0, y1, z0, z1, mat) {
  return [
    { pts: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], hint: [0, 0, 1], mat },
    { pts: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], hint: [1, 0, 0], mat },
    { pts: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], hint: [0, 1, 0], mat },
    { pts: [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], hint: [-1, 0, 0], mat },
    { pts: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], hint: [0, -1, 0], mat },
  ];
}

/** Cilindro facetado vertical (lados + tapa). */
export function cylinder(cx, cy, r, z0, z1, n, mat, topMat = mat) {
  const ring = (z) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z];
  });
  const lo = ring(z0);
  const hi = ring(z1);
  const faces = [{ pts: hi, hint: [0, 0, 1], mat: topMat }];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const mid = ((i + 0.5) / n) * Math.PI * 2;
    faces.push({ pts: [lo[i], lo[j], hi[j], hi[i]], hint: [Math.cos(mid), Math.sin(mid), 0], mat });
  }
  return faces;
}

/** Fruta low-poly: doble cono facetado con irregularidad determinista. */
export function bicone(cx, cy, r, z0, h, n, mat, seed = 1) {
  const rand = lcg(seed);
  const zMid = z0 + h * 0.45;
  const ring = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.9 + rand() * 0.2);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, zMid];
  });
  const top = [cx, cy, z0 + h];
  const bottom = [cx, cy, z0];
  const faces = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const mid = ((i + 0.5) / n) * Math.PI * 2;
    faces.push({ pts: [ring[i], ring[j], top], hint: [Math.cos(mid), Math.sin(mid), 0.6], mat });
    faces.push({ pts: [ring[j], ring[i], bottom], hint: [Math.cos(mid), Math.sin(mid), -0.6], mat });
  }
  return faces;
}

/** Bloque de suelo: tapa de hierba, labio de hierba y cantos de tierra (ya sombreado). */
export function groundSlab(w = 10, d = 6, t = 0.7, lip = 0.14) {
  return shadeFaces([
    { pts: [[0, 0, 0], [w, 0, 0], [w, d, 0], [0, d, 0]], hint: [0, 0, 1], mat: 'grass' },
    { pts: [[w, 0, -lip], [w, d, -lip], [w, d, -t], [w, 0, -t]], hint: [1, 0, 0], mat: 'soil' },
    { pts: [[0, d, -lip], [w, d, -lip], [w, d, -t], [0, d, -t]], hint: [0, 1, 0], mat: 'soil' },
    { pts: [[w, 0, 0], [w, d, 0], [w, d, -lip], [w, 0, -lip]], hint: [1, 0, 0], mat: 'grass' },
    { pts: [[0, d, 0], [w, d, 0], [w, d, -lip], [0, d, -lip]], hint: [0, 1, 0], mat: 'grass' },
  ]);
}

// Pino low-poly en coordenadas locales (u lateral, v profundidad, w altura)
const TIERS = [
  { w: 0.75, h: 1.45, r: 0.95 },
  { w: 1.45, h: 1.25, r: 0.74 },
  { w: 2.1, h: 1.05, r: 0.52 },
];

export function buildPineModel(seed, scale = 1) {
  const rand = lcg(seed);
  const faces = [];
  const ring = (n, r, w, jitter, offset) =>
    Array.from({ length: n }, (_, i) => {
      const a = offset + (i / n) * Math.PI * 2;
      const rr = r * (1 - jitter / 2 + rand() * jitter);
      return [Math.cos(a) * rr, Math.sin(a) * rr, w];
    });

  const trunkBottom = ring(6, 0.12, 0, 0, 0.3);
  const trunkTop = ring(6, 0.1, 1.2, 0, 0.3);
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const mid = 0.3 + ((i + 0.5) / 6) * Math.PI * 2;
    faces.push({ pts: [trunkBottom[i], trunkBottom[j], trunkTop[j], trunkTop[i]], hint: [Math.cos(mid), Math.sin(mid), 0], mat: 'trunk' });
  }

  TIERS.forEach((tier, ti) => {
    const offset = rand() * Math.PI;
    const base = ring(7, tier.r, tier.w, 0.28, offset);
    const apex = [(rand() - 0.5) * 0.08, (rand() - 0.5) * 0.08, tier.w + tier.h];
    for (let i = 0; i < 7; i++) {
      const j = (i + 1) % 7;
      const mid = offset + ((i + 0.5) / 7) * Math.PI * 2;
      faces.push({ pts: [base[i], base[j], apex], hint: [Math.cos(mid), Math.sin(mid), 0.4], mat: ti % 2 ? 'leafAlt' : 'leaf' });
    }
  });

  return {
    faces: faces.map((f) => ({ ...f, pts: f.pts.map((p) => p.map((v) => v * scale)) })),
    restRadius: TIERS[0].r * scale,
    scale,
  };
}

/**
 * Coloca un modelo local en el mundo, inclinado theta (rad) hacia +x.
 * Devuelve { faces, verts } para shadeFaces() y castShadowPath().
 */
export function placeModel(model, base, theta = 0) {
  const sin = Math.sin(theta);
  const cos = Math.cos(theta);
  const rot = (p) => [p[0] * cos + p[2] * sin, p[1], -p[0] * sin + p[2] * cos];
  const xf = (p) => {
    const r = rot(p);
    const lift = (model.restRadius || 0) * sin * Math.min(1, p[2] / (1.2 * (model.scale || 1)));
    return [base.x + r[0], base.y + r[1], r[2] + lift];
  };
  const faces = model.faces.map((f) => ({ pts: f.pts.map(xf), hint: rot(f.hint), mat: f.mat }));
  return { faces, verts: faces.flatMap((f) => f.pts) };
}

/** Gira un punto alrededor del eje vertical (z) un ángulo a (rad). */
export const rotateZ = (p, a) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};

/**
 * Mosca low-poly mirando hacia +x, modelada en el origen.
 * Devuelve caras (cuerpo y cabeza), ojos (puntos 3D) y alas (triángulos 3D) para dibujarlos aparte.
 */
export function buildFlyModel(scale = 1.8) {
  const k = (p) => p.map((v) => v * scale);
  const faces = [
    ...box(-0.2, 0.12, -0.08, 0.08, 0.05, 0.17, 'flyBody'),
    ...box(0.12, 0.22, -0.07, 0.07, 0.06, 0.16, 'flyBody'),
  ].map((f) => ({ ...f, pts: f.pts.map(k) }));
  return {
    faces,
    eyes: [k([0.21, -0.075, 0.13]), k([0.21, 0.075, 0.13])],
    wings: [
      [[-0.02, -0.05, 0.17], [-0.38, -0.27, 0.21], [-0.32, -0.03, 0.19]].map(k),
      [[-0.02, 0.05, 0.17], [-0.38, 0.27, 0.21], [-0.32, 0.03, 0.19]].map(k),
    ],
  };
}

/**
 * Persona low-poly hecha de prismas, de pie con los pies en el origen.
 * La cabeza se dibuja aparte como esfera: { faces, headZ, headR }.
 */
export function buildPersonModel() {
  return {
    faces: [
      ...box(-0.07, 0.07, -0.2, -0.06, 0, 0.85, 'pants'),
      ...box(-0.07, 0.07, 0.06, 0.2, 0, 0.85, 'pants'),
      ...box(-0.13, 0.13, -0.24, 0.24, 0.85, 1.62, 'jacket'),
      ...box(-0.06, 0.06, -0.36, -0.25, 0.95, 1.58, 'jacket'),
      ...box(-0.06, 0.06, 0.25, 0.36, 0.95, 1.58, 'jacket'),
    ],
    headZ: 1.92,
    headR: 0.25,
  };
}

// --------------------------------------------------------------------------
// Tiempo
// --------------------------------------------------------------------------
export const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const UI_EASE_OUT = [0.23, 1, 0.32, 1]; // mismo valor que --ease-out en tokens.css
