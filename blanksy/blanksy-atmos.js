// Atmosphere for the Blanksy stage — time of day, weather (rain / snow), and
// wind, plus a light realism lift (soft reflections + distance fog) that makes
// the existing sets read richer without touching their geometry. A separate,
// self-contained layer on top of the scene: it adjusts the stage's own lights,
// adds two particle systems, and a subtle environment map. Nothing here changes
// Blanksy himself beyond a gentle sheen from the reflection probe.
//
// Weather particles ride in groups that recenter on whoever the camera is
// looking at each frame, so the shower always surrounds Blanksy, and they hide
// indoors (any set that reports a ceiling).

export function createAtmos(THREE, stage, envs) {
  const scene = stage._scene, renderer = stage._renderer, controls = stage._controls;

  // grab the stage's lights so time-of-day can retint them
  const key = stage._key;
  let hemi = null, fill = null;
  scene.traverse(o => {
    if (o.isHemisphereLight) hemi = o;
    else if (o.isDirectionalLight && o !== key) fill = o;
  });

  // --- soft reflection probe: a vertical sky/ground gradient, PMREM-filtered
  // so rough surfaces sample it correctly. Cheap, and it gives metal/satin a
  // believable environment instead of flat black. ---
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envCache = {};
  function envMap(top, bot) {
    const kkey = top + bot;
    if (envCache[kkey]) return envCache[kkey];
    const c = document.createElement('canvas'); c.width = 16; c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, 64);
    grd.addColorStop(0, top); grd.addColorStop(0.5, top); grd.addColorStop(1, bot);
    g.fillStyle = grd; g.fillRect(0, 0, 16, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const rt = pmrem.fromEquirectangular(tex);
    tex.dispose();
    return (envCache[kkey] = rt.texture);
  }

  // distance fog so sets fade into their sky instead of ending on a hard edge
  scene.fog = new THREE.Fog(0xeceef0, 14, 60);

  // --- time of day ---
  // day restores the stage's boot look and leaves each set's own sky alone;
  // golden and night take over the sky, lights, and fog for a full mood shift.
  const TIMES = [
    { id: 'day', label: 'DAY' },
    { id: 'golden', label: 'GOLDEN' },
    { id: 'night', label: 'NIGHT' }
  ];
  const PRESETS = {
    day: {
      key: 0xffffff, keyI: 2.2, keyPos: [4, 7, 5],
      hemiSky: 0xffffff, hemiGround: 0xd8d2c4, hemiI: 1.0,
      fill: 0xfff4e6, fillI: 0.5,
      fog: 0xdfe4ea, fogNear: 26, fogFar: 90,
      env: ['#dfeaf4', '#c9c2b0'], envI: 0.5,
      bg: null                                   // keep the set's own sky
    },
    golden: {
      key: 0xffc27a, keyI: 2.4, keyPos: [7, 2.4, 4],
      hemiSky: 0xffd9a0, hemiGround: 0x6b5138, hemiI: 0.75,
      fill: 0xff9a5a, fillI: 0.5,
      fog: 0xe7a765, fogNear: 16, fogFar: 62,
      env: ['#ffd39a', '#c86a3e'], envI: 0.85,
      bg: 'linear-gradient(#ffcf8f 0%, #f0955a 55%, #d9744a 100%)'
    },
    night: {
      key: 0x8aa0d8, keyI: 0.7, keyPos: [3, 8, 2],
      hemiSky: 0x2a3550, hemiGround: 0x0d1018, hemiI: 0.4,
      fill: 0x3a4a70, fillI: 0.35,
      fog: 0x121a2e, fogNear: 10, fogFar: 46,
      env: ['#243155', '#0a0e1a'], envI: 0.5,
      bg: 'linear-gradient(#1b2545 0%, #111a34 60%, #0a0e1a 100%)'
    }
  };

  let time = 'day';
  function applyTime() {
    const p = PRESETS[time];
    key.color.set(p.key); key.intensity = p.keyI; key.position.set(p.keyPos[0], p.keyPos[1], p.keyPos[2]);
    if (hemi) { hemi.color.set(p.hemiSky); hemi.groundColor.set(p.hemiGround); hemi.intensity = p.hemiI; }
    if (fill) { fill.color.set(p.fill); fill.intensity = p.fillI; }
    scene.fog.color.set(p.fog); scene.fog.near = p.fogNear; scene.fog.far = p.fogFar;
    scene.environment = envMap(p.env[0], p.env[1]);
    scene.environmentIntensity = p.envI;
    if (p.bg) stage.style.setProperty('--stage-bg', p.bg);
  }
  function setTime(id) { time = id; applyTime(); }
  // sets overwrite --stage-bg when chosen; call this after an env change so the
  // current mood re-asserts its sky.
  function reassert() {
    const p = PRESETS[time];
    scene.fog.color.set(p.fog); scene.fog.near = p.fogNear; scene.fog.far = p.fogFar;
    if (p.bg) stage.style.setProperty('--stage-bg', p.bg);
  }

  // --- weather ---
  const groundY = () => envs.floorY ?? 0;
  const FIELD = 9;          // half-width of the shower box around Blanksy
  const TOP = 11;           // spawn height above the ground

  // rain: short falling streaks (line segments), angled by the wind
  function makeRain(n) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 6);       // two endpoints per drop
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0xaebfcf, transparent: true, opacity: 0.42 });
    const seg = new THREE.LineSegments(geo, mat);
    seg.frustumCulled = false;
    const p = [];
    for (let i = 0; i < n; i++) p.push({ x: rand(), y: Math.random() * TOP, z: rand(), s: 15 + Math.random() * 8 });
    return { seg, p, pos, geo, n };
  }
  // snow: soft round flakes (points) that drift and sway
  function makeSnow(n) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.095, transparent: true, opacity: 0.92,
      map: flakeSprite(), depthWrite: false, sizeAttenuation: true
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    const p = [];
    for (let i = 0; i < n; i++) p.push({ x: rand(), y: Math.random() * TOP, z: rand(), s: 0.9 + Math.random() * 0.7, ph: Math.random() * 6.28, fr: 0.6 + Math.random() });
    return { pts, p, pos, geo, n };
  }
  function rand() { return (Math.random() * 2 - 1) * FIELD; }
  function flakeSprite() {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.5, 'rgba(255,255,255,0.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 32, 32);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  const rain = makeRain(700);
  const snow = makeSnow(760);
  const rainG = new THREE.Group(); rainG.add(rain.seg); rainG.visible = false; scene.add(rainG);
  const snowG = new THREE.Group(); snowG.add(snow.pts); snowG.visible = false; scene.add(snowG);

  // snow settling on the ground: a broad soft-speckled sheet that fades in the
  // longer it snows and melts back when it stops. Takes the scene lights (so it
  // reads white by day, blue by night) and catches Blanksy's shadow.
  function snowGroundTex() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#f4f7fb'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = Math.random() < 0.5 ? '#ffffff' : '#dfe6ef';
      g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 10);
    return t;
  }
  const groundSnow = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ map: snowGroundTex(), roughness: 0.95, metalness: 0, transparent: true, opacity: 0 })
  );
  groundSnow.rotation.x = -Math.PI / 2;
  groundSnow.receiveShadow = true;
  groundSnow.visible = false;
  scene.add(groundSnow);
  let snowGroundAmt = 0;                 // 0..1 accumulation

  const WEATHERS = [
    { id: null, label: 'CLEAR' },
    { id: 'rain', label: 'RAIN' },
    { id: 'snow', label: 'SNOW' }
  ];
  let weather = null;
  function setWeather(id) { weather = id; }

  // --- wind ---
  const WINDS = [
    { id: 'calm', label: 'CALM', v: 0 },
    { id: 'breeze', label: 'BREEZE', v: 1 },
    { id: 'gusty', label: 'GUSTY', v: 2.4 }
  ];
  let wind = 0, clock = 0;
  function setWind(v) { wind = v; }

  function update(dt) {
    clock += dt;
    const indoors = envs.ceilingY() != null;
    const gy = groundY();
    // keep the shower centered on Blanksy
    rainG.position.set(controls.target.x, 0, controls.target.z);
    snowG.position.set(controls.target.x, 0, controls.target.z);
    // gentle gusting so wind isn't a dead-constant push
    const gust = wind * (0.75 + 0.25 * Math.sin(clock * 0.7));
    const windX = gust, windZ = gust * 0.35 * Math.sin(clock * 0.4);

    const wantRain = weather === 'rain' && !indoors;
    const wantSnow = weather === 'snow' && !indoors;
    rainG.visible = wantRain; snowG.visible = wantSnow;

    // ground snow accumulates slowly while it snows, melts when it stops
    const target = wantSnow ? 1 : 0;
    snowGroundAmt += (target - snowGroundAmt) * Math.min(1, dt * (wantSnow ? 0.25 : 0.6));
    groundSnow.visible = snowGroundAmt > 0.01;
    if (groundSnow.visible) {
      groundSnow.position.set(controls.target.x, gy + 0.01, controls.target.z);
      groundSnow.material.opacity = snowGroundAmt * 0.9;
    }

    if (wantRain) {
      const a = rain.pos;
      for (let i = 0; i < rain.n; i++) {
        const d = rain.p[i];
        d.y -= d.s * dt; d.x += windX * dt; d.z += windZ * dt;
        if (d.y < gy) { d.y = gy + TOP; d.x = rand(); d.z = rand(); }
        // streak points back up along the drop's travel
        const len = 0.22 + d.s * 0.02;
        const vy = -d.s, vx = windX * 3, vz = windZ * 3;
        const m = Math.hypot(vx, vy, vz) || 1;
        const j = i * 6;
        a[j] = d.x; a[j + 1] = gy + (d.y - gy); a[j + 2] = d.z;
        a[j + 3] = d.x - (vx / m) * len; a[j + 4] = a[j + 1] - (vy / m) * len; a[j + 5] = d.z - (vz / m) * len;
      }
      rain.geo.attributes.position.needsUpdate = true;
    }
    if (wantSnow) {
      const a = snow.pos;
      for (let i = 0; i < snow.n; i++) {
        const d = snow.p[i];
        const sway = Math.sin(clock * d.fr + d.ph) * 0.25;
        d.y -= d.s * dt; d.x += (windX * 0.6 + sway) * dt; d.z += (windZ * 0.6) * dt;
        if (d.y < gy) { d.y = gy + TOP; d.x = rand(); d.z = rand(); }
        const j = i * 3;
        a[j] = d.x; a[j + 1] = d.y; a[j + 2] = d.z;
      }
      snow.geo.attributes.position.needsUpdate = true;
    }
  }

  applyTime();
  return { TIMES, WEATHERS, WINDS, setTime, setWeather, setWind, reassert, update };
}
