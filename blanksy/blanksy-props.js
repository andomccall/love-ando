// Blanksy's kit: hat, shades, tee, hoodie, jeans, sneakers.
// Everything is authored in an upright frame (Y up, +Z forward) in the model's own
// units, then re-parented onto the bone it should ride with, so props follow the walk.

export function createProps(THREE, blanksy) {
  const { rig, bones, mat, landmarks } = blanksy;

  const frame = new THREE.Group();          // authoring space: Y up, +Z forward
  frame.rotation.x = Math.PI / 2;
  rig.add(frame);

  const outfit = new THREE.MeshStandardMaterial({ name: 'blanksy_outfit', color: '#e7e9ec', roughness: 0.72, metalness: 0.02, side: THREE.DoubleSide });
  const denim = new THREE.MeshStandardMaterial({ name: 'blanksy_denim', color: '#3c4a63', roughness: 0.85, metalness: 0.02, side: THREE.DoubleSide });
  const lens = new THREE.MeshStandardMaterial({ name: 'blanksy_lens', color: '#0b0b0c', roughness: 0.07, metalness: 0.55, side: THREE.DoubleSide });
  const trim = mat.accent;                  // sole, brim underside, drawstrings — matches band + gloves

  const src = v => new THREE.Vector3(v.x, v.z, -v.y);           // model space -> frame space
  const bonePos = key => {
    const b = bones[key];
    if (!b) return new THREE.Vector3();
    const m = matInRig(b);
    return src(new THREE.Vector3().setFromMatrixPosition(m));
  };

  const T = landmarks.torso;
  const C = new THREE.Vector3(T.center[0], T.center[2], -T.center[1]);
  const R = Math.max(T.size[0], T.size[1], T.size[2]) / 2;

  const shell = (r, thetaStart, thetaLength, m) => new THREE.Mesh(
    new THREE.SphereGeometry(r, 56, 32, 0, Math.PI * 2, thetaStart, thetaLength), m);
  const patch = (r, phiStart, phiLength, thetaStart, thetaLength, m) => new THREE.Mesh(
    new THREE.SphereGeometry(r, 36, 24, phiStart, phiLength, thetaStart, thetaLength), m);
  const ring = (radius, tube, m) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, 56), m);
    t.rotation.x = Math.PI / 2;
    return t;
  };
  const tube = (from, to, r0, r1, m, name) => {
    const d = new THREE.Vector3().subVectors(to, from);
    const g = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, d.length(), 26, 1, true), m);
    g.name = name;
    g.position.copy(from).add(to).multiplyScalar(0.5);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    return g;
  };

  // Fit props in rig-local space: world matrices may be stale (and the stage can
  // transform the object), so compose the local chain explicitly instead.
  function matInRig(node) {
    const chain = [];
    for (let n = node; n && n !== rig; n = n.parent) chain.push(n);
    const m = new THREE.Matrix4();
    for (let i = chain.length - 1; i >= 0; i--) { chain[i].updateMatrix(); m.multiply(chain[i].matrix); }
    return m;
  }

  function attach(boneKey, obj) {
    const bone = bones[boneKey] || bones.neck;
    const m = matInRig(bone).invert().multiply(matInRig(obj));
    bone.add(obj);
    m.decompose(obj.position, obj.quaternion, obj.scale);
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    obj.visible = false;
    return obj;
  }

  // ---------- hat ----------
  const hat = new THREE.Group(); hat.name = 'prop_hat';
  {
    const g = new THREE.Group();
    g.position.copy(C);
    g.rotation.x = 0.16;
    const SPAN = 1.02;
    const dome = shell(R * 1.06, 0, SPAN, outfit);
    dome.scale.y = 1.06;
    const domeMat = outfit.clone(); domeMat.side = THREE.DoubleSide;
    dome.material = domeMat;
    g.add(dome);
    const edgeY = Math.cos(SPAN) * R * 1.06, edgeR = Math.sin(SPAN) * R * 1.06;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.56, R * 0.56, 0.075, 44, 1, false, 0, Math.PI), outfit);
    brim.rotation.set(0.26, -Math.PI / 2, 0);
    brim.position.set(0, edgeY * 0.98, edgeR * 0.58);
    brim.scale.z = 1.08;
    g.add(brim);
    const brimUnder = brim.clone();
    brimUnder.material = trim;
    brimUnder.scale.set(0.96, 0.35, 1.03);
    brimUnder.position.y -= 0.045;
    g.add(brimUnder);
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 12), trim);
    button.position.y = R * 1.12; g.add(button);
    hat.add(g);
    frame.add(hat);
    attach('neck', hat);
  }

  // ---------- shades ----------
  const shades = new THREE.Group(); shades.name = 'prop_shades';
  {
    const g = new THREE.Group();
    g.position.copy(C);
    const F = Math.PI / 2;                      // phi at +Z (front)
    const LR = R * 1.025;                       // hugs the head; tops start below this band
    g.add(patch(LR, F + 0.10, 0.36, 1.24, 0.24, lens));
    g.add(patch(LR, F - 0.46, 0.36, 1.24, 0.24, lens));
    g.add(patch(LR * 1.008, F - 0.10, 0.20, 1.28, 0.07, lens));
    g.add(patch(LR, F + 0.46, 0.72, 1.32, 0.055, lens));
    g.add(patch(LR, F - 1.18, 0.72, 1.32, 0.055, lens));
    shades.add(g);
    frame.add(shades);
    attach('neck', shades);
  }

  // ---------- sleeves (shared by tee + hoodie) ----------
  // length is a fraction of the arm, so the cuff lands short of the glove instead of
  // swallowing it
  function sleeve(side, frac, radius, m) {
    const a = bonePos(side + 'forearm'), h = bonePos(side + 'hand');
    const d = new THREE.Vector3().subVectors(h, a);
    const len = d.length();
    d.normalize();
    const from = a.clone().addScaledVector(d, -0.14);
    const to = a.clone().addScaledVector(d, len * frac);
    const s = new THREE.Group();
    s.add(tube(from, to, radius, radius * 0.9, m, side + '_sleeve'));
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.84, 0.026, 10, 32), m);
    cuff.position.copy(to);
    cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d);
    s.add(cuff);
    // close the open end so you can't see up the sleeve from below
    const cap = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.9, 28), m);
    cap.position.copy(to);
    cap.quaternion.copy(cuff.quaternion);
    s.add(cap);
    frame.add(s);
    return attach(side + 'forearm', s);
  }

  // ---------- tee ----------
  const tee = new THREE.Group(); tee.name = 'prop_tee';
  {
    const g = new THREE.Group();
    g.position.copy(C);
    // tops start below the shades band (theta 1.24-1.48) and run to the bottom of the
    // ball so no belly shows between hem and jeans
    const body = shell(R * 1.035, 1.52, 1.34, outfit);
    body.material = (() => { const m = outfit.clone(); m.side = THREE.DoubleSide; return m; })();
    g.add(body);
    const collar = ring(Math.sin(1.52) * R * 0.99, 0.03, outfit);
    collar.position.y = Math.cos(1.52) * R * 1.02; g.add(collar);
    tee.add(g);
    frame.add(tee);
    attach('neck', tee);
  }
  const teeSleeves = ['left', 'right'].map(s => sleeve(s, 0.42, 0.20, outfit));
  // ---------- hoodie ----------
  const hoodie = new THREE.Group(); hoodie.name = 'prop_hoodie';
  {
    const g = new THREE.Group();
    g.position.copy(C);
    const START = 1.5;
    const body = shell(R * 1.065, START, 1.38, outfit);
    body.material = (() => { const m = outfit.clone(); m.side = THREE.DoubleSide; return m; })();
    g.add(body);
    const collar = ring(Math.sin(START) * R * 1.01, 0.042, outfit);
    collar.position.y = Math.cos(START) * R * 1.03; g.add(collar);
    const hoodBlob = new THREE.Mesh(new THREE.SphereGeometry(R * 0.42, 32, 20), outfit);
    hoodBlob.scale.set(1.1, 0.6, 0.55);
    hoodBlob.position.set(0, Math.cos(START) * R * 1.02 + 0.24, -R * 0.86);
    g.add(hoodBlob);
    for (const s of [-1, 1]) {
      const str = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.3, 10), trim);
      str.position.set(s * 0.16, Math.cos(START) * R * 1.02 - 0.14, R * 0.7);
      str.rotation.x = 0.12;
      g.add(str);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.05, 10), trim);
      tip.position.set(s * 0.16, Math.cos(START) * R * 1.02 - 0.29, R * 0.72);
      g.add(tip);
    }
    hoodie.add(g);
    frame.add(hoodie);
    attach('neck', hoodie);
  }
  const hoodSleeves = ['left', 'right'].map(s => sleeve(s, 0.8, 0.215, outfit));

  // ---------- pants: one skinned object, so knees bend without gaps ----------
  const srcPos = key => {
    const b = bones[key];
    return b ? new THREE.Vector3().setFromMatrixPosition(matInRig(b)) : new THREE.Vector3();
  };
  const jeans = [(() => {
    const skel = blanksy.mesh.skeleton;
    const bi = key => Math.max(0, skel.bones.indexOf(bones[key]));
    const SEG = 18, pos = [], nor = [], sIdx = [], sWt = [], tris = [];
    const UP = new THREE.Vector3(0, 0, 1);
    // sample the body's own leg weights: a pant vertex copies the weights of the nearest
    // leg vertex, so pant and leg deform identically (no poke-through at the knee)
    const bodyPos = blanksy.mesh.geometry.attributes.position;
    const bodySI = blanksy.mesh.geometry.attributes.skinIndex;
    const bodySW = blanksy.mesh.geometry.attributes.skinWeight;
    const legBones = new Set();
    Object.entries(bones).forEach(([k, b]) => {
      if (/upleg|leg$|foot$|toebase/.test(k)) legBones.add(blanksy.mesh.skeleton.bones.indexOf(b));
    });
    const cand = [];
    for (let i = 0; i < bodyPos.count; i++) {
      let d = 0, w = -1;
      for (let k = 0; k < 4; k++) { const x = bodySW.getComponent(i, k); if (x > w) { w = x; d = bodySI.getComponent(i, k); } }
      if (legBones.has(d)) cand.push(i);
    }
    const cp = new THREE.Vector3();
    function copyWeights(p) {
      let best = -1, bd = Infinity;
      for (const i of cand) {
        cp.fromBufferAttribute(bodyPos, i);
        const d = cp.distanceToSquared(p);
        if (d < bd) { bd = d; best = i; }
      }
      for (let k = 0; k < 4; k++) { sIdx.push(bodySI.getComponent(best, k)); sWt.push(bodySW.getComponent(best, k)); }
    }

    for (const side of ['left', 'right']) {
      const hip = srcPos(side + 'upleg'), knee = srcPos(side + 'leg'), ankle = srcPos(side + 'foot');
      const waist = hip.clone().add(new THREE.Vector3(0, 0, 0.34));
      const cuff = ankle.clone().lerp(knee, 0.08).add(new THREE.Vector3(0, 0, 0.16));
      // profile: waist -> hip -> knee -> calf -> tight jogger cuff
      const keys = [
        { p: waist, r: 0.42 }, { p: hip, r: 0.40 }, { p: knee, r: 0.36 },
        { p: knee.clone().lerp(cuff, 0.55), r: 0.33 }, { p: cuff, r: 0.23 }
      ];
      const rings = [];
      for (let k = 0; k < keys.length - 1; k++) {
        const steps = k === keys.length - 2 ? 4 : 3;
        for (let s = 0; s < steps; s++) {
          const t = s / steps;
          rings.push({
            p: keys[k].p.clone().lerp(keys[k + 1].p, t),
            r: keys[k].r + (keys[k + 1].r - keys[k].r) * t,
            dir: new THREE.Vector3().subVectors(keys[k + 1].p, keys[k].p).normalize()
          });
        }
      }
      rings.push({ p: keys[4].p.clone(), r: keys[4].r, dir: rings[rings.length - 1].dir });

      const base = pos.length / 3;
      rings.forEach((ring, ri) => {
        const tangent = ring.dir.lengthSq() ? ring.dir : UP;
        // legs are near-vertical, so cross(tangent, UP) is degenerate and the ring frame
        // twists between rings — pick a reference axis that is never parallel
        const ref = Math.abs(tangent.z) > 0.9 ? new THREE.Vector3(1, 0, 0) : UP.clone();
        const side1 = new THREE.Vector3().crossVectors(tangent, ref).normalize();
        const side2 = new THREE.Vector3().crossVectors(tangent, side1).normalize();
        for (let i = 0; i < SEG; i++) {
          const a = (i / SEG) * Math.PI * 2;
          const n = side1.clone().multiplyScalar(Math.cos(a)).addScaledVector(side2, Math.sin(a)).normalize();
          const p = ring.p.clone().addScaledVector(n, ring.r);
          pos.push(p.x, p.y, p.z);
          nor.push(n.x, n.y, n.z);
          copyWeights(p);
        }
        if (ri > 0) {
          const a0 = base + (ri - 1) * SEG, b0 = base + ri * SEG;
          for (let i = 0; i < SEG; i++) {
            const j = (i + 1) % SEG;
            tris.push(a0 + i, b0 + i, b0 + j, a0 + i, b0 + j, a0 + j);
          }
        }
      });
    }

    const g2 = new THREE.BufferGeometry();
    g2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g2.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nor), 3));
    g2.setAttribute('skinIndex', new THREE.BufferAttribute(new Uint16Array(sIdx), 4));
    g2.setAttribute('skinWeight', new THREE.BufferAttribute(new Float32Array(sWt), 4));
    g2.setIndex(tris);
    const pants = new THREE.SkinnedMesh(g2, denim);
    pants.name = 'prop_pants';
    pants.castShadow = true;
    pants.receiveShadow = false;      // thin skinned shell: self-shadowing shows as acne
    pants.frustumCulled = false;
    pants.visible = false;
    rig.add(pants);
    pants.bind(skel, blanksy.mesh.bindMatrix.clone());
    return pants;
  })()];

  // ---------- sneakers ----------
  const sneakers = [];
  for (const side of ['left', 'right']) {
    const lm = landmarks[side === 'left' ? 'bootL' : 'bootR'];
    if (!lm) continue;
    const c = new THREE.Vector3(lm.center[0], lm.center[2], -lm.center[1]);
    const s = [lm.size[0], lm.size[2], lm.size[1]];       // w, h, d in frame axes
    const g = new THREE.Group();
    g.name = 'prop_sneaker_' + side;
    const upper = new THREE.Mesh(new THREE.SphereGeometry(0.5, 34, 22), outfit);
    upper.scale.set(s[0] * 1.03, s[1] * 1.0, s[2] * 1.01);
    upper.position.copy(c).add(new THREE.Vector3(0, s[1] * 0.08, 0));
    g.add(upper);
    const sole = new THREE.Mesh(new THREE.SphereGeometry(0.5, 30, 16), trim);
    sole.scale.set(s[0] * 1.04, s[1] * 0.42, s[2] * 0.99);
    sole.position.copy(c).add(new THREE.Vector3(0, -s[1] * 0.30, 0));
    g.add(sole);
    for (const dir of [-1, 1]) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), trim);
      stripe.scale.set(0.02, s[1] * 0.13, s[2] * 0.34);
      stripe.position.copy(c).add(new THREE.Vector3(dir * s[0] * 0.5, s[1] * 0.1, s[2] * 0.08));
      g.add(stripe);
    }
    frame.add(g);
    sneakers.push(attach(side + 'foot', g));
  }

  const SETS = {
    hat: [hat],
    shades: [shades],
    tee: [tee, ...teeSleeves],
    hoodie: [hoodie, ...hoodSleeves],
    jeans,
    sneakers
  };
  const state = { hat: false, shades: false, tee: false, hoodie: false, jeans: false, sneakers: false };

  function set(id, on) {
    if (!(id in SETS)) return;
    state[id] = on;
    if (on && id === 'tee') state.hoodie = false;      // one top at a time
    if (on && id === 'hoodie') state.tee = false;
    for (const k in SETS) SETS[k].forEach(o => { o.visible = state[k]; });
  }
  function setColors({ outfit: oc, denim: dc } = {}) {
    if (oc) {
      outfit.color.set(oc);
      [hat, tee, hoodie, ...teeSleeves, ...hoodSleeves, ...sneakers].forEach(g =>
        g.traverse(o => { if (o.isMesh && o.material !== trim && o.material !== denim && o.material !== lens) o.material.color.set(oc); }));
    }
    if (dc) denim.color.set(dc);
  }

  return { set, setColors, state, materials: { outfit, denim, lens } };
}
