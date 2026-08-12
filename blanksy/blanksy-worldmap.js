// THE BLOCK — an explorable neighborhood for Blanksy to roam. Bigger and more open
// than the built sets: a central plaza ringed by shopfronts, with a fountain
// landmark, benches, lamps, trees and a food cart. Everything solid reports a
// collider so WALK mode can't pass through it. Ground sits at the model's foot
// level so he's planted, never floating.
//
// Shape mirrors the env sets ({ group, bg, colliders, floorY }) so the page's
// existing WALK + camera-follow drive it with one collider-source swap.

export function createWorldmap(THREE, stage, envs) {
  const Y = envs.floorY ?? 0;                 // foot level, keeps him grounded
  const group = new THREE.Group();
  group.visible = false;
  stage._scene.add(group);
  const cols = [];                            // world-space AABBs {x0,x1,z0,z1}

  const M = (color, o) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
  function mesh(geo, mat, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true; group.add(m); return m;
  }
  const box = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, Y + y, z);
  const cyl = (r, h, mat, x, y, z, s = 20) => mesh(new THREE.CylinderGeometry(r, r, h, s), mat, x, Y + y, z);
  // register a collider footprint (with a little padding so he doesn't clip corners)
  const solid = (x, z, w, d, pad = 0.15) => cols.push({ x0: x - w / 2 - pad, x1: x + w / 2 + pad, z0: z - d / 2 - pad, z1: z + d / 2 + pad });

  function tex(w, h, draw, rx = 1, ry = 1) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8;
    return t;
  }
  const fill = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

  // ---------- ground: plaza + street + grass verges ----------
  const paveTex = tex(256, 256, (c, w) => {
    fill(c, 0, 0, w, w, '#c8c2b4');
    for (let i = 0; i < 500; i++) fill(c, Math.random() * w, Math.random() * w, 3, 3, Math.random() < .5 ? '#bcb6a6' : '#d4cfc0');
    c.strokeStyle = '#a8a294'; c.lineWidth = 4;
    for (let i = 0; i <= w; i += 64) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, w); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); }
  }, 16, 16);
  const gfloor = mesh(new THREE.PlaneGeometry(48, 48), M('#ffffff', { map: paveTex })); gfloor.rotation.x = -Math.PI / 2; gfloor.position.y = Y; gfloor.castShadow = false;
  // asphalt street across the south
  const road = tex(128, 128, (c, w) => { fill(c, 0, 0, w, w, '#3b3f45'); for (let i = 0; i < 300; i++) fill(c, Math.random() * w, Math.random() * w, 2, 2, Math.random() < .5 ? '#33373c' : '#454a51'); }, 10, 3);
  const street = mesh(new THREE.PlaneGeometry(48, 9), M('#ffffff', { map: road })); street.rotation.x = -Math.PI / 2; street.position.set(0, Y + 0.01, 18); street.castShadow = false;
  for (let i = -4; i <= 4; i++) box(1.8, 0.02, 0.16, M('#f2c744'), i * 3.2, 0.02, 18);
  // grass verge behind the shops
  const grass = tex(128, 128, (c, w) => { fill(c, 0, 0, w, w, '#6f9e56'); for (let i = 0; i < 700; i++) { const r = Math.random(); fill(c, Math.random() * w, Math.random() * w, 2, 4, r < .5 ? '#5d8c47' : r < .9 ? '#82b062' : '#e8d95e'); } }, 12, 4);
  const verge = mesh(new THREE.PlaneGeometry(48, 6), M('#ffffff', { map: grass })); verge.rotation.x = -Math.PI / 2; verge.position.set(0, Y + 0.005, -21); verge.castShadow = false;

  // ---------- shopfronts along the north edge ----------
  const winTex = (base, mortar) => tex(256, 512, (c, w, h) => {
    fill(c, 0, 0, w, h, base);
    for (let y = 0; y < 26; y++) for (let x = 0; x < 9; x++) fill(c, x * 30 + (y % 2 ? 15 : 0), y * 20, 26, 16, mortar);
    for (let y = 0; y < 7; y++) for (let x = 0; x < 4; x++) { const s = (x * 7 + y * 3) % 5; fill(c, 12 + x * 60, 24 + y * 66, 44, 50, '#2b3138'); fill(c, 14 + x * 60, 26 + y * 66, 40, 46, s === 0 ? '#ffdf94' : s === 1 ? '#8fc6de' : s === 2 ? '#f2a65e' : '#3c4a55'); }
  }, 3, 4);
  function signTex(text, bg, fg) {
    return tex(512, 128, (g, w, h) => { fill(g, 0, 0, w, h, bg); g.fillStyle = fg; g.textAlign = 'center'; g.font = '700 92px "Bebas Neue", Impact, sans-serif'; g.fillText(text, w / 2, 96); });
  }
  const shops = [
    { x: -16, w: 6, h: 7, base: '#8f4a3f', mortar: '#a8574a', name: 'CAFE', awn: '#c5453b', sign: '#1b6f4a' },
    { x: -9.5, w: 6, h: 8.5, base: '#6f7d8c', mortar: '#8494a3', name: 'BOOKS', awn: '#2f6b8c', sign: '#14324a' },
    { x: -2.5, w: 7, h: 6.5, base: '#a8713f', mortar: '#bf8a52', name: 'DELI', awn: '#f4ece0', sign: '#1b6f4a' },
    { x: 5, w: 6, h: 9, base: '#5a6470', mortar: '#6f7b88', name: 'RECORDS', awn: '#8a5aa8', sign: '#2b2340' },
    { x: 12.5, w: 7, h: 7.5, base: '#9a7b4a', mortar: '#b0925c', name: 'MARKET', awn: '#39a06a', sign: '#14402a' }
  ];
  shops.forEach(s => {
    box(s.w, s.h, 5, M('#ffffff', { map: winTex(s.base, s.mortar), roughness: 0.95 }), s.x, s.h / 2, -17);
    solid(s.x, -17, s.w, 5);
    // awning
    box(s.w - 0.4, 0.14, 1.6, M(s.awn), s.x, 3.0, -14.2);
    // sign
    mesh(new THREE.PlaneGeometry(s.w - 1, 0.9), new THREE.MeshBasicMaterial({ map: signTex(s.name, s.sign, '#ffe98a') }), s.x, Y + 3.9, -14.38);
    // door glow
    box(1.4, 2.4, 0.1, M('#2b3138', { emissive: '#ffdf94', emissiveIntensity: 0.25 }), s.x, 1.2, -14.35);
  });

  // ---------- central fountain landmark ----------
  const stone = M('#b8b2a4', { roughness: 0.9 });
  cyl(2.4, 0.5, stone, 0, 0.25, 0, 32); solid(0, 0, 5.0, 5.0, 0.05);
  cyl(2.1, 0.16, new THREE.MeshPhysicalMaterial({ color: '#8fc6de', roughness: 0.1, transmission: 0.4, transparent: true, opacity: 0.7 }), 0, 0.5, 0, 32);
  cyl(0.35, 1.4, stone, 0, 1.0, 0, 16);
  cyl(0.9, 0.18, stone, 0, 1.7, 0, 20);
  mesh(new THREE.SphereGeometry(0.22, 16, 12), M('#8fc6de', { emissive: '#8fc6de', emissiveIntensity: 0.3 }), 0, Y + 2.0, 0);

  // ---------- props ----------
  function bench(x, z, ry) {
    const b = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.55), M('#8a5a3b')); seat.position.y = Y + 0.45; seat.castShadow = seat.receiveShadow = true; b.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.09), M('#8a5a3b')); back.position.set(0, Y + 0.7, -0.24); b.add(back);
    [-0.85, 0.85].forEach(dx => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.5), M('#2f6b4f')); l.position.set(dx, Y + 0.22, 0); b.add(l); });
    b.position.set(x, 0, z); b.rotation.y = ry; group.add(b);
    solid(x, z, 2.2, 0.7);
  }
  function lamp(x, z) {
    cyl(0.07, 5, M('#2f4034'), x, 2.5, z, 12);
    mesh(new THREE.SphereGeometry(0.2, 14, 12), M('#fff6d8', { emissive: '#ffdf94', emissiveIntensity: 0.6 }), x, Y + 5.0, z);
    const p = new THREE.PointLight(0xffedc4, 6, 12, 2); p.position.set(x, Y + 4.8, z); group.add(p);
    solid(x, z, 0.5, 0.5);
  }
  function tree(x, z, s = 1) {
    cyl(0.16 * s, 2.4 * s, M('#6b4a33'), x, 1.2 * s, z, 10);
    const ca = mesh(new THREE.IcosahedronGeometry(1.3 * s, 1), M(['#4f8a45', '#79ad4f', '#3f7a4a'][(x * 3 + z) % 3 | 0] || '#4f8a45', { roughness: 0.95 }), x, Y + 2.9 * s, z); ca.scale.y = 0.85;
    solid(x, z, 0.7, 0.7);
  }
  // food cart
  function cart(x, z) {
    const c = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.2), M('#c5453b')); body.position.y = Y + 0.9; body.castShadow = true; c.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.6), M('#f4ece0')); roof.position.y = Y + 1.7; c.add(roof);
    [-1.1, 1.1].forEach(dx => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 16), M('#2b3033')); w.rotation.z = Math.PI / 2; w.position.set(dx, Y + 0.3, 0.5); c.add(w); });
    c.position.set(x, 0, z); group.add(c);
    solid(x, z, 2.2, 1.4);
  }
  bench(-6, 6, 0.2); bench(6, 6, -0.2); bench(-10, -6, 0); bench(9, -6, 0);
  [-14, -5, 5, 14].forEach(x => lamp(x, 8));
  lamp(-8, -8); lamp(8, -8);
  [[-18, -20, 1.3], [-6, -21, 1.6], [6, -21, 1.4], [18, -20, 1.5]].forEach(([x, z, s]) => tree(x, z, s));
  tree(-13, 9, 1.2); tree(13, 9, 1.3);
  cart(-11, 4);
  // hydrant + mailbox for detail
  cyl(0.13, 0.6, M('#c5453b'), 3, 0.3, 8, 12); solid(3, 8, 0.4, 0.4);
  box(0.6, 0.9, 0.5, M('#2f5f9f'), -3, 0.45, 8); solid(-3, 8, 0.7, 0.6);

  const LABEL = 'THE BLOCK';
  return {
    label: LABEL,
    group,
    floorY: Y,
    bg: '#a7c4d8',
    colliders: () => cols,
    show(on) { group.visible = on; },
    isActive: () => group.visible
  };
}
