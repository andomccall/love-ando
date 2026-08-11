// Blanksy — the original rigged model, rebuilt from the source FBX.
// Geometry + skin weights + skeleton live in blanksy.bin / blanksy.json.
// One loader shared by the builder page and the Hexpin map avatar.

const BASE = import.meta.url;
let cache = null;

// Declared in the host page as <meta name="ext-resource-dependency"> so a
// bundled/published copy resolves these to inlined blobs instead of fetching.
function res(id, file) {
  const r = (typeof window !== 'undefined' && window.__resources) ? window.__resources[id] : null;
  return r || new URL(file, BASE);
}

async function loadData() {
  if (!cache) cache = (async () => {
    const meta = await (await fetch(res('blanksy-meta', 'blanksy.json'))).json();
    const bin = await (await fetch(res('blanksy-bin', 'blanksy.bin'))).arrayBuffer();
    return { meta, bin };
  })();
  return cache;
}

// measured on this rig: upper-arm local X+ swings the arm down, X- raises it;
// upleg X+ steps forward, knee X- flexes back.
const DOWN = 1.25;

export async function createBlanksy(THREE, opts = {}) {
  const { meta, bin } = await loadData();
  const height = opts.height ?? 1.6;

  const view = (k, C) => new C(bin, meta.layout[k].offset, meta.layout[k].length);
  const skinIndex = view('skinIndex', Uint16Array).slice();
  const skinWeight = view('skinWeight', Float32Array).slice();
  // A handful of verts near the shoulders are weighted to the source root Null, whose
  // 100x scale we drop — they would collapse to the origin and stretch the skin into a
  // needle through the torso. Hand their weight to the torso bone instead.
  const rootIdx = meta.bones.findIndex(b => b.parent < 0);
  const torsoIdx = meta.bones.findIndex(b => /Neck/i.test(b.name));
  for (let i = 0; i < skinIndex.length; i++) {
    if (skinIndex[i] === rootIdx && skinWeight[i] > 0) skinIndex[i] = torsoIdx;
  }

  // The source UVs put the whole ball on a tiny island, so any texture reads as flat
  // color there. Project our own cylindrical UVs in model units instead — even texel
  // density across body, limbs and boots.
  const uv = (() => {
    const P = view('position', Float32Array), n = P.length / 3, out = new Float32Array(n * 2);
    const H = meta.bbox[1][2] - meta.bbox[0][2];
    for (let i = 0; i < n; i++) {
      const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
      out[i * 2] = (Math.atan2(x, -y) / (Math.PI * 2)) * (Math.PI * 2 * 1.2) / H;
      out[i * 2 + 1] = z / H;
    }
    return out;
  })();

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(view('position', Float32Array), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(view('normal', Float32Array), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndex, 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeight, 4));
  g.setIndex(new THREE.BufferAttribute(view('index', Uint32Array), 1));

  // DoubleSide: the band and gloves are thin open shells in the source mesh, so a
  // grazing view of the band's front edge shows a slit straight through it.
  const mat = {
    skin: new THREE.MeshStandardMaterial({ name: 'blanksy_skin', color: opts.skin ?? '#141414', roughness: 0.34, metalness: 0.15, side: THREE.DoubleSide }),
    accent: new THREE.MeshStandardMaterial({ name: 'blanksy_accent', color: opts.accent ?? '#f7f7f5', roughness: 0.45, metalness: 0.05, side: THREE.DoubleSide })
  };
  const order = [];
  meta.groups.forEach(gr => {
    if (!gr.count) return;
    g.addGroup(gr.start, gr.count, order.length);
    order.push(/white|002/i.test(gr.material) ? mat.accent : mat.skin);
  });

  const D = Math.PI / 180;
  const bones = meta.bones.map(b => {
    const bone = new THREE.Bone();
    bone.name = b.name.replace(/[:.]/g, '_');
    if (b.parent >= 0) {
      // the source root Null carries a 100x scale + axis flip the mesh does not;
      // dropping it keeps bones and geometry in one space (else posing amplifies 100x)
      bone.position.fromArray(b.pos);
      bone.quaternion.setFromEuler(new THREE.Euler(b.rot[0] * D, b.rot[1] * D, b.rot[2] * D, 'ZYX'));
      bone.scale.fromArray(b.scl);
    }
    return bone;
  });
  meta.bones.forEach((b, i) => { if (b.parent >= 0) bones[b.parent].add(bones[i]); });

  const mesh = new THREE.SkinnedMesh(g, order);
  mesh.name = 'blanksy';
  mesh.add(bones[meta.bones.findIndex(b => b.parent < 0)]);
  mesh.updateMatrixWorld(true);
  // Verts whose weights are all zero (source rig leftovers) would collapse to the origin
  // and drag a needle of skin through the torso — pin each to its nearest bone.
  {
    const bp = bones.map(b => new THREE.Vector3().setFromMatrixPosition(b.matrixWorld));
    const pos = g.attributes.position, p = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += skinWeight[i * 4 + k];
      if (sum > 1e-4) continue;
      p.fromBufferAttribute(pos, i);
      let near = torsoIdx, best = Infinity;
      for (let b = 0; b < bp.length; b++) {
        const d = bp[b].distanceToSquared(p);
        if (d < best) { best = d; near = b; }
      }
      skinIndex[i * 4] = near;
      skinWeight[i * 4] = 1;
    }
    g.attributes.skinIndex.needsUpdate = true;
    g.attributes.skinWeight.needsUpdate = true;
  }
  mesh.bind(new THREE.Skeleton(bones));
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  const H = meta.bbox[1][2] - meta.bbox[0][2];
  const rig = new THREE.Group();
  rig.rotation.x = -Math.PI / 2;          // source is Z-up
  rig.scale.setScalar(height / H);
  rig.add(mesh);
  const group = new THREE.Group();
  group.name = 'blanksy_rig';
  group.add(rig);

  const B = {}, bindQ = new Map();
  bones.forEach(b => {
    B[b.name.toLowerCase().replace(/^mixamorig[_:]?/, '').replace(/_/g, '').replace(/l$/, '')] = b;
    bindQ.set(b, b.quaternion.clone());
  });
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  function set(key, x, y, z) {
    const b = B[key]; if (!b) return;
    e.set(x || 0, y || 0, z || 0, 'ZYX');
    b.quaternion.copy(bindQ.get(b)).multiply(q.setFromEuler(e));
  }
  function reset() { bones.forEach(b => b.quaternion.copy(bindQ.get(b))); rig.position.y = 0; }

  // Blanksy's torso is one big sphere, so euler limb angles push the arms straight
  // into it. Instead aim each limb along a direction in character space
  // (+X = his left, +Y = up, +Z = forward) so hands always clear the body.
  const _a = new THREE.Vector3(), _b2 = new THREE.Vector3(), _dir = new THREE.Vector3(),
        _pq = new THREE.Quaternion(), _bw = new THREE.Quaternion(), _qd = new THREE.Quaternion(),
        _qr = new THREE.Quaternion(), _axis = new THREE.Vector3();
  function aim(boneKey, childKey, x, y, z, roll) {
    const bone = B[boneKey], child = B[childKey];
    if (!bone || !child) return;
    bone.updateWorldMatrix(true, true);
    _a.setFromMatrixPosition(bone.matrixWorld);
    _b2.setFromMatrixPosition(child.matrixWorld).sub(_a).normalize();
    if (x === null) _dir.copy(_b2);                     // keep direction, roll only
    else _dir.set(x, y, z).normalize().applyQuaternion(group.getWorldQuaternion(_qd));
    _qd.setFromUnitVectors(_b2, _dir);
    bone.parent.getWorldQuaternion(_pq);
    bone.getWorldQuaternion(_bw);
    bone.quaternion.copy(_pq.invert()).multiply(_qd).multiply(_bw);
    if (roll) {
      _axis.copy(_dir).applyQuaternion(_pq);            // _pq is already inverted
      bone.quaternion.premultiply(_qr.setFromAxisAngle(_axis.normalize(), roll));
    }
  }

  // resting arms: this rig weights the whole arm to the FOREARM bone (the upper-arm
  // bone has almost no weights), and that bone's origin sits right at the body surface —
  // so the arm must swing from the forearm only. Rotating the shoulder instead drags
  // the skin ring at the torso into a spike and tears the arm open.
  function armsDown(swing = 0, splay = 0.5) {
    aim('leftforearm', 'lefthand', splay, -1, 0.22 + swing);
    aim('rightforearm', 'righthand', -splay, -1, 0.22 - swing);
    handRoll('left', 0.35); handRoll('right', 0.35);
  }
  // twist the hand about the forearm axis so the palm faces inward/forward
  function handRoll(side, roll) {
    aim(side + 'hand', side + 'handmiddle1', null, null, null, roll);
  }
  function curl(side, a) {
    ['thumb', 'index', 'middle', 'ring'].forEach(f => {
      for (let i = 1; i <= 3; i++) set(side + 'hand' + f + i, a, 0, 0);
    });
  }

  function setPose(pose, t = 0) {
    reset();
    if (pose === 'tpose') return;
    if (pose === 'idle') set('spine1', Math.sin(t * 1.7) * 0.02, 0, 0);
    if (pose === 'walk') set('hips', 0, Math.sin(t * 4.4) * 0.05, 0);
    armsDown();
    curl('left', 0.28); curl('right', 0.28);
    if (pose === 'wave') {
      const s = Math.sin(t * 5.2);
      aim('rightforearm', 'righthand', -0.5, 1, 0.12);
      aim('righthand', 'righthandmiddle1', -0.5 + s * 0.42, 1, 0.12);
      curl('right', 0);
      rig.position.y = Math.sin(t * 2) * 0.006;
    } else if (pose === 'idle') {
      const s = Math.sin(t * 1.7);
      armsDown(s * 0.06);
      rig.position.y = s * 0.009;
    } else if (pose === 'walk') {
      const s = Math.sin(t * 4.4);
      set('leftupleg', s * 0.34, 0, 0);
      set('rightupleg', -s * 0.34, 0, 0);
      set('leftleg', -Math.max(0, -s) * 0.34, 0, 0);
      set('rightleg', -Math.max(0, s) * 0.34, 0, 0);
      set('leftfoot', -s * 0.12, 0, 0);
      set('rightfoot', s * 0.12, 0, 0);
      armsDown(-s * 0.45);
      rig.position.y = 0.012 - Math.abs(s) * 0.012;
    }
  }
  setPose('idle', 0);

  // landmarks (mesh/source space, Z up) props are placed against
  const landmarks = (() => {
    const P = view('position', Float32Array), out = {};
    const add = (k, i) => {
      const o = out[k] || (out[k] = { mn: [1e9, 1e9, 1e9], mx: [-1e9, -1e9, -1e9] });
      for (let c = 0; c < 3; c++) {
        const x = P[i * 3 + c];
        if (x < o.mn[c]) o.mn[c] = x;
        if (x > o.mx[c]) o.mx[c] = x;
      }
    };
    for (let i = 0; i < P.length / 3; i++) {
      let sum = 0, dom = 0, w = -1;
      for (let k = 0; k < 4; k++) {
        const x = skinWeight[i * 4 + k];
        sum += x;
        if (x > w) { w = x; dom = skinIndex[i * 4 + k]; }
      }
      if (sum < 1e-4) continue;
      const n = meta.bones[dom].name;
      if (/Neck/i.test(n)) add('torso', i);
      // the foot bones also own shin verts up to the chest — keep only what is near the
      // ground, or the boot box balloons and props fitted to it come out huge
      else if (/LeftFoot|LeftToe/i.test(n) && P[i * 3 + 2] < 0.7) add('bootL', i);
      else if (/RightFoot|RightToe/i.test(n) && P[i * 3 + 2] < 0.7) add('bootR', i);
    }
    const fin = {};
    for (const k in out) {
      const { mn, mx } = out[k];
      fin[k] = {
        center: mn.map((v, c) => (v + mx[c]) / 2),
        size: mn.map((v, c) => mx[c] - v),
        radius: Math.max(...mn.map((v, c) => (mx[c] - v) / 2))
      };
    }
    return fin;
  })();

  return { group, rig, mesh, mat, bones: B, set, setPose, aim, height, landmarks };
}
