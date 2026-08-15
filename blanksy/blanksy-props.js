// Blanksy's kit: shades, jeans, and the tailored wardrobe (crewneck, hooded pullover,
// low-top sneakers, stiletto pumps) from blanksy-garments.js.
// Everything is authored in an upright frame (Y up, +Z forward) in the model's own
// units, then re-parented onto the bone it should ride with, so props follow the walk.

import { createGarments, BONE } from './blanksy-garments.js';

export function createProps(THREE, blanksy) {
  const { rig, bones, mat, landmarks } = blanksy;

  const frame = new THREE.Group();          // authoring space: Y up, +Z forward
  frame.rotation.x = Math.PI / 2;
  rig.add(frame);

  const denim = new THREE.MeshStandardMaterial({ name: 'blanksy_denim', color: '#3c4a63', roughness: 0.85, metalness: 0.02, side: THREE.DoubleSide });
  const lens = new THREE.MeshStandardMaterial({ name: 'blanksy_lens', color: '#0b0b0c', roughness: 0.07, metalness: 0.55, side: THREE.DoubleSide });
  const trim = mat.accent;                  // soles, laces, drawcords — matches band + gloves

  const T = landmarks.torso;
  const C = new THREE.Vector3(T.center[0], T.center[2], -T.center[1]);
  const R = Math.max(T.size[0], T.size[1], T.size[2]) / 2;

  const patch = (r, phiStart, phiLength, thetaStart, thetaLength, m) => new THREE.Mesh(
    new THREE.SphereGeometry(r, 36, 24, phiStart, phiLength, thetaStart, thetaLength), m);

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

  // ---------- the tailored wardrobe ----------
  // Each piece is cut to this rig in blanksy-garments.js, facing -Z. Turn it a half
  // circle to face the frame's +Z, then split it across bones: sleeves ride the
  // forearms and shoes ride the feet, so the garment walks with him. That half turn
  // swaps his sides, which is why BONE sends an authored 'left' piece to a right bone.
  const garments = createGarments(THREE);
  const wardrobe = {};
  for (const g of garments.LIST) {
    const root = g.build();
    root.name = 'prop_' + g.id;
    // soles, laces and drawcords share the band + glove material, as the old kit did
    if (root.userData.accent.length) {
      const accent = new Set(root.userData.accent);
      root.traverse(o => { if (o.isMesh && accent.has(o.material)) o.material = trim; });
    }
    root.rotation.y = Math.PI;
    frame.add(root);
    const parts = [];
    for (const child of [...root.children]) {
      const boneKey = BONE[child.name];
      if (boneKey) parts.push(attach(boneKey, child));
    }
    if (root.children.length) parts.push(attach('neck', root));   // shell, hood, pocket
    wardrobe[g.id] = { slot: g.slot, tint: root.userData.tint, hidesBoots: !!g.hidesBoots, parts };
  }

  // Blanksy's boots are welded into his one skinned body mesh, so there is no group to
  // switch off. The pumps are cut slimmer than his boot, so collapse the boot vertices
  // onto a single point while they are on: every boot triangle goes zero-area and stops
  // rasterizing, and the originals go back the moment the pumps come off.
  const boots = (() => {
    const geo = blanksy.mesh.geometry, pos = geo.attributes.position;
    const si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight;
    const feet = new Set();
    blanksy.mesh.skeleton.bones.forEach((b, i) => { if (/foot|toe/i.test(b.name)) feet.add(i); });
    const idx = [];
    for (let i = 0; i < pos.count; i++) {
      let dom = 0, w = -1;
      for (let k = 0; k < 4; k++) { const x = sw.getComponent(i, k); if (x > w) { w = x; dom = si.getComponent(i, k); } }
      // the foot bones also own shin verts up the leg — keep only what is near the ground
      if (feet.has(dom) && pos.getZ(i) < 0.7) idx.push(i);
    }
    const kept = new Float32Array(idx.length * 3);
    idx.forEach((i, n) => { kept[n * 3] = pos.getX(i); kept[n * 3 + 1] = pos.getY(i); kept[n * 3 + 2] = pos.getZ(i); });
    // one collapse point per foot, taken from that foot's own vertices
    const hub = [[0, 0, 0, 0], [0, 0, 0, 0]];        // x, y, z, count — left then right
    idx.forEach((i, n) => {
      const h = hub[kept[n * 3] >= 0 ? 0 : 1];
      h[0] += kept[n * 3]; h[1] += kept[n * 3 + 1]; h[2] += kept[n * 3 + 2]; h[3]++;
    });
    hub.forEach(h => { if (h[3]) { h[0] /= h[3]; h[1] /= h[3]; h[2] /= h[3]; } });
    let on = true;
    return {
      show(v) {
        if (v === on || !idx.length) return;
        on = v;
        idx.forEach((i, n) => {
          const h = hub[kept[n * 3] >= 0 ? 0 : 1];
          if (on) pos.setXYZ(i, kept[n * 3], kept[n * 3 + 1], kept[n * 3 + 2]);
          else pos.setXYZ(i, h[0], h[1], h[2]);
        });
        pos.needsUpdate = true;
      }
    };
  })();

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

  const SETS = { shades: [shades], jeans };
  for (const id in wardrobe) SETS[id] = wardrobe[id].parts;
  const state = {};
  for (const id in SETS) state[id] = false;

  function set(id, on) {
    if (!(id in SETS)) return;
    state[id] = on;
    // one top at a time, one pair of shoes at a time
    const slot = wardrobe[id]?.slot;
    if (on && slot) for (const k in wardrobe) if (k !== id && wardrobe[k].slot === slot) state[k] = false;
    for (const k in SETS) SETS[k].forEach(o => { o.visible = state[k]; });
    boots.show(!Object.keys(wardrobe).some(k => wardrobe[k].hidesBoots && state[k]));
  }

  // Each garment's trims were cut as shades of its own cloth, so a chosen color is
  // handed down the same way: the ribs, linings and stitching keep their relative
  // depth instead of flattening into one flat block of color.
  const _c = new THREE.Color();
  function tint(slot, hex) {
    _c.set(hex);
    for (const id in wardrobe) {
      if (wardrobe[id].slot !== slot) continue;
      wardrobe[id].tint.forEach(([m, k]) => m.color.setRGB(_c.r * k, _c.g * k, _c.b * k));
    }
  }
  function setColors({ outfit: oc, denim: dc, footwear: fc } = {}) {
    if (oc) tint('top', oc);
    if (dc) denim.color.set(dc);
    if (fc) tint('feet', fc);
  }

  const KIT = [
    ...garments.LIST.filter(g => g.slot === 'top').map(g => ({ id: g.id, label: g.label })),
    { id: 'shades', label: 'SHADES' },
    { id: 'jeans', label: 'JEANS' },
    ...garments.LIST.filter(g => g.slot === 'feet').map(g => ({ id: g.id, label: g.label }))
  ];

  return { set, setColors, state, KIT, materials: { denim, lens } };
}
