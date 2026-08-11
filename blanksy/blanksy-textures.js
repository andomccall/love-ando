// Procedural grayscale materials for Blanksy. Grayscale on purpose: the map multiplies
// the chosen skin color, so every texture works with any color in the picker.
const SIZE = 512;

function canvas() {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  return c;
}
function hash(x, y, s) {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return n - Math.floor(n);
}
function noise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
function fbm(x, y, s, oct = 4) {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += amp * noise(x * f, y * f, s + i); f *= 2; amp *= 0.5; }
  return v;
}
function paint(fn) {
  const c = canvas(), ctx = c.getContext('2d'), img = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const g = Math.max(0, Math.min(255, fn(x, y) * 255)) | 0, i = (y * SIZE + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = g; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

const RECIPES = {
  stone: {
    label: 'STONE', repeat: 2.5, roughness: 0.92, metalness: 0.0, bump: 0.055,
    draw: () => paint((x, y) => {
      const n = fbm(x / 42, y / 42, 3, 5), grit = hash(x, y, 9) * 0.14;
      const vein = Math.abs(fbm(x / 90, y / 90, 17, 3) - 0.5) < 0.035 ? -0.16 : 0;
      return 0.52 + (n - 0.5) * 0.75 + grit + vein;
    })
  },
  metal: {
    label: 'METAL', repeat: 1.6, roughness: 0.28, metalness: 0.62, bump: 0.006,
    draw: () => paint((x, y) => {
      const brush = hash(1, y, 3) * 0.10 + fbm(x / 220, y / 3, 5, 2) * 0.14;
      return 0.74 + brush - 0.07;
    })
  },
  rusted: {
    label: 'RUSTED', repeat: 2.0, roughness: 0.74, metalness: 0.42, bump: 0.045,
    draw: () => paint((x, y) => {
      const base = 0.72 + hash(1, y, 3) * 0.07;
      const patch = fbm(x / 55, y / 55, 21, 5);
      const rust = patch > 0.52 ? (patch - 0.52) * 2.6 : 0;
      const pit = hash(x, y, 4) > 0.985 ? -0.3 : 0;
      return base - rust * 0.62 + (hash(x, y, 7) - 0.5) * rust * 0.5 + pit;
    })
  },
  wood: {
    label: 'WOOD', repeat: 1.4, roughness: 0.62, metalness: 0.0, bump: 0.03,
    draw: () => paint((x, y) => {
      const warp = fbm(x / 130, y / 26, 11, 3) * 5.5;
      const rings = Math.sin((x / 13) + warp) * 0.5 + 0.5;
      const grain = hash(x, y, 2) * 0.07;
      return 0.62 - Math.pow(rings, 2.4) * 0.42 + grain;
    })
  },
  yarn: {
    label: 'YARN', repeat: 7, roughness: 0.95, metalness: 0.0, bump: 0.13,
    draw: () => paint((x, y) => {
      const u = x / SIZE * Math.PI * 8, v = y / SIZE * Math.PI * 8;
      const braid = Math.sin(u + Math.sin(v) * 1.4) * Math.cos(v * 0.5);
      const strand = Math.pow(Math.abs(Math.sin(u * 1.5 + v * 1.5)), 0.6);
      return 0.6 + braid * 0.22 - strand * 0.22 + hash(x, y, 6) * 0.09;
    })
  },
  wool: {
    label: 'WOOL', repeat: 5, roughness: 1.0, metalness: 0.0, bump: 0.1,
    draw: () => paint((x, y) => {
      const puff = fbm(x / 14, y / 14, 31, 4), fine = fbm(x / 4, y / 4, 41, 3);
      return 0.66 + (puff - 0.5) * 0.5 + (fine - 0.5) * 0.28;
    })
  }
};

export const TEXTURES = Object.entries(RECIPES).map(([id, r]) => ({ id, label: r.label }));

// ---- band + glove prints: colored, so they read on their own ----
function paintRGB(fn) {
  const c = canvas(), ctx = c.getContext('2d'), img = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const [r, g, b] = fn(x, y), i = (y * SIZE + x) * 4;
    img.data[i] = Math.min(255, r * 255); img.data[i + 1] = Math.min(255, g * 255);
    img.data[i + 2] = Math.min(255, b * 255); img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
function hsl(h, s, l) {
  const f = n => {
    const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(Math.min(k - 3, 9 - k), 1));
  };
  return [f(0), f(8), f(4)];
}

const PRINTS = {
  holofoil: {
    label: 'HOLOFOIL', repeat: 1.4, roughness: 0.14, metalness: 0.85,
    draw: () => paintRGB((x, y) => {
      const sweep = (x * 0.7 + y * 1.3) / SIZE + fbm(x / 70, y / 70, 5, 3) * 0.55;
      const [r, g, b] = hsl(sweep % 1, 0.85, 0.58 + Math.sin(x / 9) * 0.06);
      const shine = Math.pow(Math.abs(Math.sin((x + y) / 26)), 6) * 0.35;
      return [r + shine, g + shine, b + shine];
    })
  },
  pixie: {
    label: 'PIXIE LIGHTS', repeat: 2, roughness: 0.42, metalness: 0.2, emissive: 2.6,
    draw: () => paintRGB((x, y) => {
      const base = 0.06 + fbm(x / 60, y / 60, 13, 3) * 0.08;
      const cellX = Math.floor(x / 10), cellY = Math.floor(y / 10);
      const s = hash(cellX, cellY, 3);
      const d = Math.hypot((x % 10) - 5, (y % 10) - 5);
      const glow = s > 0.62 ? Math.pow(Math.max(0, 1 - d / 5), 1.6) : 0;
      const [r, g, b] = hsl(hash(cellX, cellY, 9), 0.62, 0.72);
      return [base + r * glow * 1.35, base * 1.1 + g * glow * 1.35, base * 1.4 + b * glow * 1.35];
    })
  },
  textile: {
    label: 'TEXTILE', repeat: 6, roughness: 0.96, metalness: 0.0, bump: 0.09,
    draw: () => paintRGB((x, y) => {
      const warp = Math.floor(x / 6) % 2 === 0, over = Math.floor(y / 6) % 2 === 0;
      const t = (warp === over ? 0.88 : 0.64) + (hash(x, y, 2) - 0.5) * 0.12;
      const rib = Math.abs(Math.sin((warp === over ? y : x) / 3.2)) * 0.1;
      return [t + rib, (t + rib) * 0.975, (t + rib) * 0.93];
    })
  },
  floral: {
    label: 'FLOWERS', repeat: 4, roughness: 0.6, metalness: 0.0,
    draw: () => {
      const c = canvas(), ctx = c.getContext('2d');
      ctx.fillStyle = '#f4efe6';
      ctx.fillRect(0, 0, SIZE, SIZE);
      const step = SIZE / 4;
      for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 4; gx++) {
        const cx = gx * step + step / 2 + (hash(gx, gy, 1) - 0.5) * step * 0.3;
        const cy = gy * step + step / 2 + (hash(gx, gy, 2) - 0.5) * step * 0.3;
        const petal = step * 0.15;
        const [r, g, b] = hsl(hash(gx, gy, 3) * 0.2 + 0.9, 0.62, 0.56);
        ctx.strokeStyle = '#7f8f6a';
        ctx.lineWidth = SIZE / 190;
        ctx.beginPath();
        ctx.moveTo(cx, cy + petal * 1.4);
        ctx.quadraticCurveTo(cx + petal, cy + petal * 3, cx + petal * 0.3, cy + petal * 4.2);
        ctx.stroke();
        ctx.fillStyle = `rgb(${r * 255 | 0},${g * 255 | 0},${b * 255 | 0})`;
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2 + hash(gx, gy, 4) * 3;
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(a) * petal, cy + Math.sin(a) * petal, petal * 0.82, petal * 0.55, a, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#e8c85a';
        ctx.beginPath();
        ctx.arc(cx, cy, petal * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      return c;
    }
  }
};

export const PRINTS_LIST = Object.entries(PRINTS).map(([id, r]) => ({ id, label: r.label }));

const printCache = {};
export function applyPrint(THREE, mat, id) {
  const r = PRINTS[id];
  if (!r) {
    mat.map = null; mat.bumpMap = null; mat.emissiveMap = null;
    mat.emissive.set('#000000'); mat.emissiveIntensity = 1;
    mat.roughness = 0.45; mat.metalness = 0.05;
    mat.needsUpdate = true;
    return;
  }
  if (!printCache[id]) {
    const tex = new THREE.CanvasTexture(r.draw());
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(r.repeat, r.repeat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    printCache[id] = tex;
  }
  const tex = printCache[id];
  mat.map = tex;
  mat.bumpMap = r.bump ? tex : null;
  mat.bumpScale = r.bump || 0;
  mat.emissiveMap = r.emissive ? tex : null;
  mat.emissive.set(r.emissive ? '#ffffff' : '#000000');
  mat.emissiveIntensity = r.emissive || 1;
  mat.roughness = r.roughness;
  mat.metalness = r.metalness;
  mat.needsUpdate = true;
}

const cache = {};
export function applyTexture(THREE, mats, id) {
  const list = Array.isArray(mats) ? mats : [mats];
  const r = RECIPES[id];
  for (const m of list) {
    if (!r) {
      m.map = null; m.bumpMap = null; m.needsUpdate = true;
      continue;
    }
    if (!cache[id]) {
      const tex = new THREE.CanvasTexture(r.draw());
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(r.repeat, r.repeat);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const bump = tex.clone();
      bump.colorSpace = THREE.NoColorSpace;
      bump.needsUpdate = true;
      cache[id] = { tex, bump, r };
    }
    const c = cache[id];
    m.map = c.tex;
    m.bumpMap = c.bump;
    m.bumpScale = c.r.bump;
    m.roughness = c.r.roughness;
    m.metalness = c.r.metalness;
    m.needsUpdate = true;
  }
  return r ? { roughness: r.roughness, metalness: r.metalness } : null;
}
