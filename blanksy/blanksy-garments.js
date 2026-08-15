// Blanksy's wardrobe: crewneck, hooded pullover, low-top sneakers, stiletto pumps.
//
// Every piece is cut to the clean rig (Blanksy_rig_clean) and authored in that rig's
// own units, measured off its skin mesh:
//   body      sphere r 1.195 centred (0, 2.355, 0.355)
//   arms      stick limbs along +/-X at y 2.00, z 0.43, radius ~0.095, wrist at x 1.62
//   feet      centred on |x| 0.55, spanning z -0.51 (toe) to 1.05 (heel), 0.82 wide
// In that space Blanksy faces -Z, so garment fronts live on -Z and the hood hangs
// toward +Z. The builder page's prop frame faces +Z instead, so createProps gives each
// garment a half turn on Y before binding it to bones. That turn swaps his sides too,
// which is why BONE below sends an authored 'left' piece to the rig's right bone.
//
// Source: the Blanksy Look design project (blanksy-look.html, hoodie.js, sweatshirt.js,
// shoes.js, heels.js). Geometry is unchanged from the design; what is added here is the
// tint metadata the builder's color controls drive.

// Which authored sub-group rides which bone. Anything not listed stays on the root and
// rides the torso, so a shell or hood follows the body rather than a limb.
export const BONE = {
  sleeve_left: 'rightforearm', sleeve_right: 'leftforearm',
  pump_left: 'rightfoot', pump_right: 'leftfoot',
  sneaker_left: 'rightfoot', sneaker_right: 'leftfoot'
};

export function createGarments(THREE) {
  const BODY = {
    c: new THREE.Vector3(0, 2.355, 0.355),
    r: 1.195,
    armY: 2.00, armZ: 0.43, wristX: 1.62
  };
  const FZ = -1;                                   // he faces -z, so fronts live on -z

  // point on a garment shell at polar angle t (from +y) and azimuth a
  const onShell = (t, a, rad) => new THREE.Vector3(
    rad * Math.sin(t) * Math.sin(a), rad * Math.cos(t), FZ * rad * Math.sin(t) * Math.cos(a)
  ).add(BODY.c);

  // vertical rib texture: alternate radial columns in and out
  function ribbed(geo, amount, freq) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z);
      if (r < 1e-5) continue;
      const k = 1 + amount * Math.sign(Math.sin(Math.atan2(z, x) * freq)) / r;
      pos.setX(i, x * k); pos.setZ(i, z * k);
    }
    geo.computeVertexNormals();
    return geo;
  }

  const seam = (pts, radius, name, mat) => {
    const m = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 56, radius, 8, false), mat);
    m.name = name;
    return m;
  };

  // extrude a footprint slab: y0 -> y0 + h
  function slab(shape, y0, h, mat, name, bevel = 0) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: h, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
      bevelSegments: 3, curveSegments: 14
    });
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.y = y0 + h;
    return m;
  }

  // sample a piecewise half-width profile with a smoothstep between control points
  const profile = pts => u => {
    for (let i = 1; i < pts.length; i++) {
      if (u <= pts[i][0]) {
        const t = (u - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
        return THREE.MathUtils.lerp(pts[i - 1][1], pts[i][1], t * t * (3 - 2 * t));
      }
    }
    return pts[pts.length - 1][1];
  };

  // ---------- crewneck sweatshirt ----------
  function buildCrewneck() {
    const SHELL = BODY.r + 0.06;                   // fabric stands off the body shell
    const COLLAR_T = THREE.MathUtils.degToRad(80); // neckline: above the arm sockets
    const HEM_T = THREE.MathUtils.degToRad(126);   // hem leaves the body above the legs
    const M = {
      fleece: new THREE.MeshStandardMaterial({ name: 'heather_fleece', color: 0xa2a8ac, roughness: 0.97, metalness: 0, side: THREE.DoubleSide }),
      rib: new THREE.MeshStandardMaterial({ name: 'rib_knit', color: 0x8c9297, roughness: 0.99, metalness: 0, side: THREE.DoubleSide }),
      stitch: new THREE.MeshStandardMaterial({ name: 'stitch_thread', color: 0x5b6165, roughness: 0.85, metalness: 0 })
    };

    function sleeve(side) {
      const g = new THREE.Group();
      const tag = side > 0 ? 'left' : 'right';
      g.name = 'sleeve_' + tag;
      const capX = 0.55, cuffX = BODY.wristX;
      const at = x => new THREE.Vector3(side * x, BODY.armY, BODY.armZ);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(side, 0, 0));

      const prof = [[0.38, 0], [0.365, 0.26], [0.33, 0.52], [0.28, 0.80], [0.24, 0.86], [0.222, cuffX - capX - 0.05], [0.218, cuffX - capX]];
      const arm = new THREE.Mesh(new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 48), M.fleece);
      arm.name = 'sleeve_' + tag + '_fleece';
      arm.quaternion.copy(q);
      arm.position.copy(at(capX));
      g.add(arm);

      const cuff = new THREE.Mesh(ribbed(new THREE.CylinderGeometry(0.225, 0.215, 0.24, 64, 3, true), 0.004, 48), M.rib);
      cuff.name = 'cuff_' + tag;
      cuff.quaternion.copy(q);
      cuff.position.copy(at(cuffX + 0.11));
      g.add(cuff);

      const cuffSeam = new THREE.Mesh(new THREE.TorusGeometry(0.232, 0.011, 8, 44), M.stitch);
      cuffSeam.name = 'cuff_seam_' + tag;
      cuffSeam.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
      cuffSeam.position.copy(at(cuffX - 0.005));
      g.add(cuffSeam);

      // armhole seam where the sleeve leaves the body shell
      const hole = new THREE.Mesh(new THREE.TorusGeometry(0.318, 0.012, 8, 56), M.stitch);
      hole.name = 'armhole_seam_' + tag;
      hole.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
      hole.position.copy(at(capX + 0.60));
      g.add(hole);
      return g;
    }

    const root = new THREE.Group();
    root.name = 'blanksy_crewneck_sweatshirt';

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(SHELL, 72, 48, 0, Math.PI * 2, COLLAR_T, HEM_T - COLLAR_T), M.fleece);
    shell.name = 'body_shell';
    shell.position.copy(BODY.c);
    root.add(shell);

    const hemR = SHELL * Math.sin(HEM_T), hemY = BODY.c.y + SHELL * Math.cos(HEM_T);
    const hem = new THREE.Mesh(ribbed(new THREE.CylinderGeometry(hemR, hemR - 0.03, 0.30, 96, 3, true), 0.006, 64), M.rib);
    hem.name = 'hem_band';
    hem.position.set(BODY.c.x, hemY - 0.14, BODY.c.z);
    root.add(hem);

    const hemSeam = new THREE.Mesh(new THREE.TorusGeometry(hemR + 0.006, 0.012, 8, 96), M.stitch);
    hemSeam.name = 'hem_seam';
    hemSeam.rotation.x = Math.PI / 2;
    hemSeam.position.set(BODY.c.x, hemY + 0.015, BODY.c.z);
    root.add(hemSeam);

    const colR = SHELL * Math.sin(COLLAR_T), colY = BODY.c.y + SHELL * Math.cos(COLLAR_T);
    const collar = new THREE.Mesh(ribbed(new THREE.CylinderGeometry(colR - 0.03, colR + 0.005, 0.17, 96, 3, true), 0.005, 72), M.rib);
    collar.name = 'collar_rib';
    collar.position.set(BODY.c.x, colY + 0.075, BODY.c.z);
    root.add(collar);

    const collarSeam = new THREE.Mesh(new THREE.TorusGeometry(colR + 0.012, 0.012, 8, 72), M.stitch);
    collarSeam.name = 'collar_seam';
    collarSeam.rotation.x = Math.PI / 2;
    collarSeam.position.set(BODY.c.x, colY - 0.01, BODY.c.z);
    root.add(collarSeam);

    // front V-notch gusset stitch below the collar
    for (const s of [1, -1]) {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        const t = THREE.MathUtils.lerp(COLLAR_T + 0.015, COLLAR_T + 0.30, u);
        const a = s * THREE.MathUtils.lerp(0.135, 0.004, u);
        pts.push(onShell(t, a, SHELL + 0.004));
      }
      root.add(seam(pts, 0.010, 'v_notch_' + (s > 0 ? 'left' : 'right'), M.stitch));
    }

    root.add(sleeve(1), sleeve(-1));
    root.userData.tint = [[M.fleece, 1], [M.rib, 0.87], [M.stitch, 0.57]];
    root.userData.accent = [];
    return root;
  }

  // ---------- hooded pullover ----------
  // Same block as the crewneck, cut a touch fuller, with a slouched hood, a kangaroo
  // pocket, and draw cords that follow the band + glove color.
  function buildHoodie() {
    const SHELL = BODY.r + 0.065;
    const COLLAR_T = THREE.MathUtils.degToRad(80);
    const HEM_T = THREE.MathUtils.degToRad(126);
    const M = {
      fleece: new THREE.MeshStandardMaterial({ name: 'charcoal_fleece', color: 0x3f4347, roughness: 0.96, metalness: 0, side: THREE.DoubleSide }),
      rib: new THREE.MeshStandardMaterial({ name: 'rib_knit', color: 0x33373a, roughness: 0.99, metalness: 0, side: THREE.DoubleSide }),
      lining: new THREE.MeshStandardMaterial({ name: 'hood_lining', color: 0x2b2e31, roughness: 0.98, metalness: 0, side: THREE.DoubleSide }),
      stitch: new THREE.MeshStandardMaterial({ name: 'stitch_thread', color: 0x24272a, roughness: 0.85, metalness: 0 }),
      cord: new THREE.MeshStandardMaterial({ name: 'draw_cord', color: 0xe4e0d6, roughness: 0.75, metalness: 0 }),
      tip: new THREE.MeshStandardMaterial({ name: 'cord_tip', color: 0xb9b4a8, roughness: 0.5, metalness: 0.35 })
    };

    function sleeve(side) {
      const g = new THREE.Group();
      const tag = side > 0 ? 'left' : 'right';
      g.name = 'sleeve_' + tag;
      const capX = 0.55, cuffX = BODY.wristX;
      const at = x => new THREE.Vector3(side * x, BODY.armY, BODY.armZ);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(side, 0, 0));

      const prof = [[0.39, 0], [0.375, 0.26], [0.34, 0.52], [0.29, 0.80], [0.25, 0.98], [0.228, cuffX - capX - 0.05], [0.224, cuffX - capX]];
      const arm = new THREE.Mesh(new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 48), M.fleece);
      arm.name = 'sleeve_' + tag + '_fleece';
      arm.quaternion.copy(q);
      arm.position.copy(at(capX));
      g.add(arm);

      const cuff = new THREE.Mesh(ribbed(new THREE.CylinderGeometry(0.228, 0.215, 0.26, 64, 3, true), 0.004, 48), M.rib);
      cuff.name = 'cuff_' + tag;
      cuff.quaternion.copy(q);
      cuff.position.copy(at(cuffX + 0.12));
      g.add(cuff);

      const cs = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.011, 8, 44), M.stitch);
      cs.name = 'cuff_seam_' + tag;
      cs.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
      cs.position.copy(at(cuffX - 0.005));
      g.add(cs);

      const hole = new THREE.Mesh(new THREE.TorusGeometry(0.325, 0.012, 8, 56), M.stitch);
      hole.name = 'armhole_seam_' + tag;
      hole.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
      hole.position.copy(at(capX + 0.60));
      g.add(hole);
      return g;
    }

    // hood: slouched bag hanging off the back of the neckline
    function hood() {
      const g = new THREE.Group();
      g.name = 'hood';
      const colY = BODY.c.y + SHELL * Math.cos(COLLAR_T);
      const dir = new THREE.Vector3(0, -1, 0.30).normalize();   // droops down the back
      const origin = new THREE.Vector3(0, colY - 0.12, BODY.c.z + 1.06);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

      // bag profile: gathered at the neckline, bulging, rounded off at the tip
      const prof = [[0.50, 0], [0.58, 0.11], [0.63, 0.28], [0.63, 0.47], [0.585, 0.67],
                    [0.50, 0.84], [0.36, 0.97], [0.19, 1.04], [0.0, 1.07]];
      const bagG = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 56);
      bagG.scale(1.10, 1, 0.66);
      const bag = new THREE.Mesh(bagG, M.fleece);
      bag.name = 'hood_shell';
      bag.quaternion.copy(q);
      bag.position.copy(origin);
      g.add(bag);

      const linG = new THREE.LatheGeometry(prof.slice(0, 5).map(p => new THREE.Vector2(p[0] - 0.045, p[1] + 0.01)), 48);
      linG.scale(1.10, 1, 0.66);
      const lining = new THREE.Mesh(linG, M.lining);
      lining.name = 'hood_lining';
      lining.quaternion.copy(q);
      lining.position.copy(origin);
      g.add(lining);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.51, 0.046, 10, 72), M.rib);
      rim.name = 'hood_rim';
      rim.scale.set(1.10, 0.66, 1);
      rim.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
      rim.position.copy(origin);
      g.add(rim);

      // crown seam over the top of the bag
      const crown = [];
      for (let i = 0; i <= 12; i++) {
        const u = i / 12, t = u * 1.07;
        const r = (0.50 + 0.13 * Math.sin(u * Math.PI * 0.9)) * 0.66;   // outer face of the bag
        const p = new THREE.Vector3(0, t, r * (1 - Math.pow(u, 3.2)));
        crown.push(p.applyQuaternion(q).add(origin));
      }
      g.add(seam(crown, 0.012, 'hood_crown_seam', M.stitch));
      return g;
    }

    // kangaroo pocket: patch curved onto the front of the shell
    function pocket() {
      const g = new THREE.Group();
      g.name = 'pocket';
      const t0 = THREE.MathUtils.degToRad(96), t1 = THREE.MathUtils.degToRad(124), aw = 0.60;
      const patch = new THREE.SphereGeometry(SHELL + 0.032, 64, 24, Math.PI - aw, aw * 2, t0, t1 - t0);
      const mesh = new THREE.Mesh(patch, M.fleece);
      mesh.name = 'pocket_patch';
      mesh.position.copy(BODY.c);
      g.add(mesh);

      // stitched edge: down the left opening, across the bottom, up the right
      const edge = [];
      for (let i = 0; i <= 10; i++) edge.push(onShell(THREE.MathUtils.lerp(t0, t1, i / 10), -aw + 0.004, SHELL + 0.042));
      for (let i = 1; i <= 14; i++) edge.push(onShell(t1 - 0.004, THREE.MathUtils.lerp(-aw, aw, i / 14), SHELL + 0.042));
      for (let i = 1; i <= 10; i++) edge.push(onShell(THREE.MathUtils.lerp(t1, t0, i / 10), aw - 0.004, SHELL + 0.042));
      g.add(seam(edge, 0.012, 'pocket_seam', M.stitch));
      return g;
    }

    function drawcords() {
      const g = new THREE.Group();
      g.name = 'draw_cords';
      const colY = BODY.c.y + SHELL * Math.cos(COLLAR_T);
      for (const s of [1, -1]) {
        const a = s * 0.13;
        const top = onShell(COLLAR_T + 0.05, a, SHELL + 0.03);
        const pts = [
          top,
          new THREE.Vector3(top.x + s * 0.045, colY - 0.26, top.z - 0.015),
          new THREE.Vector3(top.x + s * 0.055, colY - 0.50, top.z + 0.02),
          new THREE.Vector3(top.x + s * 0.04, colY - 0.70, top.z + 0.05)
        ];
        const curve = new THREE.CatmullRomCurve3(pts);
        const cord = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.019, 10, false), M.cord);
        cord.name = 'draw_cord_' + (s > 0 ? 'left' : 'right');
        g.add(cord);
        const end = curve.getPointAt(1), dir = curve.getTangentAt(1);
        const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.09, 20), M.tip);
        tip.name = 'cord_tip_' + (s > 0 ? 'left' : 'right');
        tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        tip.position.copy(end).addScaledVector(dir, 0.05);
        g.add(tip);
      }
      return g;
    }

    const root = new THREE.Group();
    root.name = 'blanksy_hooded_pullover';

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(SHELL, 72, 48, 0, Math.PI * 2, COLLAR_T, HEM_T - COLLAR_T), M.fleece);
    shell.name = 'body_shell';
    shell.position.copy(BODY.c);
    root.add(shell);

    const hemR = SHELL * Math.sin(HEM_T), hemY = BODY.c.y + SHELL * Math.cos(HEM_T);
    const hem = new THREE.Mesh(ribbed(new THREE.CylinderGeometry(hemR, hemR - 0.03, 0.30, 96, 3, true), 0.006, 64), M.rib);
    hem.name = 'hem_band';
    hem.position.set(BODY.c.x, hemY - 0.14, BODY.c.z);
    root.add(hem);

    const hemSeam = new THREE.Mesh(new THREE.TorusGeometry(hemR + 0.006, 0.012, 8, 96), M.stitch);
    hemSeam.name = 'hem_seam';
    hemSeam.rotation.x = Math.PI / 2;
    hemSeam.position.set(BODY.c.x, hemY + 0.015, BODY.c.z);
    root.add(hemSeam);

    // neckline band the hood is sewn to
    const colR = SHELL * Math.sin(COLLAR_T), colY = BODY.c.y + SHELL * Math.cos(COLLAR_T);
    const collar = new THREE.Mesh(ribbed(new THREE.CylinderGeometry(colR - 0.04, colR + 0.005, 0.15, 96, 3, true), 0.004, 72), M.rib);
    collar.name = 'neck_band';
    collar.position.set(BODY.c.x, colY + 0.065, BODY.c.z);
    root.add(collar);

    const collarSeam = new THREE.Mesh(new THREE.TorusGeometry(colR + 0.012, 0.012, 8, 80), M.stitch);
    collarSeam.name = 'neck_seam';
    collarSeam.rotation.x = Math.PI / 2;
    collarSeam.position.set(BODY.c.x, colY - 0.01, BODY.c.z);
    root.add(collarSeam);

    root.add(hood(), pocket(), drawcords(), sleeve(1), sleeve(-1));
    root.userData.tint = [[M.fleece, 1], [M.rib, 0.82], [M.lining, 0.68], [M.stitch, 0.58]];
    root.userData.accent = [M.cord, M.tip];        // cords ride the band + glove color
    return root;
  }

  // ---------- low-top canvas sneakers ----------
  function buildSneakers() {
    const FOOT = { cx: 0.55, toeZ: -0.62, heelZ: 1.14, ankleZ: 0.60 };
    const M = {
      canvas: new THREE.MeshStandardMaterial({ name: 'navy_canvas', color: 0x2a3450, roughness: 0.94, metalness: 0 }),
      rubber: new THREE.MeshStandardMaterial({ name: 'white_rubber', color: 0xf1f0ea, roughness: 0.62, metalness: 0 }),
      pinstripe: new THREE.MeshStandardMaterial({ name: 'dark_pinstripe', color: 0x1a1f28, roughness: 0.7, metalness: 0 }),
      lace: new THREE.MeshStandardMaterial({ name: 'lace_cotton', color: 0xf6f5f1, roughness: 0.85, metalness: 0 }),
      eyelet: new THREE.MeshStandardMaterial({ name: 'metal_eyelet', color: 0xa8adb2, roughness: 0.35, metalness: 0.35 }),
      lining: new THREE.MeshStandardMaterial({ name: 'sock_lining', color: 0x161a20, roughness: 0.98, metalness: 0, side: THREE.DoubleSide })
    };
    // half-width of the footprint at u (0 = toe tip, 1 = heel tip)
    const widthAt = profile([[0, 0.07], [0.08, 0.30], [0.18, 0.42], [0.34, 0.455], [0.52, 0.40],
                             [0.66, 0.355], [0.80, 0.38], [0.92, 0.34], [1, 0.10]]);

    function footShape(scale = 1, pad = 0) {
      const L = FOOT.heelZ - FOOT.toeZ;
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const u = i / 48;
        pts.push(new THREE.Vector2(widthAt(u) * scale + pad, -(FOOT.toeZ + u * L)));
      }
      for (let i = 48; i >= 0; i--) {
        const u = i / 48;
        pts.push(new THREE.Vector2(-(widthAt(u) * scale + pad), -(FOOT.toeZ + u * L)));
      }
      return new THREE.Shape(pts);
    }

    // half-ellipsoid upper: low nose, full at the waist, heel counter behind
    const UP = { rx: 0.50, ry: 0.62, rz: 0.88, cz: (FOOT.toeZ + FOOT.heelZ) / 2, base: 0.155 };
    const surfaceY = (x, z) => {
      const k = 1 - Math.pow(x / UP.rx, 2) - Math.pow((z - UP.cz) / UP.rz, 2);
      return UP.base + UP.ry * Math.sqrt(Math.max(k, 0));
    };

    function shoe(tag) {
      const g = new THREE.Group();
      g.name = 'sneaker_' + tag;

      // rubber foxing, dark pinstripe, outsole edge
      g.add(slab(footShape(1.02, 0.05), 0, 0.155, M.rubber, 'foxing_' + tag, 0.022));
      g.add(slab(footShape(1.02, 0.056), 0.152, 0.018, M.pinstripe, 'pinstripe_' + tag));
      g.add(slab(footShape(1.02, 0.028), 0, 0.026, M.pinstripe, 'outsole_' + tag));

      // canvas upper
      const upG = new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
      upG.scale(UP.rx, UP.ry, UP.rz);
      const up = new THREE.Mesh(upG, M.canvas);
      up.name = 'upper_' + tag;
      up.position.set(0, UP.base, UP.cz);
      g.add(up);

      // white rubber toe cap wrapping the nose
      const capG = new THREE.SphereGeometry(1, 64, 32, Math.PI - 0.62, 1.24, 0, Math.PI / 2);
      capG.scale(UP.rx + 0.012, UP.ry + 0.012, UP.rz + 0.012);
      const cap = new THREE.Mesh(capG, M.rubber);
      cap.name = 'toe_cap_' + tag;
      cap.position.set(0, UP.base - 0.004, UP.cz);
      g.add(cap);

      // heel counter lifts the back up to the collar
      const heelG = new THREE.SphereGeometry(1, 48, 28, 0, Math.PI * 2, 0, Math.PI / 2);
      heelG.scale(0.42, 0.60, 0.44);
      const heel = new THREE.Mesh(heelG, M.canvas);
      heel.name = 'heel_counter_' + tag;
      heel.position.set(0, 0.155, FOOT.heelZ - 0.42);
      g.add(heel);

      // collar + sock lining around the ankle
      const collarY = 0.70;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.036, 10, 56), M.canvas);
      rim.name = 'collar_' + tag;
      rim.rotation.x = Math.PI / 2;
      rim.scale.set(1, 0.92, 1);
      rim.position.set(0, collarY + 0.05, FOOT.ankleZ + 0.05);
      g.add(rim);

      const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.225, 0.17, 40, 1, true), M.lining);
      sock.name = 'sock_lining_' + tag;
      sock.position.set(0, collarY - 0.03, FOOT.ankleZ + 0.05);
      g.add(sock);

      // tongue riding the instep
      const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.045, 0.40, 4, 1, 6), M.canvas);
      tongue.name = 'tongue_' + tag;
      tongue.rotation.x = -0.22;
      tongue.position.set(0, surfaceY(0, FOOT.ankleZ - 0.28) + 0.01, FOOT.ankleZ - 0.28);
      g.add(tongue);

      // eyelets riding the throat, laces crossing between them
      const rows = 4, z0 = FOOT.ankleZ - 0.50, z1 = FOOT.ankleZ - 0.10, ex = 0.20;
      const eyes = [];
      for (let i = 0; i < rows; i++) {
        const z = THREE.MathUtils.lerp(z0, z1, i / (rows - 1));
        for (const sgn of [1, -1]) {
          const y = surfaceY(sgn * ex, z) + 0.004;
          const e = new THREE.Mesh(new THREE.TorusGeometry(0.030, 0.010, 8, 20), M.eyelet);
          e.name = `eyelet_${tag}_${i}_${sgn > 0 ? 'l' : 'r'}`;
          e.position.set(sgn * ex, y, z);
          e.rotation.set(0.5, sgn * 0.4, 0);
          g.add(e);
          eyes.push({ s: sgn, i, p: e.position.clone() });
        }
      }
      const find = (i, sgn) => eyes.find(e => e.i === i && e.s === sgn).p;
      for (let i = 0; i < rows - 1; i++) {
        for (const sgn of [1, -1]) {
          const a = find(i, sgn), b = find(i + 1, -sgn);
          const mid = a.clone().lerp(b, 0.5);
          mid.y = surfaceY(0, mid.z) + 0.055;
          const l = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, mid, b]), 24, 0.018, 8, false), M.lace);
          l.name = `lace_${tag}_${i}_${sgn > 0 ? 'a' : 'b'}`;
          g.add(l);
        }
      }
      const tl = find(rows - 1, 1), tr = find(rows - 1, -1);
      const barMid = tl.clone().lerp(tr, 0.5);
      barMid.y = surfaceY(0, barMid.z) + 0.05;
      const bar = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([tl, barMid, tr]), 20, 0.018, 8, false), M.lace);
      bar.name = 'lace_bar_' + tag;
      g.add(bar);
      for (const e of [{ s: 1, p: tl }, { s: -1, p: tr }]) {
        const curve = new THREE.CatmullRomCurve3([
          e.p,
          e.p.clone().add(new THREE.Vector3(e.s * 0.10, -0.06, -0.12)),
          e.p.clone().add(new THREE.Vector3(e.s * 0.14, -0.30, -0.20))
        ]);
        const t = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.017, 8, false), M.lace);
        t.name = 'lace_end_' + tag + (e.s > 0 ? '_l' : '_r');
        g.add(t);
      }
      return g;
    }

    const root = new THREE.Group();
    root.name = 'blanksy_low_top_sneakers';
    const left = shoe('left');
    left.position.x = FOOT.cx;
    const right = shoe('right');
    right.position.x = -FOOT.cx;
    root.add(left, right);
    root.userData.tint = [[M.canvas, 1], [M.pinstripe, 0.58], [M.lining, 0.48]];
    root.userData.accent = [M.rubber, M.lace];     // soles + laces ride the band + glove color
    return root;
  }

  // ---------- pointed-toe stiletto pumps ----------
  // Slimmer than his boot, so createProps takes the boots off when these go on.
  function buildPumps() {
    const FOOT = { cx: 0.55, toeZ: -0.86, heelZ: 1.10, ankleZ: 0.60 };
    const PITCH = -0.30;                           // heel lift, pivoted at the toe
    const LEN = FOOT.heelZ - FOOT.toeZ;
    const M = {
      patent: new THREE.MeshStandardMaterial({ name: 'red_patent', color: 0xd8232c, roughness: 0.16, metalness: 0.12 }),
      patentDark: new THREE.MeshStandardMaterial({ name: 'red_patent_sole', color: 0xb01d24, roughness: 0.22, metalness: 0.1 }),
      insole: new THREE.MeshStandardMaterial({ name: 'tan_insole', color: 0xd9b98c, roughness: 0.75, metalness: 0, side: THREE.DoubleSide }),
      lining: new THREE.MeshStandardMaterial({ name: 'nude_lining', color: 0xc8a679, roughness: 0.85, metalness: 0, side: THREE.DoubleSide }),
      tip: new THREE.MeshStandardMaterial({ name: 'heel_tip', color: 0x2a2b2e, roughness: 0.5, metalness: 0.2 })
    };
    // half-width of the pointed footprint at u (0 = toe point, 1 = heel)
    const widthAt = profile([[0, 0.010], [0.10, 0.095], [0.22, 0.195], [0.38, 0.255],
                             [0.55, 0.25], [0.72, 0.225], [0.88, 0.235], [1, 0.085]]);

    function footShape(scale = 1, pad = 0) {
      const pts = [];
      for (let i = 0; i <= 56; i++) {
        const u = i / 56;
        pts.push(new THREE.Vector2(widthAt(u) * scale + pad, -(FOOT.toeZ + u * LEN)));
      }
      for (let i = 56; i >= 0; i--) {
        const u = i / 56;
        pts.push(new THREE.Vector2(-(widthAt(u) * scale + pad), -(FOOT.toeZ + u * LEN)));
      }
      return new THREE.Shape(pts);
    }

    // upper block: ellipsoid last, low nose, tapered to the point
    const UP = { rx: 0.285, ry: 0.30, rz: 0.58, cz: -0.02, base: 0.055 };

    function shoe(tag) {
      const g = new THREE.Group();
      g.name = 'pump_' + tag;

      // everything on the last is pitched heel-up about the toe point
      const last = new THREE.Group();
      last.name = 'last_' + tag;
      last.position.set(0, 0.020, FOOT.toeZ);
      last.rotation.x = PITCH;
      g.add(last);
      const local = new THREE.Group();             // work in absolute z inside the pitch
      local.position.z = -FOOT.toeZ;
      last.add(local);

      // outsole + thin red leather sole edge
      local.add(slab(footShape(1, 0.012), 0, 0.055, M.patentDark, 'outsole_' + tag, 0.012));
      local.add(slab(footShape(0.97, 0), 0.052, 0.016, M.insole, 'insole_edge_' + tag));

      // upper: patent last, low nose, tapering into the point
      const upG = new THREE.SphereGeometry(1, 72, 36, 0, Math.PI * 2, 0, Math.PI / 2);
      upG.scale(UP.rx, UP.ry, UP.rz);
      const up = new THREE.Mesh(upG, M.patent);
      up.name = 'upper_' + tag;
      up.position.set(0, UP.base, UP.cz);
      local.add(up);

      // pointed toe tip
      const tipG = new THREE.ConeGeometry(0.16, 0.40, 36, 1, false);
      tipG.rotateX(-Math.PI / 2);
      tipG.scale(1, 0.60, 1);
      const tip = new THREE.Mesh(tipG, M.patent);
      tip.name = 'toe_point_' + tag;
      tip.rotation.x = -0.11;                      // sweeps the point down toward the sole
      tip.position.set(0, 0.105, -0.70);
      local.add(tip);

      // heel cup lifting the back of the shoe behind the ankle
      const cupG = new THREE.SphereGeometry(1, 56, 32, 0, Math.PI * 2, 0, Math.PI / 2);
      cupG.scale(0.275, 0.30, 0.46);
      const cup = new THREE.Mesh(cupG, M.patent);
      cup.name = 'heel_cup_' + tag;
      cup.position.set(0, UP.base, FOOT.heelZ - 0.40);
      local.add(cup);

      // collar: nude lining + patent piping around the throat
      const collarZ = FOOT.ankleZ + 0.06;
      const surfaceY = z => UP.base + 0.30 * Math.sqrt(Math.max(0, 1 - Math.pow((z - (FOOT.heelZ - 0.44)) / 0.46, 2)));
      const collarY = Math.max(surfaceY(collarZ), 0.26);
      const lin = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.195, 0.14, 40, 1, true), M.lining);
      lin.name = 'collar_lining_' + tag;
      lin.position.set(0, collarY - 0.02, collarZ);
      local.add(lin);

      const piping = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.020, 10, 56), M.patentDark);
      piping.name = 'topline_' + tag;
      piping.rotation.x = Math.PI / 2;
      piping.scale.set(1.05, 1.25, 1);
      piping.position.set(0, collarY + 0.05, collarZ);
      local.add(piping);

      // stiletto heel, vertical in world space under the heel seat
      const seatLocal = new THREE.Vector3(0, 0.05, FOOT.heelZ - 0.17);
      const seat = seatLocal.clone().sub(new THREE.Vector3(0, 0, FOOT.toeZ))
        .applyEuler(new THREE.Euler(PITCH, 0, 0)).add(new THREE.Vector3(0, 0, FOOT.toeZ));
      const hHeight = seat.y;
      const spikeG = new THREE.CylinderGeometry(0.052, 0.028, hHeight, 28, 4, true);
      const pos = spikeG.attributes.position;
      for (let i = 0; i < pos.count; i++) {        // gentle inward curve
        const y = pos.getY(i), t = THREE.MathUtils.clamp((y + hHeight / 2) / hHeight, 0, 1);
        pos.setZ(i, pos.getZ(i) + 0.10 * Math.pow(1 - t, 1.7));
      }
      spikeG.computeVertexNormals();
      const spike = new THREE.Mesh(spikeG, M.patent);
      spike.name = 'stiletto_' + tag;
      spike.position.set(0, hHeight / 2, seat.z);
      g.add(spike);

      const heelTop = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.patent);
      heelTop.name = 'heel_breast_' + tag;
      heelTop.scale.set(1, 0.7, 1.5);
      heelTop.position.set(0, hHeight - 0.02, seat.z);
      g.add(heelTop);

      const tipCap = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.027, 0.045, 24), M.tip);
      tipCap.name = 'heel_tip_' + tag;
      tipCap.position.set(0, 0.023, seat.z + 0.10);
      g.add(tipCap);
      return g;
    }

    const root = new THREE.Group();
    root.name = 'blanksy_red_stiletto_pumps';
    const l = shoe('left'); l.position.x = FOOT.cx;
    const r = shoe('right'); r.position.x = -FOOT.cx;
    root.add(l, r);
    root.userData.tint = [[M.patent, 1], [M.patentDark, 0.80]];
    root.userData.accent = [];                     // the leather interior stays as cut
    return root;
  }

  // slot drives what a piece replaces: one top at a time, one pair of shoes at a time
  const LIST = [
    { id: 'crew', label: 'CREWNECK', slot: 'top', base: '#a2a8ac', build: buildCrewneck },
    { id: 'hoodie', label: 'HOODIE', slot: 'top', base: '#3f4347', build: buildHoodie },
    { id: 'sneakers', label: 'SNEAKERS', slot: 'feet', base: '#2a3450', build: buildSneakers },
    { id: 'pumps', label: 'PUMPS', slot: 'feet', base: '#d8232c', build: buildPumps, hidesBoots: true }
  ];

  return { LIST, BODY, buildCrewneck, buildHoodie, buildSneakers, buildPumps };
}
