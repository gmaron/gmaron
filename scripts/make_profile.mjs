// Genera los SVG animados del perfil. Uso: node scripts/make_profile.mjs (desde la raíz del repo)
// Técnica: fuentes embebidas en base64, animaciones CSS en bucle, cero JS, cero dependencias.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

mkdirSync("assets", { recursive: true });

const C = {
  bg: "#0d1014",
  panel: "#12161b",
  line: "#222a33",
  dim: "#3d4752",
  muted: "#8b96a1",
  text: "#e8ecef",
  accent: "#ffb86b",
  green: "#8fe3a8",
  blue: "#8ab4f8",
};

const font = (w) =>
  `@font-face{font-family:J;font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(`fonts/jbm-${w}.woff2`).toString("base64")}) format('woff2')}`;
const BASE =
  font(400) +
  font(700) +
  `text{font-family:J,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre}` +
  `.b{font-weight:700}.t{fill:${C.text}}.m{fill:${C.muted}}.d{fill:${C.dim}}.a{fill:${C.accent}}.g{fill:${C.green}}.u{fill:${C.blue}}` +
  `@media (prefers-reduced-motion:reduce){*{animation:none!important;opacity:1!important;transform:none!important}.nt:not(.ntl){display:none!important}}`;

const CHAR = 0.6; // ancho de avance de JetBrains Mono, en em
const E = "cubic-bezier(.2,.7,.2,1)";
const pct = (v) => `${Math.max(0, Math.min(100, v)).toFixed(2)}%`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function fits(str, size, maxPx, where) {
  const px = str.length * CHAR * size;
  if (px > maxPx) throw new Error(`"${str}" mide ${px.toFixed(0)}px, máximo ${maxPx}px (${where})`);
}

const txt = (x, y, s, size, cls = "t", extra = "") =>
  `<text x="${x}" y="${y}" font-size="${size}" class="${cls}"${extra}>${esc(s)}</text>`;

const svg = (w, h, label, css, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><style>${BASE}${css}</style>${body}</svg>`;

// Visible entre t0 y t1 (segundos) en un bucle de P segundos.
function show(id, P, t0, t1, from = "transform:translateY(6px)", fade = 0.7) {
  const a = (t0 / P) * 100;
  const b = (t1 / P) * 100;
  const d = (fade / P) * 100;
  return (
    `@keyframes ${id}{0%,${pct(a)}{opacity:0;${from}}${pct(a + d)},${pct(b)}{opacity:1;transform:none}${pct(b + d)},100%{opacity:0;transform:none}}` +
    `.${id}{opacity:0;animation:${id} ${P}s ${E} infinite}`
  );
}

// Crece en x desde el borde izquierdo (para "tipear" con un clipPath).
function type(id, P, t0, dur, t1, steps) {
  const a = (t0 / P) * 100;
  const b = ((t0 + dur) / P) * 100;
  const c = (t1 / P) * 100;
  const d = (0.35 / P) * 100;
  return (
    `@keyframes ${id}{0%,${pct(a)}{transform:scaleX(0);animation-timing-function:steps(${steps},end)}${pct(b)},${pct(c)}{transform:scaleX(1)}${pct(c + d)},100%{transform:scaleX(0)}}` +
    `.${id}{transform-box:fill-box;transform-origin:0 50%;animation:${id} ${P}s linear infinite}`
  );
}

// Cursor que avanza con el tipeo (mismo ritmo que `type`) y se apaga en t1.
function cursor(id, P, t0, dur, t1, steps, dist) {
  const a = (t0 / P) * 100;
  const b = ((t0 + dur) / P) * 100;
  const c = (t1 / P) * 100;
  const d = (0.5 / P) * 100;
  return (
    `@keyframes ${id}{0%,${pct(a)}{transform:translateX(0);opacity:1;animation-timing-function:steps(${steps},end)}${pct(b)},${pct(c)}{transform:translateX(${dist}px);opacity:1}${pct(c + d)},100%{transform:translateX(${dist}px);opacity:0}}` +
    `.${id}{animation:${id} ${P}s linear infinite}`
  );
}

const blink = `@keyframes bl{0%,49%{opacity:1}50%,100%{opacity:0}}.bl{animation:bl 1.1s step-end infinite}`;

// ------------------------------------------------------------ diagrama
// Cajas y flechas como formas SVG que se dibujan trazo a trazo (stroke-dashoffset).
// Cada capa es una lista de piezas con un retraso relativo al inicio de su paso.
let dn = 0;
const draw = (P, t0, dur, hold, len) => {
  const id = `dr${dn++}`;
  const A = (t0 / P) * 100;
  const B = ((t0 + dur) / P) * 100;
  const D = (hold / P) * 100;
  const F = (0.8 / P) * 100;
  return {
    id,
    css:
      `@keyframes ${id}{0%,${pct(A)}{stroke-dashoffset:${len};opacity:1;animation-timing-function:cubic-bezier(.45,0,.2,1)}${pct(B)},${pct(D)}{stroke-dashoffset:0;opacity:1}${pct(D + F)},100%{stroke-dashoffset:0;opacity:0}}` +
      `.${id}{animation:${id} ${P}s linear infinite}`,
  };
};
const box = (x, y, w, h, label, col, d) => ({ k: "box", x, y, w, h, label, col, d });
const line = (x1, y1, x2, y2, col, d, dur) => ({ k: "line", x1, y1, x2, y2, col, d, dur });
const arrow = (x, y, dir, col, d) => ({ k: "arrow", x, y, dir, col, d });

const L = [
  [box(0, 0, 84, 44, "cliente", C.text, 0)],
  [line(84, 22, 105, 22, C.muted, 0, 0.6), arrow(112, 22, "r", C.muted, 0.5), box(112, 0, 60, 44, "LB", C.text, 0.6)],
  [line(172, 22, 193, 22, C.muted, 0, 0.6), arrow(200, 22, "r", C.muted, 0.5), box(200, 0, 72, 44, "API", C.text, 0.6)],
  [
    line(236, 44, 236, 80, C.accent, 0, 0.6),
    line(236, 80, 172, 80, C.accent, 0.5, 0.7),
    line(236, 80, 300, 80, C.accent, 0.5, 0.7),
    line(172, 80, 172, 105, C.accent, 1.1, 0.5),
    line(300, 80, 300, 105, C.accent, 1.1, 0.5),
    arrow(172, 112, "d", C.accent, 1.5),
    arrow(300, 112, "d", C.accent, 1.5),
    box(130, 112, 84, 44, "cache", C.accent, 1.5),
    box(258, 112, 84, 44, "postgres", C.accent, 1.8),
  ],
  [line(300, 156, 300, 169, C.green, 0, 0.5), arrow(300, 176, "d", C.green, 0.45), box(258, 176, 84, 44, "réplica", C.green, 0.5)],
];

const DIAGRAM_STEPS = [13.0, 15.4, 17.8, 20.2, 23.2];

function diagramLayer(items, at, o, P, hold) {
  let css = "";
  let out = "";
  for (const it of items) {
    const t0 = at + it.d;
    if (it.k === "line") {
      const len = Math.abs(it.x2 - it.x1) + Math.abs(it.y2 - it.y1);
      const dr = draw(P, t0, it.dur, hold, len);
      css += dr.css;
      out += `<line class="${dr.id}" x1="${o.x + it.x1}" y1="${o.y + it.y1}" x2="${o.x + it.x2}" y2="${o.y + it.y2}" stroke="${it.col}" stroke-width="1.3" stroke-dasharray="${len}" stroke-dashoffset="${len}"/>`;
    } else if (it.k === "arrow") {
      const id = `ar${dn++}`;
      css += show(id, P, t0, hold, "", 0.4);
      const x = o.x + it.x;
      const y = o.y + it.y;
      const pts = it.dir === "r" ? `${x},${y} ${x - 7},${y - 4} ${x - 7},${y + 4}` : `${x},${y} ${x - 4},${y - 7} ${x + 4},${y - 7}`;
      out += `<polygon class="${id}" points="${pts}" fill="${it.col}"/>`;
    } else {
      const per = 2 * (it.w + it.h);
      const dr = draw(P, t0, 0.9, hold, per);
      css += dr.css;
      out += `<rect class="${dr.id}" x="${o.x + it.x}" y="${o.y + it.y}" width="${it.w}" height="${it.h}" rx="4" fill="none" stroke="${it.col}" stroke-width="1.3" stroke-dasharray="${per}" stroke-dashoffset="${per}"/>`;
      const id = `lb${dn++}`;
      css += show(id, P, t0 + 0.6, hold, "", 0.5);
      out += `<text class="${id} b" x="${o.x + it.x + it.w / 2}" y="${o.y + it.y + it.h / 2 + 4}" font-size="11" text-anchor="middle" fill="${it.col}">${esc(it.label)}</text>`;
    }
  }
  return { css, out };
}

// ------------------------------------------------------------------- hero
function hero() {
  const W = 846;
  const H = 396;
  const P = 36; // bucle largo: tipeo, herramientas, respuesta, diagrama y una pausa final
  const HOLD = 32; // hasta acá queda todo en pantalla
  const x0 = 34;
  const fs = 13;
  const cw = fs * CHAR;

  const prompt = '❯ claude "¿quién es gmaron?"';
  fits(prompt, fs, 360, "prompt");

  const tools = [
    ["Read(experiencia.md)", "Technical Leader de Agents IA", 5.0],
    ['Grep(aulas, "system design")', "docente UNLP +10 años · EducaciónIT", 6.8],
    ["Bash(ls equipos/)", "120+ ingenieros en BBVA · DevOps para 600+ devs", 8.6],
  ];

  let css = blink;
  let body = "";

  // marco de la terminal
  body += `<rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>`;
  body += `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="11.5" fill="none" stroke="${C.line}"/>`;
  body += `<rect x=".5" y=".5" width="${W - 1}" height="34" rx="11.5" fill="${C.panel}"/><rect x=".5" y="22" width="${W - 1}" height="13" fill="${C.panel}"/>`;
  body += `<line x1=".5" y1="35" x2="${W - 0.5}" y2="35" stroke="${C.line}"/>`;
  [["#ff5f57", 20], ["#febc2e", 40], ["#28c840", 60]].forEach(([f, x]) => (body += `<circle cx="${x}" cy="17.5" r="5.5" fill="${f}"/>`));
  body += txt(W / 2, 22, "gmaron — System Design w/ IA", 11, "m", ' text-anchor="middle"');

  // línea tipeada
  const typeAt = 0.9;
  const typeDur = 3.4; // ~0,12 s por letra
  css += type("ty", P, typeAt, typeDur, HOLD, prompt.length);
  css += cursor("cm", P, typeAt, typeDur, 25.6, prompt.length, +(prompt.length * cw).toFixed(1));
  body += `<clipPath id="cp"><rect class="ty" x="${x0}" y="60" width="${prompt.length * cw + 4}" height="22"/></clipPath>`;
  body += `<g clip-path="url(#cp)">${txt(x0, 76, prompt, fs, "t b")}</g>`;
  body += `<g class="cm"><rect class="bl" x="${x0}" y="64" width="${cw}" height="14" fill="${C.accent}"/></g>`;

  // salidas de herramientas
  tools.forEach(([tool, res, at], i) => {
    const y = 112 + i * 52;
    const id = `tl${i}`;
    css += show(id, P, at, HOLD);
    fits(`● ${tool}`, fs, 380, tool);
    fits(`  ⎿  ${res}`, 12, 400, res);
    body += `<g class="${id}">${txt(x0, y, "●", fs, "g")}${txt(x0 + 2 * cw, y, tool, fs, "u b")}${txt(x0, y + 20, "⎿  " + res, 12, "m", ` dx="${cw * 2}"`)}</g>`;
  });

  // respuesta final
  css += show("ans", P, 10.8, HOLD);
  const ans = [
    "Forma ingenieros en system design,",
    "arquitectura e IA, con criterio.",
  ];
  ans.forEach((s, i) => fits(s, fs, 390, "ans"));
  body += `<g class="ans">${txt(x0, 288, "●", fs, "a")}${ans
    .map((s, i) => txt(x0 + 2 * cw, 288 + i * 20, s, fs, "t"))
    .join("")}</g>`;

  // panel del diagrama (derecha)
  const px = 436;
  const py = 54;
  const pw = W - px - 24;
  const ph = 304;
  body += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="8" fill="${C.panel}" stroke="${C.line}"/>`;
  css += show("dh", P, 12.0, HOLD, "");
  body += `<g class="dh">${txt(px + 16, py + 24, "# diseñando un servicio, de a una capa", 11, "m")}</g>`;

  const org = { x: px + 16, y: py + 44 };
  L.forEach((items, i) => {
    const r = diagramLayer(items, DIAGRAM_STEPS[i], org, P, HOLD);
    css += r.css;
    body += r.out;
  });

  // etiquetas de cada paso
  const notes = [
    [13.0, "1 · alguien hace una pregunta"],
    [15.4, "2 · reparto el trabajo"],
    [17.8, "3 · la lógica vive en un solo lugar"],
    [20.2, "4 · lo repetido va a cache; lo importante, a disco"],
    [23.2, "5 · leer escala distinto que escribir"],
  ];
  notes.forEach(([at, s], i) => {
    const id = `nt${i}`;
    const end = i < notes.length - 1 ? notes[i + 1][0] - 0.2 : HOLD;
    css += show(id, P, at, end, "", 0.6);
    fits(s, 11, pw - 32, s);
    body += `<g class="${id} nt${i === notes.length - 1 ? " ntl" : ""}">${txt(px + 16, py + ph - 20, s, 11, "a")}</g>`;
  });

  // prompt final
  css += show("end", P, 25.6, HOLD, "");
  body += `<g class="end">${txt(x0, 358, "❯", fs, "g")}<rect class="bl" x="${x0 + 2 * cw}" y="346" width="${cw}" height="14" fill="${C.text}"/></g>`;

  return svg(
    W,
    H,
    "Una terminal de gmaron: un agente responde quién es Gastón Marón (Technical Leader de Agents IA, docente en UNLP y EducaciónIT) mientras dibuja un diagrama de system design capa por capa: cliente, balanceador, API, cache, base de datos y réplica.",
    css,
    body,
  );
}

// ------------------------------------------------------------------ tiles
function tile(name, { file, side, W = 423, H = 210, title, tag, meta, scene }) {
  const P = 14;
  const GAP = 12; // margen transparente del lado que da al otro tile: los bordes externos alinean con el hero
  const IW = W - GAP;
  const OFF = side === "right" ? GAP : 0;
  let css = "";
  let body = `<rect width="${IW}" height="${H}" rx="12" fill="${C.bg}"/><rect x=".5" y=".5" width="${IW - 1}" height="${H - 1}" rx="11.5" fill="none" stroke="${C.line}"/>`;
  fits(title, 17, IW - 48, title);
  fits(tag, 12, IW - 48, tag);
  fits(meta, 11, IW - 48, meta);
  body += txt(24, 36, title, 17, "a b");
  body += txt(24, 58, tag, 12, "t");
  const s = scene({ W, H, P, show, txt, fits });
  css += s.css;
  body += s.body;
  body += txt(24, H - 20, meta, 11, "m");
  writeFileSync(`assets/${file}`, svg(W, H, `${title}: ${tag}`, css, `<g transform="translate(${OFF} 0)">${body}</g>`));
}

tile("message-summarize", {
  file: "tile-message-summarize.svg",
  side: "left",
  title: "message-summarize",
  tag: "Resumí tus mensajes sin leer con tu LLM.",
  meta: "TypeScript · WhatsApp primero · modelo a elección",
  scene: ({ P }) => {
    let css = "";
    let body = "";
    const x = 24;
    const msgs = [
      ["Marcos", "che, ¿viste el deploy de ayer?", 1.0],
      ["Grupo TP2", "G3 entregó el informe de avance", 2.2],
      ["Lu", "te paso el PDF a la noche", 3.4],
      ["Grupo TP2", "G5 pregunta por el formato", 4.6],
    ];
    msgs.forEach(([who, m, at], i) => {
      const id = `m${i}`;
      css += show(id, P, at, 7.6);
      const s = `${who.padEnd(10)}${m}`;
      fits(s, 11, 380, s);
      body += `<g class="${id}">${txt(x, 92 + i * 20, who.padEnd(10), 11, "u")}${txt(x + 10 * 11 * CHAR, 92 + i * 20, m, 11, "m")}</g>`;
    });
    css += show("sm", P, 8.4, 12.8);
    const sum = [
      "▸ 4 mensajes · 2 grupos",
      "▸ pendiente: PDF de Lu, formato para G5",
    ];
    sum.forEach((s) => fits(s, 12, 380, s));
    body += `<g class="sm">${txt(x, 98, sum[0], 12, "g b")}${txt(x, 122, sum[1], 12, "t")}</g>`;
    return { css, body };
  },
});

tile("tpii", {
  file: "tile-tpii.svg",
  side: "right",
  title: "Docente tpii",
  tag: "Ing. en Computación · UNLP",
  meta: "300+ ingenieros pasaron por mis clases",
  scene: ({ P }) => {
    let css = "";
    let body = "";
    const groups = ["G1", "G2", "G3", "G4", "G5"];
    const x = 24;
    const states = ["plan", "avance 1", "avance 2", "final"];
    // encabezado de etapas
    states.forEach((s, j) => {
      body += txt(x + 52 + j * 84, 86, s, 10, "m");
    });
    groups.forEach((g, i) => {
      const y = 106 + i * 17;
      body += txt(x, y, g, 11, "u b");
      states.forEach((_, j) => {
        const id = `c${i}_${j}`;
        const at = 1.0 + j * 2.6 + i * 0.35;
        const cx = x + 52 + j * 84;
        css += show(id, P, at, 12.8, "");
        body += `<rect x="${cx}" y="${y - 9}" width="9" height="9" rx="2" fill="none" stroke="${C.dim}"/>`;
        body += `<g class="${id}"><rect x="${cx}" y="${y - 9}" width="9" height="9" rx="2" fill="${j === 3 ? C.accent : C.green}"/></g>`;
      });
    });
    return { css, body };
  },
});

writeFileSync("assets/hero.svg", hero());
console.log("ok: assets/hero.svg, tile-message-summarize.svg, tile-tpii.svg");
