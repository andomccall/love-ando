// Environments for the Blanksy stage — colorful sets Blanksy can stand in. He
// stays monochrome; the world around him carries the color. Each set is built
// once, then shown/hidden; they live in the scene beside the model (not inside
// it), so exports stay Blanksy-only.

export function createEnvironments(THREE, stage) {
  const scene = stage._scene;
  // Ground level from the skeleton's toe bones — a skinned mesh's bounding box
  // is bind-pose only and sits ~4in below his actual soles, which read as a
  // hover. Also drop the stage's shadow plane onto the same level.
  const feetY = (() => {
    let min = Infinity;
    const v = new THREE.Vector3();
    stage._object.traverse(o => {
      if (o.isBone && /toe/i.test(o.name)) min = Math.min(min, o.getWorldPosition(v).y);
    });
    return Number.isFinite(min) ? min - 0.016 : 0;
  })();
  stage._ground.position.y = feetY;
  const Y = feetY - 0.004;              // just under the stage's shadow plane

  const M = (color, o) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
  const built = {};
  let current = null;

  function mesh(geo, mat, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  const boxm = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  const cyl = (r, h, mat, x, y, z, seg = 20) => mesh(new THREE.CylinderGeometry(r, r, h, seg), mat, x, y, z);

  function floor(w, d, mat, z = 0) {
    const f = mesh(new THREE.PlaneGeometry(w, d), mat, 0, Y, z);
    f.rotation.x = -Math.PI / 2;
    f.castShadow = false;
    return f;
  }

  function tex(w, h, draw, rx = 1, ry = 1) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.anisotropy = 8;
    return t;
  }
  const fill = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

  function signTex(text, sub, bg = '#101418', fg = '#ffffff') {
    return tex(512, 256, (g, w, h) => {
      fill(g, 0, 0, w, h, bg);
      g.fillStyle = fg; g.textAlign = 'center';
      g.font = '700 120px "Bebas Neue", Impact, sans-serif';
      g.fillText(text, w / 2, sub ? 130 : 160);
      if (sub) {
        g.font = '400 40px "Space Mono", monospace';
        g.fillText(sub, w / 2, 200);
      }
    });
  }

  // Interior sets have ceilings that block the stage's overhead key light —
  // each one carries its own fill so the room and Blanksy both read.
  function interiorLight(g, intensity, y, spots, sky = 0xffffff, ground = 0x8a8578, tint = 0xffffff) {
    g.add(new THREE.HemisphereLight(sky, ground, intensity));
    spots.forEach(([x, z]) => {
      const p = new THREE.PointLight(tint, intensity * 6, 22, 2);
      p.position.set(x, Y + y, z);
      g.add(p);
    });
  }

  // ---------------- sets ----------------
  const SETS = {
    street: () => {
      const g = new THREE.Group();
      const sidewalk = tex(256, 256, (c, w) => {
        fill(c, 0, 0, w, w, '#cfc7b4');
        for (let i = 0; i < 400; i++) fill(c, Math.random() * w, Math.random() * w, 3, 3, Math.random() < .5 ? '#c2b9a5' : '#dcd5c4');
        c.strokeStyle = '#a89f8c'; c.lineWidth = 5;
        c.strokeRect(2, 2, w - 4, w - 4);
      }, 14, 14);
      g.add(floor(30, 30, M('#ffffff', { map: sidewalk })));
      g.add(boxm(30, 0.03, 9, M('#3d4248'), 0, Y + 0.015, 8.5));
      g.add(boxm(30, 0.16, 0.5, M('#e6e0cf'), 0, Y + 0.08, 3.9));
      const dash = M('#f2c744');
      for (let i = -3; i <= 3; i++) g.add(boxm(1.6, 0.01, 0.14, dash, i * 3.4, Y + 0.04, 8.5));
      // brick + stone facades, warm lit windows
      const win = (base, mortar) => tex(256, 512, (c, w, h) => {
        fill(c, 0, 0, w, h, base);
        for (let y = 0; y < 26; y++) for (let x = 0; x < 9; x++)
          fill(c, x * 30 + (y % 2 ? 15 : 0), y * 20, 26, 16, mortar);
        for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
          const s = (x * 7 + y * 3) % 5;
          fill(c, 12 + x * 60, 18 + y * 62, 44, 46, '#2b3138');
          fill(c, 14 + x * 60, 20 + y * 62, 40, 42,
            s === 0 ? '#ffdf94' : s === 1 ? '#8fc6de' : s === 2 ? '#f2a65e' : '#3c4a55');
        }
      }, 3, 4);
      [[-9, 9, 7, '#8f4a3f', '#a8574a'], [0, 11, 8, '#6f7d8c', '#8494a3'], [8.5, 8, 6.5, '#a8713f', '#bf8a52']]
        .forEach(([x, h, w, mortar, base]) => {
          g.add(boxm(w, h, 5, M('#ffffff', { map: win(base, mortar), roughness: 0.95 }), x, Y + h / 2, -6));
        });
      // deli: striped awning + neon-ish sign
      const stripe = tex(128, 64, (c, w, h) => {
        for (let i = 0; i < 8; i++) fill(c, i * 16, 0, 16, h, i % 2 ? '#c5453b' : '#f4ece0');
      }, 3, 1);
      g.add(boxm(4.4, 0.12, 1.5, M('#ffffff', { map: stripe }), -3.4, Y + 2.6, -3.1));
      g.add(mesh(new THREE.PlaneGeometry(3.2, 0.9),
        new THREE.MeshBasicMaterial({ map: signTex('DELI', 'OPEN 24 HRS', '#1b6f4a', '#ffe98a') }), -3.4, Y + 3.4, -3.42));
      // street lamp + traffic-light box
      g.add(cyl(0.07, 5, M('#2f4034'), 3.2, Y + 2.5, 3.2, 12));
      g.add(boxm(1.5, 0.12, 0.12, M('#2f4034'), 3.9, Y + 4.9, 3.2));
      g.add(boxm(0.7, 0.2, 0.4, M('#fff6d8', { emissive: '#ffdf94', emissiveIntensity: 0.6 }), 4.5, Y + 4.78, 3.2));
      g.add(boxm(0.34, 1, 0.3, M('#22301f'), 6.6, Y + 3.4, 3.2));
      [['#4fbf6a', 0], ['#f2c744', 0.3], ['#d84a3c', 0.6]].forEach(([c, o]) =>
        g.add(mesh(new THREE.SphereGeometry(0.09, 12, 10), M(c, { emissive: c, emissiveIntensity: .7 }), 6.6, Y + 3.05 + o, 3.36)));
      g.add(cyl(0.05, 3.6, M('#22301f'), 6.6, Y + 1.8, 3.2, 10));
      // hydrant, trash can, mailbox
      g.add(cyl(0.13, 0.6, M('#c5453b'), -1.2, Y + 0.3, 3.2, 12));
      g.add(cyl(0.09, 0.2, M('#c5453b'), -1.2, Y + 0.68, 3.2, 12));
      g.add(cyl(0.34, 1, M('#2f6b4f', { roughness: 0.6 }), 5.6, Y + 0.5, 2.4, 16));
      g.add(boxm(0.6, 0.9, 0.5, M('#2f5f9f'), -5.6, Y + 0.45, 3.1));
      const dome = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16, 1, false, 0, Math.PI), M('#2f5f9f'), -5.6, Y + 0.9, 3.1);
      dome.rotation.z = Math.PI / 2;
      g.add(dome);
      return { group: g, bg: '#8fc4de' };
    },

    park: () => {
      const g = new THREE.Group();
      const grass = tex(128, 128, (c, w) => {
        fill(c, 0, 0, w, w, '#6f9e56');
        for (let i = 0; i < 900; i++) {
          const r = Math.random();
          fill(c, Math.random() * w, Math.random() * w, 2, 5,
            r < 0.45 ? '#5d8c47' : r < 0.9 ? '#82b062' : '#e8d95e');
        }
      }, 16, 16);
      g.add(floor(40, 40, M('#ffffff', { map: grass })));
      const path = tex(128, 128, (c, w) => {
        fill(c, 0, 0, w, w, '#d9c49b');
        for (let i = 0; i < 400; i++) fill(c, Math.random() * w, Math.random() * w, 3, 3, '#c4ac83');
      }, 1, 12);
      const p = mesh(new THREE.PlaneGeometry(3.2, 40), M('#ffffff', { map: path }), 0, Y + 0.01, 0);
      p.rotation.set(-Math.PI / 2, 0, 0); p.castShadow = false;
      g.add(p);
      const trunk = M('#6b4a33');
      const leaves = ['#4f8a45', '#79ad4f', '#3f7a4a'];
      [[-5, -6, 1.5], [6, -7, 1.8], [-8, 2, 1.3], [8.5, 3, 1.6], [-3, -12, 2]].forEach(([x, z, s], i) => {
        g.add(cyl(0.16 * s, 2.4 * s, trunk, x, Y + 1.2 * s, z, 10));
        const canopy = mesh(new THREE.IcosahedronGeometry(1.25 * s, 1), M(leaves[i % 3], { roughness: 0.95 }), x, Y + 2.9 * s, z);
        canopy.scale.y = 0.85;
        g.add(canopy);
      });
      // flower beds
      ['#e0574f', '#f2c744', '#e08ab8', '#f4f0e4'].forEach((c, i) => {
        for (let j = 0; j < 9; j++) {
          const x = -7.5 + i * 0.35 + (j % 3) * 0.22, z = 3.4 + Math.floor(j / 3) * 0.3;
          g.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), M(c), x, Y + 0.14, z));
        }
      });
      // bench (green slats, wood seat)
      const bench = new THREE.Group();
      bench.add(boxm(2.2, 0.1, 0.55, M('#8a5a3b'), 0, Y + 0.45, 0));
      bench.add(boxm(2.2, 0.5, 0.09, M('#8a5a3b'), 0, Y + 0.7, -0.25));
      [-0.95, 0.95].forEach(x => bench.add(boxm(0.12, 0.45, 0.5, M('#2f6b4f'), x, Y + 0.22, 0)));
      bench.position.set(3.2, 0, 1.6); bench.rotation.y = -0.5;
      g.add(bench);
      g.add(cyl(0.06, 3.4, M('#22301f'), -2.6, Y + 1.7, 1.4, 12));
      g.add(mesh(new THREE.SphereGeometry(0.16, 14, 12), M('#fff6d8', { emissive: '#ffdf94', emissiveIntensity: .5 }), -2.6, Y + 3.5, 1.4));
      for (let i = -4; i <= 4; i++) g.add(cyl(0.05, 0.7, M('#2f6b4f'), i * 1.6, Y + 0.35, 5.4, 8));
      g.add(boxm(13, 0.07, 0.07, M('#2f6b4f'), 0, Y + 0.68, 5.4));
      // hazy skyline beyond the treeline
      [[-11, 7, 5, '#9fb2c4'], [-4, 9, 4, '#8ea3b8'], [4, 8, 6, '#a8b8c8'], [11, 10, 5, '#93a8bd']]
        .forEach(([x, h, w, c]) => g.add(boxm(w, h, 3, M(c, { roughness: 1 }), x, Y + h / 2, -19)));
      return { group: g, bg: '#a8d8ee' };
    },

    subway: () => {
      const g = new THREE.Group();
      const platform = tex(128, 128, (c, w) => {
        fill(c, 0, 0, w, w, '#9a8f7e');
        for (let i = 0; i < 500; i++) fill(c, Math.random() * w, Math.random() * w, 3, 3, Math.random() < .5 ? '#8a8070' : '#b0a693');
      }, 12, 12);
      g.add(floor(24, 14, M('#ffffff', { map: platform })));
      g.add(boxm(24, 0.02, 0.6, M('#f2c744'), 0, Y + 0.02, 4.4));
      g.add(boxm(24, 1.1, 4, M('#191c1f', { roughness: 1 }), 0, Y - 0.55, 6.9));
      [-0.6, 0.6].forEach(o => g.add(boxm(24, 0.08, 0.1, M('#b8bec4', { metalness: .35, roughness: .4 }), 0, Y - 0.98, 6.9 + o)));
      // cream tile wall with a teal band
      const tile = tex(256, 256, (c, w) => {
        fill(c, 0, 0, w, w, '#8a7f6c');
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++)
          fill(c, x * 64 + 3 + (y % 2 ? 32 : 0), y * 64 + 3, 58, 58, '#f2e9d4');
      }, 10, 3);
      g.add(boxm(24, 4.6, 0.3, M('#ffffff', { map: tile }), 0, Y + 2.3, -5));
      g.add(boxm(24, 0.35, 0.36, M('#2f7a7a'), 0, Y + 3.4, -4.94));
      g.add(boxm(24, 0.5, 0.5, M('#1f2427'), 0, Y + 4.7, -4.9));
      // station name + line bullet + hanging sign
      g.add(mesh(new THREE.PlaneGeometry(3.6, 1),
        new THREE.MeshBasicMaterial({ map: signTex('CANVASS ST', 'DOWNTOWN', '#14324a', '#f4f6f8') }), -4, Y + 2.5, -4.83));
      const bullet = cyl(0.42, 0.04, M('#e07a2c', { roughness: .5 }), 1.4, Y + 2.5, -4.83, 28);
      bullet.rotation.x = Math.PI / 2;
      g.add(bullet);
      const hang = mesh(new THREE.PlaneGeometry(2.6, 0.8),
        new THREE.MeshBasicMaterial({ map: signTex('UPTOWN', '→', '#1b6f4a', '#ffffff'), side: THREE.DoubleSide }), 4, Y + 3.1, -1.2);
      g.add(hang);
      [-0.9, 0.9].forEach(o => g.add(cyl(0.02, 0.9, M('#2b3033'), 4 + o, Y + 3.95, -1.2, 8)));
      // painted steel columns
      for (const x of [-7, -2.5, 2.5, 7]) {
        g.add(boxm(0.5, 4.4, 0.12, M('#2f6b4f', { metalness: .2, roughness: .6 }), x, Y + 2.2, 2.6));
        g.add(boxm(0.12, 4.4, 0.5, M('#2f6b4f', { metalness: .2, roughness: .6 }), x, Y + 2.2, 2.6));
      }
      g.add(boxm(24, 0.3, 14, M('#2b3033', { roughness: 1 }), 0, Y + 4.9, 0));
      for (const x of [-6, 0, 6]) g.add(boxm(4, 0.08, 0.5, M('#fffaf0', { emissive: '#ffeec4', emissiveIntensity: .8 }), x, Y + 4.7, 0));
      g.add(boxm(3, 0.12, 0.6, M('#8a5a3b'), -6.5, Y + 0.5, -4.2));
      [-1.3, 1.3].forEach(x => g.add(boxm(0.14, 0.5, 0.55, M('#2f6b4f'), -6.5 + x, Y + 0.25, -4.2)));
      interiorLight(g, 0.6, 4.3, [[-6, 0], [0, 0], [6, 0]], 0xfff2d8, 0x6b6250, 0xffedc4);
      return { group: g, bg: '#2f4450' };
    },

    bakery: () => {
      const g = new THREE.Group();
      const check = tex(256, 256, (c, w) => {
        fill(c, 0, 0, w, w, '#f6eedc');
        fill(c, 0, 0, w / 2, w / 2, '#3a4048');
        fill(c, w / 2, w / 2, w / 2, w / 2, '#3a4048');
      }, 10, 10);
      g.add(floor(18, 18, M('#ffffff', { map: check, roughness: .5 })));
      // pink walls, wood wainscot, chocolate signboard
      g.add(boxm(18, 4.2, 0.25, M('#f2c6bb'), 0, Y + 2.1, -5.5));
      g.add(boxm(18, 1.1, 0.3, M('#a87048'), 0, Y + 0.55, -5.46));
      g.add(boxm(0.25, 4.2, 12, M('#f2c6bb'), -8, Y + 2.1, -0.5));
      g.add(boxm(18, 0.35, 0.45, M('#5a3a28'), 0, Y + 4.2, -5.4));
      g.add(mesh(new THREE.PlaneGeometry(4.4, 1.2),
        new THREE.MeshBasicMaterial({ map: signTex('BAKERY', 'FRESH DAILY', '#5a3a28', '#f7d98a') }), -1.5, Y + 3.3, -5.33));
      // display case
      const caseG = new THREE.Group();
      caseG.add(boxm(5.2, 1, 1.1, M('#a8493f', { roughness: .5 }), 0, Y + 0.5, 0));
      caseG.add(boxm(5.3, 0.07, 1.2, M('#e8ddc8', { roughness: .3 }), 0, Y + 1.55, 0));
      const glass = boxm(5.2, 0.95, 1.1, new THREE.MeshPhysicalMaterial({
        color: '#eaf6f8', transparent: true, opacity: .18, roughness: .05, metalness: 0
      }), 0, Y + 1.05, 0);
      glass.castShadow = false;
      caseG.add(glass);
      const crust = M('#d8a75e', { roughness: .9 }), dark = M('#a8703c', { roughness: .9 });
      const icing = ['#f2a8c0', '#8fd0c4', '#f2d95e'];
      for (let i = 0; i < 7; i++) {
        const b = mesh(new THREE.SphereGeometry(0.15, 14, 10), M(icing[i % 3], { roughness: .7 }), -2.1 + i * 0.7, Y + 1.12, -0.2);
        b.scale.set(1.4, 0.75, 1);
        caseG.add(b);
      }
      for (let i = 0; i < 5; i++) {
        const l = mesh(new THREE.CapsuleGeometry(0.12, 0.42, 6, 12), i % 2 ? crust : dark, -1.7 + i * 0.85, Y + 1.12, 0.32);
        l.rotation.z = Math.PI / 2;
        caseG.add(l);
      }
      caseG.position.set(-1.2, 0, -3.4);
      g.add(caseG);
      // wood shelving with loaves
      for (let s = 0; s < 3; s++) {
        g.add(boxm(6, 0.09, 0.55, M('#a87048'), 4.2, Y + 1.1 + s * 0.85, -5.1));
        for (let i = 0; i < 8; i++) {
          const l = mesh(new THREE.CapsuleGeometry(0.13, 0.34, 6, 10), (i + s) % 2 ? crust : dark, 1.6 + i * 0.72, Y + 1.28 + s * 0.85, -5.1);
          l.rotation.z = Math.PI / 2 + (s === 1 ? 0.1 : 0);
          g.add(l);
        }
      }
      // brass pendants + café table
      for (const x of [-4, 0, 4]) {
        g.add(cyl(0.015, 1.2, M('#8a6a2f'), x, Y + 3.6, -1.4, 8));
        const shade = mesh(new THREE.ConeGeometry(0.34, 0.4, 18, 1, true), M('#c9a24a', { metalness: .35, roughness: .4, side: THREE.DoubleSide }), x, Y + 2.85, -1.4);
        shade.rotation.x = Math.PI;
        g.add(shade);
        g.add(mesh(new THREE.SphereGeometry(0.09, 12, 10), M('#fff4d8', { emissive: '#ffe2a0', emissiveIntensity: .9 }), x, Y + 2.7, -1.4));
      }
      g.add(cyl(0.5, 0.06, M('#f4ece0', { roughness: .4 }), 4.6, Y + 0.78, 1.8, 24));
      g.add(cyl(0.06, 0.78, M('#5a3a28'), 4.6, Y + 0.39, 1.8, 12));
      g.add(cyl(0.34, 0.04, M('#5a3a28'), 4.6, Y + 0.02, 1.8, 20));
      interiorLight(g, 0.55, 2.6, [[-4, -1.4], [0, -1.4], [4, -1.4]], 0xfff0dc, 0xc09a8a, 0xffe6b8);
      return { group: g, bg: '#f7e2d4' };
    },

    gym: () => {
      const g = new THREE.Group();
      const rubber = tex(128, 128, (c, w) => {
        fill(c, 0, 0, w, w, '#2f3a42');
        for (let i = 0; i < 900; i++) {
          const r = Math.random();
          fill(c, Math.random() * w, Math.random() * w, 2, 2,
            r < .5 ? '#3d4a52' : r < .8 ? '#5f8fa0' : '#c9622f');
        }
      }, 14, 14);
      g.add(floor(22, 22, M('#ffffff', { map: rubber, roughness: .95 })));
      // turf lane + mirror wall + navy accent wall
      g.add(boxm(5, 0.02, 12, M('#4f7f4a', { roughness: 1 }), 6.5, Y + 0.02, 0));
      g.add(boxm(20, 3.4, 0.2, M('#cfe0e6', { roughness: .16, metalness: .3 }), 0, Y + 1.9, -6));
      for (const x of [-6.6, 0, 6.6]) g.add(boxm(0.09, 3.4, 0.24, M('#1f2b33'), x, Y + 1.9, -5.94));
      g.add(boxm(20, 0.6, 0.3, M('#14324a'), 0, Y + 3.9, -5.95));
      g.add(mesh(new THREE.PlaneGeometry(4, 1),
        new THREE.MeshBasicMaterial({ map: signTex('BLANKSY', 'STRENGTH FLOOR', '#14324a', '#e0863c') }), 5.2, Y + 3.9, -5.78));
      g.add(boxm(0.2, 4.2, 16, M('#14324a', { roughness: 1 }), -9.5, Y + 2.1, -0.5));
      // squat rack
      const steel = M('#c9d2d8', { metalness: .35, roughness: .4 });
      const rack = new THREE.Group();
      [-0.7, 0.7].forEach(x => [-0.45, 0.45].forEach(z => rack.add(boxm(0.12, 2.6, 0.12, M('#c9622f', { roughness: .5 }), x, Y + 1.3, z))));
      [1, 1.6].forEach(y => rack.add(boxm(1.6, 0.08, 0.08, M('#c9622f', { roughness: .5 }), 0, Y + y, -0.45)));
      const bar = cyl(0.035, 2.4, steel, 0, Y + 1.6, 0.45, 12);
      bar.rotation.z = Math.PI / 2;
      rack.add(bar);
      const plate = ['#c5453b', '#2f6f9f'];
      [-1, 1].forEach(s => [0, 1].forEach(i => {
        const p = cyl(0.3 - i * 0.04, 0.08, M(plate[i], { roughness: .7 }), s * (0.85 + i * 0.1), Y + 1.6, 0.45, 24);
        p.rotation.z = Math.PI / 2;
        rack.add(p);
      }));
      rack.position.set(-3.6, 0, -3.4);
      g.add(rack);
      // dumbbell rack
      const dr = new THREE.Group();
      dr.add(boxm(3, 0.1, 0.7, M('#1f2b33'), 0, Y + 0.75, 0));
      dr.add(boxm(3, 0.1, 0.7, M('#1f2b33'), 0, Y + 0.35, 0));
      const dcol = ['#c5453b', '#2f6f9f', '#e0a92f', '#4f8a45', '#8a5aa8'];
      [-1.2, -0.6, 0, 0.6, 1.2].forEach((x, i) => [0.4, 0.8].forEach(y => {
        const r = 0.11 + (y > .5 ? 0.03 : 0) + i * 0.005;
        const h = cyl(0.035, 0.42, steel, x, Y + y + 0.12, 0);
        h.rotation.x = Math.PI / 2; dr.add(h);
        [-0.17, 0.17].forEach(z => {
          const w2 = cyl(r, 0.09, M(dcol[i], { roughness: .8 }), x, Y + y + 0.12, z, 18);
          w2.rotation.x = Math.PI / 2; dr.add(w2);
        });
      }));
      dr.position.set(4.2, 0, -4.2); g.add(dr);
      // bench + kettlebells
      const bench = new THREE.Group();
      bench.add(boxm(0.55, 0.16, 1.9, M('#c5453b', { roughness: .7 }), 0, Y + 0.55, 0));
      [-0.75, 0.75].forEach(z => bench.add(boxm(0.45, 0.47, 0.1, M('#1f2b33'), 0, Y + 0.24, z)));
      bench.position.set(2.6, 0, 1.4); bench.rotation.y = -0.35; g.add(bench);
      [[-1.6, 2.6, .22, '#2f6f9f'], [-2.2, 2.2, .17, '#e0a92f']].forEach(([x, z, r, c]) => {
        g.add(mesh(new THREE.SphereGeometry(r, 16, 12), M(c, { roughness: .7 }), x, Y + r, z));
        g.add(mesh(new THREE.TorusGeometry(r * 0.55, 0.03, 8, 16), M('#2b3439'), x, Y + r * 1.9, z));
      });
      g.add(boxm(22, 0.25, 16, M('#1f2b33', { roughness: 1 }), 0, Y + 4.4, -0.5));
      for (const x of [-5, 0, 5]) for (const z of [-3.5, 1])
        g.add(boxm(3.4, 0.07, 0.4, M('#f4faff', { emissive: '#dff0ff', emissiveIntensity: .7 }), x, Y + 4.22, z));
      interiorLight(g, 0.62, 4.1, [[-5, -3.5], [0, 1], [5, -3.5]], 0xeaf6ff, 0x4a5a66, 0xf0f8ff);
      return { group: g, bg: '#243038' };
    }
  };

  const LIST = [
    { id: null, label: 'BLANK' },
    { id: 'street', label: 'NYC STREET' },
    { id: 'park', label: 'CENTRAL PARK' },
    { id: 'subway', label: 'SUBWAY' },
    { id: 'bakery', label: 'BAKERY' },
    { id: 'gym', label: 'GYM' }
  ];

  // The stage frames the camera tight on Blanksy; a set needs room to read, so
  // ease the camera back along its own view direction while one is showing.
  const cam = stage._camera, controls = stage._controls;
  const home = cam.position.clone().sub(controls.target);

  function frame(mult, lift) {
    const o = home.clone().multiplyScalar(mult);
    o.y += lift;
    cam.position.copy(controls.target).add(o);
    controls.update();
  }

  function set(id) {
    if (current && built[current]) built[current].group.visible = false;
    current = id;
    if (!id) {
      stage.style.setProperty('--stage-bg', '#eceef0');
      frame(1, 0);
      return;
    }
    if (!built[id]) {
      built[id] = SETS[id]();
      scene.add(built[id].group);
    }
    built[id].group.visible = true;
    stage.style.setProperty('--stage-bg', built[id].bg);
    frame(2.1, 0.9);
  }

  return { LIST, set };
}
