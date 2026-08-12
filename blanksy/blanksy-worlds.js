// Real worlds for Blanksy — CC0 HDRI environments (Poly Haven) that drop him into
// an actual place: the photo wraps the scene as the sky/background AND lights him
// image-based, with real reflections, so he genuinely stands in a sunset, a city
// plaza, a field. This is the backbone for shooting "Blanksy among us" clips.
//
// A world takes over the sky, reflections, and fog (via atmos.setWorldMode) and
// clears the primitive set geometry, so he stands on the stage's shadow ground
// inside the HDRI. Weather (rain/snow) and wind still layer on top. Filmic tone
// mapping is switched on while a world is active so the HDR reads photographic,
// and off again when you leave.

export function createWorlds(THREE, stage, envs, atmos) {
  const renderer = stage._renderer, scene = stage._scene;
  const BASE = new URL('.', import.meta.url);      // resolve HDRs relative to this module
  let loader = null, pmrem = null, active = null;
  const cache = {};

  const LIST = [
    { id: null, label: 'NONE' },
    { id: 'venice_sunset', label: 'VENICE SUNSET', file: 'worlds/venice_sunset_1k.hdr', exposure: 0.82 },
    { id: 'potsdamer_platz', label: 'CITY PLAZA', file: 'worlds/potsdamer_platz_1k.hdr', exposure: 1.0 },
    { id: 'kloofendal', label: 'OPEN FIELD', file: 'worlds/kloofendal_48d_partly_cloudy_1k.hdr', exposure: 1.05 },
    { id: 'shanghai_bund', label: 'CITY SKYLINE', file: 'worlds/shanghai_bund_1k.hdr', exposure: 0.95 }
  ];
  const byId = Object.fromEntries(LIST.map(w => [w.id, w]));

  async function load(w) {
    if (cache[w.id]) return cache[w.id];
    if (!loader) { const mod = await import('three/addons/loaders/RGBELoader.js'); loader = new mod.RGBELoader(); }
    if (!pmrem) { pmrem = new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader(); }
    const tex = await loader.loadAsync(new URL(w.file, BASE).href);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const env = pmrem.fromEquirectangular(tex).texture;
    return (cache[w.id] = { tex, env });
  }

  // set(id): null returns to the primitive sets + atmosphere; an id drops him into
  // that HDRI. Async because the first time each HDR streams in.
  async function set(id) {
    const w = byId[id];
    if (!w || !w.id) {
      active = null;
      scene.background = null;
      stage._ground.material.opacity = 0.18;      // restore the subtle set shadow
      renderer.toneMapping = THREE.NoToneMapping; renderer.toneMappingExposure = 1;
      atmos.setWorldMode(false);                  // hands sky/reflections/fog back to atmosphere
      return;
    }
    const { tex, env } = await load(w);
    active = id;
    envs.set(null);                               // clear primitive geometry — he's in a real place now
    atmos.setWorldMode(true);                     // atmosphere stops owning sky/env/fog (weather still runs)
    scene.background = tex;
    scene.backgroundBlurriness = 0;
    scene.environment = env;
    scene.environmentIntensity = 1;
    scene.fog = null;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = w.exposure ?? 1;
    ground();
  }

  // Plant him. An HDRI has no real floor, so a character at the origin looks like
  // he floats above the photo's ground. Two things fix it: a stronger contact
  // shadow directly under his feet, and a near-horizon camera framing so his feet
  // sit on the scene's ground line instead of hanging in the sky.
  function ground() {
    const feetY = envs.floorY ?? 0;
    stage._ground.position.y = feetY;
    stage._ground.material.opacity = 0.42;               // firmer contact shadow in a real place
    const g = stage._object, cam = stage._camera, ctr = stage._controls;
    ctr.autoRotate = false;
    ctr.target.set(g.position.x, feetY + 0.72, g.position.z);
    const dir = new THREE.Vector3(0.55, 0.14, 1).normalize();   // low 3/4 angle, horizon near his feet
    cam.position.copy(ctr.target).add(dir.multiplyScalar(4.6));
    ctr.update();
  }

  return { LIST, set, isActive: () => active != null };
}
