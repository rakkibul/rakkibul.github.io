import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = window.matchMedia("(hover: hover)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

$("#year").textContent = new Date().getFullYear();

// which page this is: the home page has the 3D hero; projects.html only shares the header, cards and footer
const IS_HOME = !!document.getElementById("heroPanel");

/* =========================================================
   1. HERO 3D (v2) — a wall of glossy "UI toys" (app tiles, pills,
      dots, rings). Cursor pushes them away and leaves a
      liquid, colour-split smear across the panel.
   ========================================================= */
const panel = $("#heroPanel");
const hero = panel ? createHero() : null;

function createHero() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: $("#webgl"), antialias: false, alpha: false, powerPreference: "high-performance" }); }
  catch (e) { return null; }
  const dpr = Math.min(window.devicePixelRatio, 2);
  const isMobile = window.innerWidth < 760;
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#14151b");
  scene.fog = new THREE.Fog("#14151b", 14, 24);              // far objects sink into the dark, like a deep pile
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 14);
  const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(-4, 9, 7); scene.add(key);
  const fill = new THREE.DirectionalLight(0xc8d0ff, 0.6); fill.position.set(6, -3, 4); scene.add(fill);

  /* ---------- shapes & materials (instanced: one draw call per shape × colour) ---------- */
  const pillGeo = new THREE.CapsuleGeometry(0.4, 1.0, 8, 24); pillGeo.rotateZ(Math.PI / 2);
  // kind tells the physics which real collider to build for the shape
  const shapes = [
    { kind: "tile", geo: new RoundedBoxGeometry(1.4, 1.4, 0.46, 6, 0.22), w: 3 },
    { kind: "pill", geo: pillGeo, w: 3 },
    { kind: "ball", geo: new THREE.SphereGeometry(0.55, 48, 32), w: 2 },
    { kind: "ring", geo: new THREE.TorusGeometry(0.5, 0.22, 24, 64), w: 2 },
  ];
  const totalW = shapes.reduce((s, x) => s + x.w, 0);
  const pickShape = () => { let n = Math.random() * totalW; return shapes.indexOf(shapes.find((s) => (n -= s.w) < 0)); };

  const COLORS = ["#0016ec", "#d9dbe2", "#0c0c0f"];   // brand blue + white + black, fixed
  const mats = [
    new THREE.MeshPhysicalMaterial({ roughness: 0.34, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.75 }), // satin blue
    new THREE.MeshPhysicalMaterial({ roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.4, envMapIntensity: 0.7 }),   // soft white
    new THREE.MeshPhysicalMaterial({ roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.0 }),   // glossy black
  ];
  COLORS.forEach((c, k) => mats[k].color.set(c));
  const pickMat = () => { const n = Math.random(); return n < 0.4 ? 0 : n < 0.72 ? 1 : 2; };

  /* =========================================================
     Stable-fluids cursor simulation (velocity + dye), the
     classic Jos Stam method: splat → vorticity → pressure
     projection → advection. Runs at low resolution.
     ========================================================= */
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const quad = new THREE.Mesh(quadGeo);
  const quadScene = new THREE.Scene(); quadScene.add(quad);
  const quadVS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
  const fx = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: quadVS, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
  const rtOpts = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping };
  const pingpong = () => { const a = new THREE.WebGLRenderTarget(1, 1, rtOpts), b = new THREE.WebGLRenderTarget(1, 1, rtOpts); return { read: a, write: b, swap() { [this.read, this.write] = [this.write, this.read]; } }; };
  const velocity = pingpong(), dye = pingpong(), pressure = pingpong();
  const divergenceRT = new THREE.WebGLRenderTarget(1, 1, rtOpts), curlRT = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  const simTexel = new THREE.Vector2(), dyeTexel = new THREE.Vector2();
  const NB = `uniform vec2 uTexel; varying vec2 vUv;
    vec2 L(){ return vUv - vec2(uTexel.x, 0.0); } vec2 R(){ return vUv + vec2(uTexel.x, 0.0); }
    vec2 T(){ return vUv + vec2(0.0, uTexel.y); } vec2 B(){ return vUv - vec2(0.0, uTexel.y); }`;

  const splatMat = fx(`uniform sampler2D uTarget; uniform vec3 uColor; uniform vec2 uPoint; uniform float uRadius, uAspect; varying vec2 vUv;
    void main(){ vec2 p = vUv - uPoint; p.x *= uAspect; vec3 s = exp(-dot(p, p) / uRadius) * uColor;
      gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + s, 1.0); }`,
    { uTarget: { value: null }, uColor: { value: new THREE.Vector3() }, uPoint: { value: new THREE.Vector2() }, uRadius: { value: 0.002 }, uAspect: { value: 1 } });
  const curlMat = fx(`uniform sampler2D uVelocity; ${NB}
    void main(){ float l = texture2D(uVelocity, L()).y, r = texture2D(uVelocity, R()).y, t = texture2D(uVelocity, T()).x, b = texture2D(uVelocity, B()).x;
      gl_FragColor = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0); }`,
    { uVelocity: { value: null }, uTexel: { value: simTexel } });
  const vorticityMat = fx(`uniform sampler2D uVelocity, uCurl; uniform float uCurlStrength, uDt; ${NB}
    void main(){ float l = texture2D(uCurl, L()).x, r = texture2D(uCurl, R()).x, t = texture2D(uCurl, T()).x, b = texture2D(uCurl, B()).x, c = texture2D(uCurl, vUv).x;
      vec2 f = 0.5 * vec2(abs(t) - abs(b), abs(r) - abs(l)); f /= length(f) + 0.0001; f *= uCurlStrength * c; f.y *= -1.0;
      vec2 v = texture2D(uVelocity, vUv).xy + f * uDt; gl_FragColor = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0); }`,
    { uVelocity: { value: null }, uCurl: { value: null }, uCurlStrength: { value: 22 }, uDt: { value: 0.016 }, uTexel: { value: simTexel } });
  const divergenceMat = fx(`uniform sampler2D uVelocity; ${NB}
    void main(){ float l = texture2D(uVelocity, L()).x, r = texture2D(uVelocity, R()).x, t = texture2D(uVelocity, T()).y, b = texture2D(uVelocity, B()).y;
      vec2 c = texture2D(uVelocity, vUv).xy;
      if (L().x < 0.0) l = -c.x; if (R().x > 1.0) r = -c.x; if (T().y > 1.0) t = -c.y; if (B().y < 0.0) b = -c.y;
      gl_FragColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0); }`,
    { uVelocity: { value: null }, uTexel: { value: simTexel } });
  const scaleMat = fx(`uniform sampler2D uTex; uniform float uValue; varying vec2 vUv; void main(){ gl_FragColor = uValue * texture2D(uTex, vUv); }`,
    { uTex: { value: null }, uValue: { value: 0.8 } });
  const pressureMat = fx(`uniform sampler2D uPressure, uDivergence; ${NB}
    void main(){ float l = texture2D(uPressure, L()).x, r = texture2D(uPressure, R()).x, t = texture2D(uPressure, T()).x, b = texture2D(uPressure, B()).x;
      float d = texture2D(uDivergence, vUv).x; gl_FragColor = vec4((l + r + b + t - d) * 0.25, 0.0, 0.0, 1.0); }`,
    { uPressure: { value: null }, uDivergence: { value: null }, uTexel: { value: simTexel } });
  const gradientMat = fx(`uniform sampler2D uPressure, uVelocity; ${NB}
    void main(){ float l = texture2D(uPressure, L()).x, r = texture2D(uPressure, R()).x, t = texture2D(uPressure, T()).x, b = texture2D(uPressure, B()).x;
      vec2 v = texture2D(uVelocity, vUv).xy - vec2(r - l, t - b); gl_FragColor = vec4(v, 0.0, 1.0); }`,
    { uPressure: { value: null }, uVelocity: { value: null }, uTexel: { value: simTexel } });
  const advectMat = fx(`uniform sampler2D uVelocity, uSource; uniform vec2 uTexel; uniform float uDt, uDissipation; varying vec2 vUv;
    void main(){ vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexel;
      gl_FragColor = texture2D(uSource, coord) / (1.0 + uDissipation * uDt); }`,
    { uVelocity: { value: null }, uSource: { value: null }, uTexel: { value: simTexel }, uDt: { value: 0.016 }, uDissipation: { value: 0.2 } });

  const blit = (mat, target) => { quad.material = mat; renderer.setRenderTarget(target); renderer.render(quadScene, quadCam); };
  const PRESSURE_ITER = isMobile ? 10 : 18;

  const splat = (x, y, dx, dy, amount) => {
    splatMat.uniforms.uPoint.value.set(x, y);
    splatMat.uniforms.uTarget.value = velocity.read.texture;
    splatMat.uniforms.uColor.value.set(dx, dy, 0);
    blit(splatMat, velocity.write); velocity.swap();
    splatMat.uniforms.uTarget.value = dye.read.texture;
    splatMat.uniforms.uColor.value.set(amount, amount, amount);
    blit(splatMat, dye.write); dye.swap();
  };

  const fluidStep = (dt) => {
    curlMat.uniforms.uVelocity.value = velocity.read.texture; blit(curlMat, curlRT);
    vorticityMat.uniforms.uVelocity.value = velocity.read.texture; vorticityMat.uniforms.uCurl.value = curlRT.texture; vorticityMat.uniforms.uDt.value = dt;
    blit(vorticityMat, velocity.write); velocity.swap();
    divergenceMat.uniforms.uVelocity.value = velocity.read.texture; blit(divergenceMat, divergenceRT);
    scaleMat.uniforms.uTex.value = pressure.read.texture; scaleMat.uniforms.uValue.value = 0.8; blit(scaleMat, pressure.write); pressure.swap();
    pressureMat.uniforms.uDivergence.value = divergenceRT.texture;
    for (let i = 0; i < PRESSURE_ITER; i++) { pressureMat.uniforms.uPressure.value = pressure.read.texture; blit(pressureMat, pressure.write); pressure.swap(); }
    gradientMat.uniforms.uPressure.value = pressure.read.texture; gradientMat.uniforms.uVelocity.value = velocity.read.texture; blit(gradientMat, velocity.write); velocity.swap();
    advectMat.uniforms.uDt.value = dt;
    advectMat.uniforms.uTexel.value = simTexel;
    advectMat.uniforms.uVelocity.value = velocity.read.texture; advectMat.uniforms.uSource.value = velocity.read.texture; advectMat.uniforms.uDissipation.value = 0.9;
    blit(advectMat, velocity.write); velocity.swap();
    advectMat.uniforms.uVelocity.value = velocity.read.texture; advectMat.uniforms.uSource.value = dye.read.texture; advectMat.uniforms.uDissipation.value = 1.6;
    blit(advectMat, dye.write); dye.swap();
    renderer.setRenderTarget(null);
  };

  /* ---------- post-processing: render → ambient occlusion → fluid distortion → bloom → SMAA → output ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 1, 1);
  gtao.output = GTAOPass.OUTPUT.Default;
  gtao.blendIntensity = 1.0;
  gtao.updateGtaoMaterial({ radius: 1.5, distanceExponent: 1.4, thickness: 1.6, scale: 1.8, samples: 16, distanceFallOff: 1, screenSpaceRadius: false });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  composer.addPass(gtao);

  const distortPass = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uVel: { value: null }, uDye: { value: null }, uTime: { value: 0 } },
    vertexShader: quadVS,
    fragmentShader: `
      uniform sampler2D tDiffuse, uVel, uDye; uniform float uTime; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec2 v = texture2D(uVel, vUv).xy;
        float d = clamp(texture2D(uDye, vUv).r, 0.0, 1.0);
        vec2 off = v * 0.00045;
        float shift = 0.18 * d;
        vec3 col;
        col.r = texture2D(tDiffuse, vUv - off * (1.0 + shift)).r;
        col.g = texture2D(tDiffuse, vUv - off).g;
        col.b = texture2D(tDiffuse, vUv - off * (1.0 - shift)).b;
        float shade = clamp(dot(v, vec2(0.7, 0.7)) * 0.004, -0.35, 0.35);   // liquid relief
        col *= 1.0 + shade * d;
        col += (hash(vUv * 1000.0 + uTime) - 0.5) / 255.0;                  // dither against banding
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  composer.addPass(distortPass);
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.12, 0.4, 0.96);
  composer.addPass(bloom);
  const smaa = new SMAAPass(1, 1);
  composer.addPass(smaa);
  composer.addPass(new OutputPass());

  /* ---------- sizing ---------- */
  let halfW = 5, halfH = 3.75, aspect = 1;
  const resize = () => {
    const w = panel.clientWidth, h = panel.clientHeight;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    camera.aspect = aspect = w / h;
    camera.updateProjectionMatrix();
    const prevW = halfW, prevH = halfH;
    halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    halfW = halfH * camera.aspect;
    // screen size changed: stretch every toy's resting spot so the pile still fills the panel
    bodies.forEach((b) => { b.home.x *= halfW / prevW; b.home.y *= halfH / prevH; });
    const simShort = isMobile ? 96 : 128, dyeShort = isMobile ? 256 : 384;
    const sim = aspect >= 1 ? [Math.round(simShort * aspect), simShort] : [simShort, Math.round(simShort / aspect)];
    const dy = aspect >= 1 ? [Math.round(dyeShort * aspect), dyeShort] : [dyeShort, Math.round(dyeShort / aspect)];
    [velocity.read, velocity.write, pressure.read, pressure.write, divergenceRT, curlRT].forEach((t) => t.setSize(sim[0], sim[1]));
    [dye.read, dye.write].forEach((t) => t.setSize(dy[0], dy[1]));
    simTexel.set(1 / sim[0], 1 / sim[1]); dyeTexel.set(1 / dy[0], 1 / dy[1]);
    splatMat.uniforms.uAspect.value = aspect;
    splatMat.uniforms.uRadius.value = 0.0022 * (aspect > 1 ? aspect : 1);
  };

  /* ---------- instanced meshes ---------- */
  const bodies = [];
  const instanced = [];
  const COUNT = isMobile ? 30 : 60;
  const plan = Array.from({ length: COUNT }, () => ({ s: pickShape(), m: pickMat() }));
  shapes.forEach((shape, si) => mats.forEach((mat, mi) => {
    const n = plan.filter((p) => p.s === si && p.m === mi).length;
    if (!n) return;
    const im = new THREE.InstancedMesh(shape.geo, mat, n);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    im.frustumCulled = false;
    im.count = 0;                                    // nothing visible until physics is ready
    scene.add(im);
    instanced.push({ im, si, mi, used: 0 });
  }));

  resize();
  new ResizeObserver(resize).observe(panel);      // follows the panel itself, so layout changes resize the 3D too

  /* =========================================================
     Rapier physics: every toy gets a collider that matches
     its real shape; a kinematic ball follows the cursor.
     ========================================================= */
  let R = null, world = null, cursorBody = null;
  const quatFrom = (q) => ({ x: q.x, y: q.y, z: q.z, w: q.w });

  const initPhysics = async () => {
    const mod = await import("https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.14.0/rapier.es.js");
    R = mod.default;
    await R.init();
    world = new R.World({ x: 0, y: 0, z: 0 });
    world.timestep = 1 / 60;

    plan.forEach(({ s, m }) => {
      const slot = instanced.find((x) => x.si === s && x.mi === m);
      const scale = isMobile ? 0.8 + Math.random() * 0.4 : 1.35 + Math.random() * 0.65;
      const home = new THREE.Vector3(
        (Math.random() * 2 - 1) * halfW * 1.05,
        (Math.random() * 2 - 1) * halfH * 1.05,
        -2.5 + Math.random() * 4
      );
      const start = home.clone().add(new THREE.Vector3(0, -halfH * 3 - Math.random() * 6, Math.random() * 4));
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6));
      const rb = world.createRigidBody(
        R.RigidBodyDesc.dynamic().setTranslation(start.x, start.y, start.z).setRotation(quatFrom(q))
          .setLinearDamping(2.2).setAngularDamping(1.1).setCanSleep(false)
      );
      const kind = shapes[s].kind, k = scale;
      const descs = [];
      if (kind === "tile") descs.push(R.ColliderDesc.roundCuboid(0.48 * k, 0.48 * k, 0.03 * k, 0.2 * k));
      if (kind === "pill") descs.push(R.ColliderDesc.capsule(0.5 * k, 0.4 * k).setRotation({ x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 }));
      if (kind === "ball") descs.push(R.ColliderDesc.ball(0.55 * k));
      if (kind === "ring") for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        descs.push(R.ColliderDesc.ball(0.22 * k).setTranslation(Math.cos(a) * 0.5 * k, Math.sin(a) * 0.5 * k, 0));
      }
      descs.forEach((d) => world.createCollider(d.setDensity(1).setFriction(0.25).setRestitution(0.15), rb));
      bodies.push({ rb, im: slot.im, id: slot.used++, scale, home, seed: Math.random() * 100 });
    });
    instanced.forEach((x) => { x.im.count = x.used; });

    cursorBody = world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 60));
    world.createCollider(R.ColliderDesc.ball(1.1), cursorBody);
  };
  const physicsReady = initPhysics().catch((e) => { console.warn("Physics failed to load", e); });

  /* ---------- pointer ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const mouseWorld = new THREE.Vector3(0, 0, 60), mousePrev = new THREE.Vector3(0, 0, 60);
  const mouseVel = new THREE.Vector3();
  const uvNow = new THREE.Vector2(), uvPrev = new THREE.Vector2();
  let inside = false, fresh = true, moved = false;

  const onMove = (e) => {
    const r = panel.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    uvNow.set((ndc.x + 1) / 2, (ndc.y + 1) / 2);
    ray.setFromCamera(ndc, camera);
    ray.ray.intersectPlane(plane, mouseWorld);
    if (!inside) fresh = true;
    inside = true; moved = true;
  };
  panel.addEventListener("pointermove", onMove);
  panel.addEventListener("pointerleave", () => { inside = false; });

  const tmp = new THREE.Vector3();
  const burst = (origin, power) => bodies.forEach(({ rb }) => {
    const t = rb.translation(); tmp.set(t.x, t.y, t.z).sub(origin);
    const len = Math.max(tmp.length(), 0.6), m = rb.mass();
    tmp.normalize().multiplyScalar(((power * 9) / len + Math.random()) * m);
    rb.applyImpulse({ x: tmp.x, y: tmp.y, z: tmp.z }, true);
    rb.applyTorqueImpulse({ x: (Math.random() - 0.5) * m * 2, y: (Math.random() - 0.5) * m * 2, z: (Math.random() - 0.5) * m }, true);
  });
  panel.addEventListener("pointerdown", (e) => { onMove(e); burst(mouseWorld.clone(), 0.8); });

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(panel);

  /* ---------- per-frame physics step (fixed 60 Hz, frame-rate independent) ---------- */
  const closest = new THREE.Vector3(), seg = new THREE.Vector3(), pos = new THREE.Vector3();
  const mtx = new THREE.Matrix4(), sv = new THREE.Vector3(), qq = new THREE.Quaternion();
  let running = false, time = 0, acc = 0;

  const physicsTick = () => {
    const h = 1 / 60;
    time += h;
    if (inside) {
      if (fresh) { mousePrev.copy(mouseWorld); fresh = false; }
      mouseVel.copy(mouseWorld).sub(mousePrev);
      cursorBody.setNextKinematicTranslation({ x: mouseWorld.x, y: mouseWorld.y, z: 0 });
    } else {
      mouseVel.set(0, 0, 0);
      cursorBody.setNextKinematicTranslation({ x: 0, y: 0, z: 60 });
    }
    seg.copy(mouseWorld).sub(mousePrev);
    const segLen2 = Math.max(seg.lengthSq(), 1e-6);

    for (const b of bodies) {
      const t = b.rb.translation(), m = b.rb.mass();
      pos.set(t.x, t.y, t.z);
      // spring toward a slowly drifting home position keeps the wall full
      tmp.set(Math.sin(time * 0.35 + b.seed) * 0.35, Math.cos(time * 0.3 + b.seed * 1.3) * 0.3, 0).add(b.home).sub(pos);
      tmp.multiplyScalar(m * 0.12);
      b.rb.applyImpulse({ x: tmp.x, y: tmp.y, z: tmp.z }, true);
      if (inside) {
        // anything near the cursor's path gets dragged along the swipe and spun
        const u = THREE.MathUtils.clamp(tmp.copy(pos).sub(mousePrev).dot(seg) / segLen2, 0, 1);
        closest.copy(mousePrev).addScaledVector(seg, u);
        const dist = tmp.copy(pos).sub(closest).setZ(0).length();
        const reach = 2.2;
        if (dist < reach) {
          const f = (reach - dist) / reach;
          b.rb.applyImpulse({ x: mouseVel.x * m * f * 2.2, y: mouseVel.y * m * f * 2.2, z: 0 }, true);
          b.rb.applyTorqueImpulse({ x: -mouseVel.y * m * f * 0.8, y: mouseVel.x * m * f * 0.8, z: 0 }, true);
        }
      }
    }
    mousePrev.copy(mouseWorld);
    world.step();
  };

  const syncMeshes = () => {
    for (const b of bodies) {
      const t = b.rb.translation(), r = b.rb.rotation();
      mtx.compose(pos.set(t.x, t.y, t.z), qq.set(r.x, r.y, r.z, r.w), sv.setScalar(b.scale));
      b.im.setMatrixAt(b.id, mtx);
    }
    instanced.forEach(({ im }) => { im.instanceMatrix.needsUpdate = true; });
  };

  const step = (dt = 1 / 60) => {
    if (!world) return;
    acc = Math.min(acc + dt, 4 / 60);
    while (acc >= 1 / 60) { physicsTick(); acc -= 1 / 60; }
    syncMeshes();
  };

  /* ---------- main loop ---------- */
  const clock = new THREE.Clock();
  const loop = () => {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 1 / 20);
    if (!visible || !running) return;
    if (!reduceMotion) step(dt);

    // feed the cursor into the fluid: several splats along the path so fast swipes stay continuous
    if (inside && moved) {
      const dx = uvNow.x - uvPrev.x, dy = uvNow.y - uvPrev.y;
      if (!fresh && (dx || dy)) {
        const n = Math.min(8, Math.ceil(Math.hypot(dx * aspect, dy) / 0.02));
        for (let i = 1; i <= n; i++) {
          const t = i / n;
          splat(uvPrev.x + dx * t, uvPrev.y + dy * t, (dx * 6000) / n, (dy * 6000) / n, Math.min(Math.hypot(dx, dy) * 12, 0.6) / n);
        }
      }
      moved = false;
    }
    uvPrev.copy(uvNow);
    fluidStep(dt);

    distortPass.uniforms.uVel.value = velocity.read.texture;
    distortPass.uniforms.uDye.value = dye.read.texture;
    distortPass.uniforms.uTime.value = time;
    composer.render();
  };
  loop();
  if (location.search.includes("debug")) window.__hero = { renderer, composer, gtao, bloom, smaa, distortPass, step, splat, fluidStep, physicsReady };

  return {
    start() {
      running = true;
      if (reduceMotion) physicsReady.then(() => { bodies.forEach((b) => b.rb.setTranslation({ x: b.home.x, y: b.home.y, z: b.home.z }, true)); for (let i = 0; i < 120; i++) physicsTick(); syncMeshes(); });
    },
  };
}

/* =========================================================
   1b. Music — four soft tracks composed in code and played
       live with the Web Audio API (no audio files). They
       shuffle and crossfade. Off until the visitor asks.
   ========================================================= */
const ambient = (() => {
  let ctx = null, master = null, fxIn = null, filter = null, noiseBuf = null;
  let playing = false, timer = 0, order = [], orderPos = 0;
  let cur = null;                                   // { track, gain, start, nextTime, step }
  const TRACK_SECONDS = 75, FADE = 5;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const rnd = (a) => a[(Math.random() * a.length) | 0];

  /* ---------- tiny instruments ---------- */
  const env = (g, t, peak, a, hold, r) => {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.linearRampToValueAtTime(0, t + a + hold + r);
    return t + a + hold + r + 0.05;
  };
  const osc = (type, f, t, end, out, detune = 0) => {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune;
    o.connect(out); o.start(t); o.stop(end); return o;
  };
  const pad = (notes, t, dur, out, vol = 0.05) => notes.forEach((m) => {
    const g = ctx.createGain(); g.connect(out);
    const end = env(g, t, vol / Math.sqrt(notes.length), dur * 0.3, dur * 0.4, dur * 0.45);
    osc("sine", hz(m), t, end, g, -5); osc("triangle", hz(m), t, end, g, 6);
  });
  const pluck = (m, t, out, vol = 0.05, decay = 1.2) => {          // soft FM bell
    const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    car.frequency.value = hz(m); mod.frequency.value = hz(m) * 2;
    mg.gain.setValueAtTime(hz(m) * 1.4, t); mg.gain.exponentialRampToValueAtTime(1, t + decay * 0.6);
    mod.connect(mg).connect(car.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    car.connect(g).connect(out);
    car.start(t); mod.start(t); car.stop(t + decay + 0.05); mod.stop(t + decay + 0.05);
  };
  const keys = (notes, t, out, vol = 0.04, decay = 2.6) => notes.forEach((m) => {  // warm electric piano
    const g = ctx.createGain(), trem = ctx.createOscillator(), tg = ctx.createGain();
    trem.frequency.value = 4.2; tg.gain.value = vol * 0.25; trem.connect(tg).connect(g.gain);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    g.connect(out);
    osc("sine", hz(m), t, t + decay, g); osc("sine", hz(m + 12), t, t + decay * 0.4, g, 3);
    trem.start(t); trem.stop(t + decay);
  });
  const sub = (m, t, dur, out, vol = 0.09) => { const g = ctx.createGain(); g.connect(out); osc("sine", hz(m), t, env(g, t, vol, 0.08, dur * 0.6, dur * 0.4), g); };
  const kick = (t, out, vol = 0.22) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.5);
  };
  const hat = (t, out, vol = 0.018) => {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = "highpass"; f.frequency.value = 7500;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    s.connect(f).connect(g).connect(out); s.start(t, Math.random()); s.stop(t + 0.08);
  };
  const crackle = (t, out) => {                                      // vinyl dust
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = "bandpass"; f.frequency.value = 2500 + Math.random() * 3000; f.Q.value = 2;
    g.gain.setValueAtTime(0.012 * Math.random(), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
    s.connect(f).connect(g).connect(out); s.start(t, Math.random()); s.stop(t + 0.03);
  };

  /* ---------- the four tracks (steps are 16th notes) ---------- */
  const TRACKS = [
    { name: "Drift", bpm: 60, tone: 1300,                 // warm evolving pads + glassy bells
      chords: [[48, 55, 59, 62, 64], [45, 52, 55, 59, 60], [41, 48, 52, 57, 59], [43, 50, 52, 57, 59]],
      bells: [72, 74, 76, 79, 81, 84],
      step(i, t, out) {
        const spb = 60 / this.bpm;
        if (i % 32 === 0) pad(this.chords[(i / 32) % 4], t, spb * 9, out, 0.06);
        if (i % 4 === 0 && Math.random() < 0.22) pluck(rnd(this.bells), t, out, 0.03, 3);
      } },
    { name: "Glass", bpm: 92, tone: 3200,                 // gentle arpeggios over a soft bed
      chords: [[50, 57, 60, 64, 65], [46, 53, 57, 60, 62], [41, 48, 53, 57, 60], [48, 55, 57, 62, 64]],
      pattern: [0, 2, 4, 3, 1, 3, 4, 2],
      step(i, t, out) {
        const bar = Math.floor(i / 16), chord = this.chords[Math.floor(bar / 2) % 4], spb = 60 / this.bpm;
        if (i % 32 === 0) { pad(chord.map((m) => m + 12), t, spb * 8.5, out, 0.035); sub(chord[0] - 12, t, spb * 7.5, out, 0.07); }
        if (i % 2 === 0) pluck(chord[this.pattern[(i / 2) % 8]] + 12, t, out, i % 8 === 0 ? 0.045 : 0.03, 1.1);
        if (i % 16 === 14 && Math.random() < 0.5) pluck(chord[4] + 24, t, out, 0.018, 2);
      } },
    { name: "Lo-fi", bpm: 74, tone: 1900, swing: 0.16,    // dusty keys, soft kick and hats
      chords: [[51, 55, 58, 62, 65], [48, 51, 55, 58, 62], [44, 48, 51, 55, 58], [46, 50, 53, 57, 60]],
      step(i, t, out) {
        const bar = Math.floor(i / 16), chord = this.chords[bar % 4], s = i % 16;
        if (s === 0) { keys(chord.slice(1), t, out, 0.035); sub(chord[0] - 12, t, 1.6, out, 0.08); }
        if (s === 10) keys(chord.slice(2), t, out, 0.022, 1.8);
        if (s === 0 || s === 10) kick(t, out, 0.2);
        if (s === 7 && Math.random() < 0.3) kick(t, out, 0.1);
        if (s % 2 === 0) hat(t, out, s % 4 === 2 ? 0.02 : 0.012);
        if (Math.random() < 0.35) crackle(t, out);
      } },
    { name: "Night", bpm: 52, tone: 900,                  // deep drone with distant shimmer
      shimmer: [76, 78, 80, 83, 85, 88],
      step(i, t, out) {
        const spb = 60 / this.bpm;
        if (i % 64 === 0) { pad([40, 47, 52], t, spb * 17, out, 0.07); sub(28, t, spb * 15, out, 0.06); }
        if (i % 64 === 32) pad([44, 47, 54, 59], t, spb * 17, out, 0.04);
        if (i % 4 === 0 && Math.random() < 0.15) pluck(rnd(this.shimmer), t, out, 0.016, 4);
      } },
  ];

  /* ---------- engine ---------- */
  const build = () => {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    const reverb = ctx.createConvolver(); reverb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.5;
    const dry = ctx.createGain(); dry.gain.value = 0.6;
    filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 1500; filter.Q.value = 0.4;
    const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
    lfo.frequency.value = 0.04; lfoGain.gain.value = 350; lfo.connect(lfoGain).connect(filter.frequency); lfo.start();
    fxIn = ctx.createGain();
    fxIn.connect(filter); filter.connect(dry).connect(master); filter.connect(reverb).connect(wet).connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  };

  const shuffle = () => {                          // new random order, never repeating the last track first
    const last = order[order.length - 1];
    do { order = [0, 1, 2, 3].sort(() => Math.random() - 0.5); } while (order.length > 1 && order[0] === last);
    orderPos = 0;
  };
  const playTrack = (idx, when) => {
    if (cur) { const g = cur.gain; g.gain.cancelScheduledValues(when); g.gain.setValueAtTime(g.gain.value, when); g.gain.linearRampToValueAtTime(0, when + FADE); }
    const gain = ctx.createGain(); gain.connect(fxIn);
    gain.gain.setValueAtTime(0, when); gain.gain.linearRampToValueAtTime(1, when + FADE);
    const track = TRACKS[idx];
    filter.frequency.setTargetAtTime(track.tone, when, 2);
    cur = { track, gain, start: when, nextTime: when + 0.05, step: 0 };
    onTrack(track.name);
  };
  const next = () => { if (orderPos >= order.length) shuffle(); playTrack(order[orderPos++], ctx.currentTime); };

  const tick = () => {                             // look-ahead scheduler
    if (!playing) return;
    if (ctx.currentTime - cur.start > TRACK_SECONDS) next();
    const tr = cur.track, sixteenth = 60 / tr.bpm / 4;
    while (cur.nextTime < ctx.currentTime + 0.2) {
      const swing = tr.swing && cur.step % 2 ? tr.swing * sixteenth : 0;
      tr.step(cur.step, cur.nextTime + swing, cur.gain);
      cur.step++; cur.nextTime += sixteenth;
    }
  };

  let onTrack = () => {};
  const start = () => {
    if (!ctx) build();
    ctx.resume();
    playing = true;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.3, ctx.currentTime, 1.0);    // gentle fade in
    if (!cur) { shuffle(); next(); } else next();               // each press of play starts a fresh pick
    timer = setInterval(tick, 25);
  };
  const stop = () => {
    playing = false; clearInterval(timer);
    if (!ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);      // gentle fade out
  };
  document.addEventListener("visibilitychange", () => {         // never keep playing in a hidden tab
    if (!ctx || !playing) return;
    document.hidden ? ctx.suspend() : ctx.resume();
  });
  return {
    toggle: () => (playing ? stop() : start(), playing),
    skip: () => playing && next(),
    // the showreel turns the music down while it plays (0 = normal, 1 = silent), like Lusion's reel
    duck: (v) => { if (ctx && playing) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0.3 * (1 - v), ctx.currentTime, 0.3); } },
    set onTrack(fn) { onTrack = fn; },
    get playing() { return playing; },
    get tracks() { return TRACKS.map((t) => t.name); },
  };
})();
if (location.search.includes("debug")) window.__ambient = ambient;

// the icon: a flat line that grows into one tall, living sine wave while music plays
const soundBtn = $("#soundBtn"), soundWave = $("#soundWave");
const wave = { amp: 0, target: 0, phase: 0, raf: 0, last: 0 };
const drawWave = (now) => {
  const dt = Math.min((now - (wave.last || now)) / 1000, 0.05); wave.last = now;
  wave.amp += (wave.target - wave.amp) * (1 - Math.pow(0.001, dt));        // smooth, frame-rate independent ease
  wave.phase += dt * 5.5;
  const breathe = 0.8 + 0.2 * Math.sin(now / 420);                          // height pulses gently, like sound
  let d = "";
  for (let x = 3; x <= 21.001; x += 0.5) {
    const u = (x - 3) / 18;                                                   // 0..1 across the icon
    const a = u * Math.PI * 2 * 1.05 - wave.phase + 0.6;
    const shape = 0.7 * (Math.asin(Math.sin(a)) / (Math.PI / 2)) + 0.3 * Math.sin(a);   // crisp turns, like the reference
    const y = 9 - wave.amp * breathe * shape;
    d += (x === 3 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(2) + " ";
  }
  soundWave.setAttribute("d", d);
  if (wave.target > 0 || wave.amp > 0.02) wave.raf = requestAnimationFrame(drawWave);
  else { soundWave.setAttribute("d", "M3 9 L21 9"); wave.raf = 0; wave.last = 0; }
};
soundBtn.addEventListener("click", () => {
  const on = ambient.toggle();
  soundBtn.classList.toggle("is-active", on);
  soundBtn.setAttribute("aria-pressed", String(on));
  soundBtn.setAttribute("aria-label", on ? "Mute ambient music" : "Play ambient music");
  wave.target = on ? 6.8 : 0;
  if (!wave.raf) wave.raf = requestAnimationFrame(drawWave);
});

// Interface sounds, made in code: soft, smooth bubbles. A bubble is a round sine whose pitch slides
// quickly upward as it rises and pops ("bloop"). Small bubble on hover, a fuller double bubble over a
// project card, a rounder plop on press/tap. Starts after the first click/tap (browser rule).
const uiSound = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  let ctx = null, out = null, last = 0, hovered = null;
  const init = () => {
    if (ctx) return;
    ctx = new AC();
    out = ctx.createGain(); out.gain.value = 0.7;
    const soft = ctx.createBiquadFilter(); soft.type = "lowpass"; soft.frequency.value = 3600; soft.Q.value = 0.2;
    // a little wet space makes the bubbles smooth and liquid instead of dry beeps
    const len = Math.floor(ctx.sampleRate * 0.6), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 5); }
    const room = ctx.createConvolver(); room.buffer = ir;
    const dry = ctx.createGain(); dry.gain.value = 0.85;
    const wet = ctx.createGain(); wet.gain.value = 0.18;
    out.connect(soft); soft.connect(dry).connect(ctx.destination); soft.connect(room).connect(wet).connect(ctx.destination);
  };
  const unlock = () => { init(); if (ctx.state !== "running") ctx.resume(); };
  addEventListener("pointerdown", unlock, true); addEventListener("keydown", unlock, true);
  const ready = () => ctx && ctx.state === "running" && !document.hidden;
  // one bubble: pitch rises from f to f*rise with a smooth swell and fade
  const bubble = (f, rise, dur, vol, delay = 0) => {
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * rise, t + dur * 0.8);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.03);
  };
  const vary = () => 0.92 + Math.random() * 0.16;    // every bubble a little different, like real water
  const play = {
    tick() { bubble(520 * vary(), 2.1, 0.075, 0.045); },                                        // small bubble
    ting() { const f = 330 * vary(); bubble(f, 2.2, 0.11, 0.05); bubble(f * 1.35, 2.0, 0.09, 0.03, 0.07); },  // double bubble
    pop()  { bubble(240 * vary(), 2.6, 0.12, 0.08); },                                          // round plop
  };
  const target = (el) => el?.closest?.("a, button, [role='button'], .project__media, .reel__panel, .reelov__bar, input[type='email']");
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse" || !ready()) return;
    const el = target(e.target);
    if (!el || el === hovered) return;
    hovered = el;
    const now = performance.now(); if (now - last < 60) return; last = now;
    el.matches(".project__media") ? play.ting() : play.tick();
  });
  document.addEventListener("pointerout", (e) => { if (hovered && !hovered.contains(e.relatedTarget)) hovered = null; });
  document.addEventListener("pointerdown", (e) => {
    if (!target(e.target)) return;
    if (ctx && ctx.state !== "running") ctx.resume().then(play.pop).catch(() => {}); else if (ctx) play.pop();
  });
  return play;
})();
if (location.search.includes("debug")) window.__uiSound = uiSound;

/* =========================================================
   2. Page cursor trail — a light, glassy ripple. The cursor
      paints a soft stroke (velocity + weight) that drifts and
      fades within about a second. It is drawn like clear
      liquid glass: see-through in the middle, with a gentle
      highlight, shadow and pastel fringe along its edges.
      (The hero has its own distortion, so we skip it there.)
   ========================================================= */
if (canHover && !reduceMotion) (() => {
  let r;
  try { r = new THREE.WebGLRenderer({ canvas: $("#trail"), alpha: true, premultipliedAlpha: true, antialias: false }); }
  catch (e) { return; }
  r.setPixelRatio(1);
  r.setClearColor(0x000000, 0);

  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  const scene = new THREE.Scene(); scene.add(quad);
  const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
  const opts = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  let A = new THREE.WebGLRenderTarget(1, 1, opts), B = new THREE.WebGLRenderTarget(1, 1, opts);
  const texel = new THREE.Vector2();

  // the stroke field: a smooth "thickness" value the cursor paints in and that slowly melts away
  const paintM = new THREE.ShaderMaterial({
    vertexShader: VS, depthTest: false, depthWrite: false,
    uniforms: { uPrev: { value: null }, uFrom: { value: new THREE.Vector2(-9, -9) }, uTo: { value: new THREE.Vector2(-9, -9) },
      uVel: { value: new THREE.Vector2() }, uRadius: { value: 0.05 }, uAspect: { value: 1 }, uTexel: { value: texel }, uOn: { value: 0 }, uTime: { value: 0 } },
    fragmentShader: `
      uniform sampler2D uPrev; uniform vec2 uFrom, uTo, uTexel; uniform float uRadius, uAspect, uOn, uTime; varying vec2 vUv;
      float seg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0); return length(pa - ba * h); }
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        // drift on a slow, smooth swirl so edges become wavy and organic, like liquid
        vec2 q = vUv * vec2(uAspect, 1.0) * 5.0 + uTime * 0.25;
        vec2 flow = vec2(noise(q) - 0.5, noise(q + 17.3) - 0.5) * uTexel * 2.2;
        vec2 uv = vUv + flow;
        // gentle blur keeps the shape silky (no grain), then it fades
        vec2 o = uTexel;
        float c = texture2D(uPrev, uv).z * 0.6
          + (texture2D(uPrev, uv + vec2(o.x, 0.0)).z + texture2D(uPrev, uv - vec2(o.x, 0.0)).z
           + texture2D(uPrev, uv + vec2(0.0, o.y)).z + texture2D(uPrev, uv - vec2(0.0, o.y)).z) * 0.1;
        c *= 0.962;                                                  // fades out in well under a second
        vec2 asp = vec2(uAspect, 1.0);
        float d = seg(vUv * asp, uFrom * asp, uTo * asp) / uRadius;
        c = min(c + uOn * exp(-d * d * 2.5) * 0.3, 1.0);
        gl_FragColor = vec4(0.0, 0.0, c, 1.0);
      }`,
  });

  // the look: a nearly clear liquid lump with a soft lavender shadow and one thin, crisp edge line
  const drawM = new THREE.ShaderMaterial({
    vertexShader: VS, depthTest: false, depthWrite: false, transparent: true, blending: THREE.NoBlending,
    uniforms: { uPaint: { value: null }, uTexel: { value: texel }, uDark: { value: [new THREE.Vector4(), new THREE.Vector4()] }, uTime: { value: 0 } },
    fragmentShader: `
      uniform sampler2D uPaint; uniform vec2 uTexel; uniform vec4 uDark[2]; uniform float uTime; varying vec2 vUv;
      float H(vec2 p){ return texture2D(uPaint, p).z; }
      bool inside(vec4 r){ return vUv.x > r.x && vUv.x < r.z && vUv.y > r.y && vUv.y < r.w; }
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        // small, smooth wobble of where we read the shape: wavy, hand-made edges
        vec2 q = vUv * 9.0 + uTime * 0.4;
        vec2 uv = vUv + (vec2(noise(q), noise(q + 31.7)) - 0.5) * uTexel * 3.0;
        float h = H(uv);
        vec2 e = uTexel * 2.0;
        vec2 g = vec2(H(uv + vec2(e.x, 0.0)) - H(uv - vec2(e.x, 0.0)), H(uv + vec2(0.0, e.y)) - H(uv - vec2(0.0, e.y)));
        vec3 n = normalize(vec3(-g * 6.0, 1.0));
        // body: almost invisible, just a breath of white with a whisper of lavender on the shaded flank
        float body = smoothstep(0.05, 0.6, h);
        float shade = clamp(dot(n.xy, vec2(0.5, -0.85)) * 2.0, 0.0, 1.0);
        vec3 col = mix(vec3(1.0), vec3(0.80, 0.81, 0.98), shade);
        float a = body * (0.035 + 0.08 * shade);
        // edges: a thin, mostly white line that flashes small iridescent glints, plus a faint inner line
        float w = fwidth(h) * 1.3 + 1e-4;
        float outer = 1.0 - smoothstep(0.0, w, abs(h - 0.2));
        float inner = 1.0 - smoothstep(0.0, w, abs(h - 0.42));
        float ang = atan(n.y, n.x);
        vec3 iri = 0.5 + 0.5 * cos(6.2831 * (ang * 0.5 + uTime * 0.05 + vec3(0.0, 0.33, 0.67)));
        float glint = smoothstep(0.55, 0.95, noise(vUv * 14.0 + uTime * 0.3));        // glints only here and there
        vec3 lineCol = mix(vec3(1.0), mix(vec3(1.0, 0.80, 0.68), iri, 0.5), glint);
        float edgeOn = smoothstep(0.0, 0.015, length(g));
        float la = clamp(outer * 0.45 + inner * 0.12, 0.0, 1.0) * edgeOn;
        vec3 outCol = col * a + lineCol * la * (1.0 - a);
        float outA = a + la * (1.0 - a);
        if (inside(uDark[0]) || inside(uDark[1])) { outCol *= 0.5; outA *= 0.5; }   // quieter over dark panels
        gl_FragColor = vec4(outCol, outA);
      }`,
  });

  let aspect = 1;
  const fit = () => {
    const w = innerWidth, h = innerHeight; aspect = w / h;
    r.setSize(w, h, false);
    const pw = Math.max(2, Math.round(w / 4)), ph = Math.max(2, Math.round(h / 4));
    A.setSize(pw, ph); B.setSize(pw, ph); texel.set(1 / pw, 1 / ph);
    paintM.uniforms.uAspect.value = aspect;
  };
  fit(); addEventListener("resize", fit);

  const last = new THREE.Vector2(-1, -1), now = new THREE.Vector2();
  let moved = false, quietFor = 99;
  addEventListener("pointermove", (e) => {
    if (panel?.contains(e.target)) { last.set(-1, -1); return; }   // the hero has its own liquid
    now.set(e.clientX / innerWidth, 1 - e.clientY / innerHeight);
    moved = true;
  });

  const pass = (m, target) => { quad.material = m; r.setRenderTarget(target); r.render(scene, cam); };
  const darkPanels = $$(".footer__panel, .reel__panel");
  const step = () => {
    let on = 0;
    if (moved && last.x >= 0) {
      const dx = now.x - last.x, dy = now.y - last.y;
      const px = Math.hypot(dx * innerWidth, dy * innerHeight);              // speed in screen pixels
      if (px > 0.5) {
        on = 1;
        paintM.uniforms.uFrom.value.copy(last); paintM.uniforms.uTo.value.copy(now);
        paintM.uniforms.uVel.value.set(dx * innerWidth * 0.25, dy * innerHeight * 0.25);
        paintM.uniforms.uRadius.value = (28 + Math.min(px / 80, 1) * 44) / innerHeight;   // 28px slow … 72px fast
      }
    }
    if (moved) { last.copy(now); moved = false; }
    paintM.uniforms.uOn.value = on;
    const tNow = performance.now() / 1000; paintM.uniforms.uTime.value = tNow; drawM.uniforms.uTime.value = tNow;
    quietFor = on ? 0 : quietFor + 1;
    if (quietFor > 120) return false;                                          // faded out: rest
    paintM.uniforms.uPrev.value = A.texture; pass(paintM, B); [A, B] = [B, A];
    // tell the shader where the dark panels are, so the tint sits on the right background
    darkPanels.forEach((el, i) => {
      const b = el.getBoundingClientRect();
      drawM.uniforms.uDark.value[i].set(b.left / innerWidth, 1 - b.bottom / innerHeight, b.right / innerWidth, 1 - b.top / innerHeight);
    });
    drawM.uniforms.uPaint.value = A.texture; pass(drawM, null);
    return true;
  };
  let resting = true;
  const loop = () => {
    requestAnimationFrame(loop);
    const active = step();
    if (!active && !resting) { r.setRenderTarget(null); r.clear(); }
    resting = !active;
  };
  loop();
  if (location.search.includes("debug")) window.__trail = { move: (x, y) => { now.set(x, y); if (last.x < 0) last.copy(now); moved = true; step(); } };
})();

/* =========================================================
   3. Header: tagline hide on scroll + dropdown menu
   ========================================================= */
const header = $("#header"), menuBtn = $("#menuBtn"), menu = $("#menu");
const setMenu = (open) => {
  menu.classList.toggle("is-open", open);
  menuBtn.classList.toggle("is-open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
};
menuBtn.addEventListener("click", (e) => { e.stopPropagation(); setMenu(!menu.classList.contains("is-open")); });
$$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("click", (e) => { if (!menu.contains(e.target)) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
// the hero starts right below the tagline, however many lines it wraps to at this screen width
const tagline = $(".header__tagline");
let lastHeroTop = "";
const fitHeroTop = () => {
  const root = document.documentElement.style;
  const v = getComputedStyle(tagline).display === "none" ? "" : Math.max(150, Math.ceil(tagline.offsetTop + tagline.offsetHeight + 28)) + "px";
  if (v === lastHeroTop) return;
  lastHeroTop = v;
  v ? root.setProperty("--hero-top", v) : root.removeProperty("--hero-top");
  requestAnimationFrame(() => window.ScrollTrigger?.refresh());
};
new ResizeObserver(fitHeroTop).observe(tagline);
addEventListener("resize", fitHeroTop);
fitHeroTop();

// switch the logo to white whenever a dark panel is behind it
const darkZones = $$(".hero__panel, .footer__panel");
const logoEl = $(".logo");
const updateLogoTone = () => {
  const r0 = logoEl.getBoundingClientRect(), y = r0.top + r0.height / 2;
  header.classList.toggle("on-dark", darkZones.some((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
};
addEventListener("resize", updateLogoTone);

const onScroll = () => { header.classList.toggle("is-scrolled", scrollY > 60); updateLogoTone(); };
addEventListener("scroll", onScroll, { passive: true }); onScroll();

/* =========================================================
   4. Without GSAP: show everything and stop
   ========================================================= */
if (!gsap || !ScrollTrigger) {
  $("#loader")?.remove(); $("#loaderVeil")?.remove();
  document.body.classList.remove("is-loading");
  $(".reel")?.classList.add("is-arrived");
  hero?.start();
  throw new Error("GSAP failed to load — running without scroll animations.");
}
gsap.registerPlugin(ScrollTrigger);
// scroll animations keep their own smooth timing: they play when you scroll down into them
// and play the very same animation backwards when you scroll back up (time reversal)
const REWIND = "play none none reverse";

/* =========================================================
   5. Smooth scroll
   ========================================================= */
let lenis = null;
if (window.Lenis && !reduceMotion) {
  lenis = new window.Lenis({ lerp: 0.085 });
  window.__lenis = lenis;                              // project.js jumps to a card before zooming back out
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
// make sure every load / refresh / back-navigation begins at the hero banner
const toTop = () => { lenis ? lenis.scrollTo(0, { immediate: true, force: true }) : window.scrollTo(0, 0); window.scrollTo(0, 0); };
toTop();
addEventListener("load", toTop);
addEventListener("pageshow", (e) => { if (e.persisted) toTop(); });
$$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
  const id = a.getAttribute("href");
  if (id === "#") { e.preventDefault(); return; }
  const target = id === "#top" ? 0 : $(id);
  if (target === null) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(target, { duration: 1.6 });
  else if (target === 0) scrollTo({ top: 0, behavior: "smooth" });
  else target.scrollIntoView({ behavior: "smooth" });
}));

// text that decodes from random characters (used by the loader label and the card tags)
const scramble = (el, text, dur = 0.8) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#/_";
  const o = { p: 0 };
  gsap.to(o, {
    p: 1, duration: dur, ease: "none",
    onUpdate: () => {
      const n = Math.floor(o.p * text.length);
      el.textContent = text.slice(0, n) + text.slice(n).replace(/[^ ]/g, () => chars[(Math.random() * chars.length) | 0]).slice(0, Math.max(0, Math.min(6, text.length - n)));
    },
    onComplete: () => (el.textContent = text),
  });
};

/* =========================================================
   9. Work + footer (unchanged behaviour)
   ========================================================= */
$$(".section-title").forEach((el) => gsap.from($$(".line > span", el), {
  yPercent: 110, duration: 1.3, stagger: 0.12, ease: "expo.out",
  scrollTrigger: { trigger: el, start: "top 85%", toggleActions: REWIND },
}));
// Spatial (depth) layer for the Featured Work covers, like the iPhone "spatial scene": each cover has
// a depth map (assets/work/<slug>/depth.jpg, white = near) and, while hovered, one shared WebGL canvas
// sits over the picture and shifts near things more than far things as the mouse moves. It matches the
// CSS picture exactly at rest, so it fades in/out seamlessly; if WebGL or a depth map fails, nothing changes.
const depthLayer = (() => {
  if (!canHover || reduceMotion) return null;        // mouse only, like the rest of the hover effect
  const cvs = document.createElement("canvas"); cvs.className = "project__depth";
  const gl = cvs.getContext("webgl", { premultipliedAlpha: false, antialias: false });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, `attribute vec2 p; varying vec2 v;
    void main(){ v = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, `precision mediump float; varying vec2 v;
    uniform sampler2D uImg, uDep; uniform vec2 uM; uniform float uA, uCard, uPic, uFocus, uAct; uniform vec3 uBg;
    vec2 cover(vec2 q){ vec2 uv = q;            // object-fit: cover + focus
      if (uPic < uCard) { float h = uCard / uPic; uv.y = (q.y + (h - 1.) * uFocus) / h; }
      else { float w = uPic / uCard; uv.x = (q.x + (w - 1.) * .5) / w; }
      return uv; }
    float dep(vec2 uv){ return texture2D(uDep, clamp(uv, 0., 1.)).r; }
    void main(){
      // undo the CSS hover move (translate + scale about the centre)
      vec2 q = (v - .5 - vec2(-uM.x, -uM.y) * .022) / (1. + uA * .07) + .5;
      vec2 uv = cover(q);
      // depth parallax: near (white) parts slide with the mouse, far parts the other way
      vec2 base = uv, k = uM * uA * vec2(.03, .03 * uPic);
      for (int i = 0; i < 4; i++) uv = base - k * (dep(uv) - .5);
      if (uAct < .001) { gl_FragColor = texture2D(uImg, clamp(uv, 0., 1.)); return; }
      // opening a project (Lusion-style): the camera flies into the picture, near parts rushing
      // toward it faster than far ones, it goes soft, and the far parts melt into the project colour first
      vec2 c = cover(vec2(.5)), b = uv; float d = dep(uv);
      for (int i = 0; i < 3; i++) { d = dep(uv); uv = c + (b - c) / (1. + uAct * 2.2 * d); }
      float r = uAct * .018, ang = fract(sin(dot(v, vec2(12.9898, 78.233))) * 43758.5453) * 6.2832;
      vec3 col = vec3(0.);
      for (int i = 0; i < 6; i++) { float rr = sqrt((float(i) + .5) / 6.) * r; ang += 2.39996;
        col += texture2D(uImg, clamp(uv + rr * vec2(cos(ang) / uPic, sin(ang)), 0., 1.)).rgb; }
      col /= 6.;
      float f = clamp((uAct * 2.5 - .75 - d) / .75, 0., 1.);   // our maps: white = near, so far (dark) goes first
      gl_FragColor = vec4(mix(col, uBg, f), 1.);
    }`));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  gl.uniform1i(U("uImg"), 0); gl.uniform1i(U("uDep"), 1);
  const tex = (unit, src) => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]
      .forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v));
    return t;
  };
  // Each card's textures are made ONCE (cover shrunk to card size, off the main thread) and kept, so moving
  // between cards never re-uploads pictures. Only the card under the mouse ("active") owns the canvas.
  const cards = new Map();                           // media -> { ready, texs, pic, focus }
  const KEEP = 4;                                    // keep textures for the last few cards only (GPU memory)
  let active = null;
  const shrink = async (img) => {
    const w = Math.min(img.naturalWidth, 1280), h = Math.round(w * img.naturalHeight / img.naturalWidth);
    try { return await createImageBitmap(img, { resizeWidth: w, resizeHeight: h, resizeQuality: "high" }); }
    catch { const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h); return c; }
  };
  const load = async (media) => {
    active = media;
    if (cards.has(media)) { const e = cards.get(media); cards.delete(media); cards.set(media, e); return; }   // mark as recent
    const img = media.querySelector("img"); if (!img) return;
    const e = { ready: false }; cards.set(media, e);
    try {
      const d = new Image(); d.src = img.getAttribute("src").replace(/cover\.jpg$/, "depth.jpg");
      await Promise.all([d.decode(), img.decode()]);
      const pic = await shrink(img);
      e.texs = [tex(0, pic), tex(1, d)]; pic.close?.();
      e.pic = img.naturalWidth / img.naturalHeight;
      e.focus = (parseFloat(getComputedStyle(img).objectPosition.split(" ")[1]) || 50) / 100;
      e.ready = true;
    } catch { e.fail = true; return; }
    while (cards.size > KEEP) {                       // forget the oldest card's textures
      const [m, old] = cards.entries().next().value;
      if (m === active) break;
      old.texs?.forEach((t) => gl.deleteTexture(t)); cards.delete(m);
    }
  };
  const draw = (media, s) => {
    const e = cards.get(media);
    if (e) e.last = s;
    render(media);
  };
  const render = (media) => {
    const e = cards.get(media), s = e?.last || { x: 0, y: 0, a: 0 }, act = e?.act || 0;
    if (media !== active || (s.a < 0.002 && act < 0.001)) { if (cvs.parentNode === media) cvs.remove(); return; }
    if (!e || !e.ready) return;
    const img = media.querySelector("img");
    if (cvs.parentNode !== media) media.insertBefore(cvs, img.nextSibling);
    const w = media.clientWidth, h = media.clientHeight, r = Math.min(devicePixelRatio || 1, 2);
    if (cvs.width !== Math.round(w * r) || cvs.height !== Math.round(h * r)) { cvs.width = Math.round(w * r); cvs.height = Math.round(h * r); }
    gl.viewport(0, 0, cvs.width, cvs.height);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, e.texs[0]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, e.texs[1]);
    gl.uniform2f(U("uM"), s.x, s.y); gl.uniform1f(U("uA"), s.a);
    gl.uniform1f(U("uCard"), w / h); gl.uniform1f(U("uPic"), e.pic); gl.uniform1f(U("uFocus"), e.focus);
    gl.uniform1f(U("uAct"), act); gl.uniform3fv(U("uBg"), e.bg || [0, 0, 0]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  // project opening/closing drives this: 0 = normal card, 1 = fully flown in and turned into `hex`
  const act = (media, value, hex) => {
    const e = cards.get(media); if (!e) return;
    e.act = value;
    if (hex) { const n = parseInt(hex.replace("#", ""), 16); e.bg = [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
    render(media);
  };
  const ready = (media) => !!cards.get(media)?.ready;
  return { load, draw, act, ready };
})();
window.PV_DEPTH = depthLayer;                          // project.js uses it for the open/close transition

// Featured Work cards: a colour plate shows first, the card swings in tilted from below and settles
// over it, the tags decode from random characters and the title rises. Scrolling back up reverses it.
$$(".project").forEach((card, i) => {
  const media = card.querySelector(".project__media");
  const tags = card.querySelector(".project__tags");
  const title = card.querySelector(".project__title");
  const tagText = tags.textContent;
  const side = i % 2 ? 1 : -1;                                  // the two columns tilt opposite ways

  const frame = document.createElement("div"); frame.className = "project__frame";
  const plate = document.createElement("span"); plate.className = "project__plate";
  plate.style.background = getComputedStyle(media).getPropertyValue("--c1");
  media.before(frame); frame.append(plate, media);

  const tl = gsap.timeline({ paused: true, delay: (i % 2) * 0.12 })
    .fromTo(frame, { y: 110, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out" }, 0)
    .fromTo(media, { y: 34, rotation: 3 * side, skewY: -1.5 * side, transformOrigin: side < 0 ? "100% 0%" : "0% 0%" },
      { y: 0, rotation: 0, skewY: 0, duration: 1.4, ease: "expo.out" }, 0.05)
    .fromTo(plate, { scaleY: 1 }, { scaleY: 0, transformOrigin: "50% 0%", duration: 0.9, ease: "expo.inOut" }, 0.2);

  ScrollTrigger.create({
    trigger: card, start: "top 92%",
    onEnter: () => tl.play(),
    onLeaveBack: () => tl.reverse(),
  });

  // the tags decode and the title rises EVERY time this text comes into view — scrolling down or up
  const textTl = gsap.timeline({ paused: true })
    .fromTo(tags, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0)
    .fromTo(title, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, ease: "expo.out" }, 0.15);
  const playText = () => { textTl.restart(true); scramble(tags, tagText, 0.9); };
  ScrollTrigger.create({
    trigger: tags, start: "top 95%", end: "bottom 5%",
    onEnter: playText,                    // coming in from below (scrolling down)
    onEnterBack: playText,                // coming in from above (scrolling up)
    onLeave: () => textTl.pause(0),       // gone past the top: reset so it replays on the way back
    onLeaveBack: () => textTl.reverse(),  // gone below: rewinds smoothly, like the footer
  });

  // hover: the picture briefly drops out of focus and snaps back sharp, like a lens refocusing
  media.addEventListener("pointerenter", () => {
    gsap.fromTo(media, { filter: "blur(0px)" }, { filter: "blur(9px)", duration: 0.2, ease: "power2.in", yoyo: true, repeat: 1, overwrite: "auto" });
  });

  // spatial scene: the card leans toward the mouse and the picture floats behind it like a window
  // into depth, with a soft light that follows the pointer. Mouse only; eased so nothing snaps.
  if (canHover && !reduceMotion) {
    const glare = document.createElement("span"); glare.className = "project__glare";
    media.append(glare);
    const cur = { x: 0, y: 0, a: 0 }, to = { x: 0, y: 0, a: 0 };
    let raf = 0;
    const tick = () => {
      cur.x += (to.x - cur.x) * 0.1; cur.y += (to.y - cur.y) * 0.1; cur.a += (to.a - cur.a) * 0.1;
      media.style.setProperty("--sx", cur.x.toFixed(4));
      media.style.setProperty("--sy", cur.y.toFixed(4));
      media.style.setProperty("--sa", cur.a.toFixed(4));
      // the card frame itself stays still; only the picture inside moves (depth + drift)
      depthLayer?.draw(media, cur);                    // the depth (spatial scene) picture on top
      const still = Math.abs(to.x - cur.x) + Math.abs(to.y - cur.y) + Math.abs(to.a - cur.a) < 0.001;
      raf = still ? 0 : requestAnimationFrame(tick);
    };
    const go = () => { if (!raf) raf = requestAnimationFrame(tick); };
    media.addEventListener("pointerenter", () => depthLayer?.load(media));
    media.addEventListener("pointermove", (e) => {
      const r = media.getBoundingClientRect();
      to.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      to.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      to.a = 1; go();
    });
    media.addEventListener("pointerleave", () => { to.x = 0; to.y = 0; to.a = 0; go(); });
  }
});
gsap.from(".work__desc", { opacity: 0, y: 20, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".work__head", start: "top 85%", toggleActions: REWIND } });
const word = $(".footer__word");
word.innerHTML = word.textContent.split("").map((c) => `<span style="display:inline-block">${c}</span>`).join("");
gsap.from($$(".footer__title .line > span"), {
  yPercent: 110, duration: 1.3, stagger: 0.12, ease: "expo.out",
  scrollTrigger: { trigger: ".footer__title", start: "top 85%", toggleActions: REWIND },
});
gsap.from(word.children, {
  yPercent: 100, opacity: 0, duration: 1.2, stagger: 0.05, ease: "expo.out",
  scrollTrigger: { trigger: word, start: "top 95%", toggleActions: REWIND },
});

if (canHover) $$(".magnetic, .reel__play").forEach((el) => {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.5, ease: "power3.out" });
  });
  el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" }));
});

/* =========================================================
   Page transition, built the way Lusion's works: a black layer with a window cut in the shape of
   the P mark. Leaving a page, the window (huge, so you still see the page) shrinks and turns until
   it is a small white P on black; the next page loads behind it; arriving, that P grows and turns
   the other way, becomes a window again and opens onto the new page. Links with data-pt use it.
   The home loader is skipped when you arrive this way.
   ========================================================= */
const ptArrived = document.documentElement.classList.contains("pt-in");
window.__ptArrived = ptArrived;
const pageTransition = (() => {
  const cv = document.createElement("canvas"); cv.className = "pt"; cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  // the P (same shape as the favicon/logo), centred, in units: 2.6 wide × 3.2 tall
  const P = [[11, 5.3], [89, 5.3], [89, 60], [41, 60], [41, 94.7], [11, 94.7]].map(([x, y]) => [(x - 50) / 30, (y - 50) / 30]);
  let W = 0, H = 0, dpr = 1, unit = 0, c = 0;
  const setup = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    unit = Math.min(14, W / 90);                               // size of the small P at rest
    c = (Math.hypot(W, H) / unit) * 1.3;                       // how much it grows to cover the screen
  };
  const expoInOut = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2);
  // open: 0 = small white P on black, 1 = the P is a window bigger than the screen. dir = turning direction
  const draw = (open, dir) => {
    const f = expoInOut(open), p = (1 + f * c) * unit;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    if (f >= 0.999) return;
    ctx.fillStyle = "#0b0b10"; ctx.fillRect(0, 0, W, H);
    ctx.translate(W / 2, H / 2);
    ctx.rotate(f * 0.9 * dir);
    ctx.translate(0.8 * f * p, 0.6 * f * p);                   // keeps the screen inside the P's thick part as it grows
    ctx.scale(p, p);
    ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    ctx.globalCompositeOperation = "destination-out"; ctx.fill();          // cut the window
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1 - f; ctx.fillStyle = "#fff"; ctx.fill();   // white P while small
  };
  const s = { open: 1 };
  const go = (href) => {
    setup(); cv.style.display = "block"; s.open = 1; draw(1, -1);
    gsap.to(s, { open: 0, duration: reduceMotion ? 0.01 : 1, ease: "none", onUpdate: () => draw(s.open, -1), onComplete: () => {
      try { sessionStorage.setItem("pt", "1"); } catch (e) { /* storage off: no reveal, still navigates */ }
      location.href = href;
    } });
  };
  const reveal = (delay = 0) => {
    setup(); s.open = 0; draw(0, 1); cv.style.display = "block";
    document.documentElement.classList.remove("pt-in");
    gsap.to(s, { open: 1, duration: reduceMotion ? 0.01 : 1.1, delay, ease: "none", onUpdate: () => draw(s.open, 1), onComplete: () => (cv.style.display = "none") });
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-pt]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    if (url.pathname === location.pathname && !url.search) { lenis ? lenis.scrollTo(0, { duration: 1.2 }) : scrollTo(0, 0); return; }
    go(url.href);
  });
  // Back/Forward restoring the page instantly from the browser's memory: grow the P open again
  addEventListener("pageshow", (e) => { if (e.persisted) { gsap.killTweensOf(s); reveal(0); } });
  return { reveal };
})();
// arriving through the transition: clear the pixels once this page is ready (home waits for its loader)
if (ptArrived) queueMicrotask(() => (window.__pageReady || Promise.resolve()).then(() => pageTransition.reveal(0.05)));

// Projects page title: letters rise and settle from a tilt, the count rolls up, the arrow pops (like Lusion)
const pallTitle = $(".pall__title");
if (pallTitle) {
  const word = $(".pall__word", pallTitle), count = $(".pall__count", pallTitle), arrow = $(".pall__arrow", pallTitle);
  const split = (el) => { el.innerHTML = [...el.textContent].map((c) => `<span class="pall__c"><span>${c}</span></span>`).join(""); return $$(".pall__c > span", el); };
  const wc = split(word), cc = split(count);
  gsap.set(wc, { yPercent: 100, rotation: 30, transformOrigin: "0% 100%" }); gsap.set(cc, { yPercent: 100 }); gsap.set(arrow, { scale: 0 });
  const play = () => gsap.timeline({ delay: ptArrived ? 0.45 : 0.15 })
    .to(wc, { yPercent: 0, rotation: 0, duration: 0.9, stagger: 0.035, ease: "expo.out" }, 0)
    .to(cc, { yPercent: 0, duration: 0.9, stagger: 0.05, ease: "expo.out" }, 0.35)
    .to(arrow, { scale: 1, duration: 1.1, ease: "elastic.out(1, 0.45)" }, 0.45);
  play();
}


/* =========================================================
   HOME ONLY — showreel scenes, loader, intro, card → reel, reel player
   ========================================================= */
if (IS_HOME) {
  /* =========================================================
     0. Showreel scenes — drawn once on canvas, reused as:
        intro card slides (blue duotone), flying card texture,
        and the full-colour reel slides
     ========================================================= */
  const SCENE_W = 1600, SCENE_H = 1000;

  function makeScene(i) {
    const c = document.createElement("canvas");
    c.width = SCENE_W; c.height = SCENE_H;
    const x = c.getContext("2d");
    const rr = (X, Y, W, H, R, fill) => { x.beginPath(); x.roundRect(X, Y, W, H, R); x.fillStyle = fill; x.fill(); };
    const shadow = (on, blur = 60) => {
      x.shadowColor = on ? "rgba(0,0,0,.35)" : "transparent";
      x.shadowBlur = on ? blur : 0; x.shadowOffsetY = on ? blur / 2 : 0;
    };
    const bg = (a, b) => { const g = x.createLinearGradient(0, 0, SCENE_W, SCENE_H); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, SCENE_W, SCENE_H); };
    const glow = (cx, cy, r, col) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, SCENE_W, SCENE_H); };
    const phone = (X, Y, W, rot, accent, soft) => {
      x.save(); x.translate(X, Y); x.rotate(rot);
      const H = W * 2.05;
      shadow(true); rr(-W / 2, -H / 2, W, H, W * 0.16, "#fff"); shadow(false);
      const p = W * 0.07, iw = W - p * 2;
      rr(-W / 2 + p, -H / 2 + p, iw, H * 0.36, W * 0.1, accent);
      for (let k = 0; k < 3; k++) rr(-W / 2 + p, -H / 2 + p + H * 0.4 + k * H * 0.11, iw, H * 0.08, W * 0.05, soft);
      rr(-W / 2 + p, H / 2 - p - H * 0.16, iw, H * 0.16, W * 0.08, accent);
      x.restore();
    };

    switch (i % 5) {
      case 0: // mobile banking screens
        bg("#0016ec", "#7d8bff"); glow(1200, 150, 700, "rgba(255,255,255,.35)");
        phone(470, 520, 270, -0.14, "#0016ec", "#e5e8ff");
        phone(800, 500, 300, 0, "#ff6a8b", "#ffe3ea");
        phone(1130, 520, 270, 0.14, "#18b47b", "#dff7ec");
        break;
      case 1: { // web app window with chart
        bg("#ff7a59", "#ffd3a8"); glow(300, 900, 700, "rgba(255,255,255,.4)");
        shadow(true, 80); rr(250, 170, 1100, 680, 28, "#fff"); shadow(false);
        rr(250, 170, 1100, 56, [28, 28, 0, 0], "#f4f1ee");
        ["#ff5f57", "#febc2e", "#28c840"].forEach((col, k) => { x.beginPath(); x.arc(290 + k * 30, 198, 9, 0, 7); x.fillStyle = col; x.fill(); });
        rr(280, 250, 220, 570, 18, "#fff4ee");
        for (let k = 0; k < 6; k++) rr(305, 280 + k * 60, 170, 28, 8, k === 1 ? "#ff7a59" : "#ffe2d6");
        rr(530, 250, 790, 360, 18, "#fff4ee");
        const hs = [.45, .7, .55, .9, .62, .8, .5, .95];
        hs.forEach((h, k) => rr(570 + k * 92, 580 - h * 290, 56, h * 290, 10, k === 6 ? "#ff7a59" : "#ffc2ac"));
        for (let k = 0; k < 3; k++) rr(530 + k * 270, 640, 250, 180, 18, k === 0 ? "#ff7a59" : "#ffe2d6");
        break;
      }
      case 2: { // dark analytics dashboard
        bg("#0d0f22", "#2c2f63"); glow(1250, 250, 600, "rgba(123,92,255,.55)"); glow(300, 850, 600, "rgba(0,212,255,.35)");
        const card = (X, Y, W, H) => { rr(X, Y, W, H, 22, "rgba(255,255,255,.08)"); x.strokeStyle = "rgba(255,255,255,.18)"; x.lineWidth = 2; x.stroke(); };
        card(180, 160, 380, 220); card(610, 160, 380, 220); card(1040, 160, 380, 220); card(180, 430, 1240, 420);
        ["#7b5cff", "#00d4ff", "#ff6aa2"].forEach((col, k) => { rr(220 + k * 430, 210, 140, 22, 8, "rgba(255,255,255,.5)"); rr(220 + k * 430, 260, 220, 60, 12, col); });
        x.beginPath(); x.moveTo(230, 760);
        [[400, 640], [560, 700], [720, 560], [880, 610], [1040, 500], [1200, 540], [1370, 470]].forEach(([a, b]) => x.lineTo(a, b));
        x.strokeStyle = "#00d4ff"; x.lineWidth = 10; x.lineJoin = "round"; x.stroke();
        x.lineTo(1370, 820); x.lineTo(230, 820); x.closePath();
        const g = x.createLinearGradient(0, 470, 0, 820); g.addColorStop(0, "rgba(0,212,255,.35)"); g.addColorStop(1, "rgba(0,212,255,0)"); x.fillStyle = g; x.fill();
        break;
      }
      case 3: { // design tool canvas
        bg("#18b47b", "#c6f3dd"); glow(800, 500, 800, "rgba(255,255,255,.35)");
        shadow(true, 80); rr(160, 140, 1280, 720, 26, "#f7f8fa"); shadow(false);
        rr(160, 140, 260, 720, [26, 0, 0, 26], "#fff");
        for (let k = 0; k < 9; k++) rr(190, 190 + k * 66, k % 3 === 0 ? 200 : 170, 30, 8, k === 2 ? "#18b47b" : "#e7ecef");
        rr(1180, 140, 260, 720, [0, 26, 26, 0], "#fff");
        for (let k = 0; k < 7; k++) rr(1210, 190 + k * 80, 200, 44, 10, "#eef2f4");
        shadow(true, 40); rr(560, 230, 230, 470, 30, "#fff"); rr(830, 300, 230, 470, 30, "#fff"); shadow(false);
        rr(580, 250, 190, 170, 20, "#18b47b"); rr(850, 320, 190, 170, 20, "#7b5cff");
        for (let k = 0; k < 3; k++) { rr(580, 440 + k * 60, 190, 36, 10, "#e3f5ec"); rr(850, 510 + k * 60, 190, 36, 10, "#ece8ff"); }
        x.strokeStyle = "#0016ec"; x.lineWidth = 4; x.setLineDash([14, 10]); x.strokeRect(820, 290, 250, 490); x.setLineDash([]);
        break;
      }
      default: { // app icon wall
        bg("#ff4d6d", "#ffb3c1"); glow(800, 500, 700, "rgba(255,255,255,.35)");
        x.save(); x.translate(800, 500); x.rotate(-0.22);
        const cols = ["#0016ec", "#fff", "#111", "#7b5cff", "#ffd166", "#18b47b"];
        for (let r = -3; r <= 3; r++) for (let q = -5; q <= 5; q++) {
          const col = cols[Math.abs(r * 7 + q * 3) % cols.length];
          shadow(true, 30); rr(q * 170 - 70, r * 170 - 70, 140, 140, 36, col); shadow(false);
          x.beginPath(); x.arc(q * 170, r * 170, 26, 0, 7); x.fillStyle = col === "#fff" ? "#ff4d6d" : "rgba(255,255,255,.85)"; x.fill();
        }
        x.restore();
      }
    }
    return c;
  }

  const scenes = Array.from({ length: 5 }, (_, i) => makeScene(i));
  const sceneURLs = scenes.map((c) => c.toDataURL("image/jpeg", 0.86));

  const introCard = $("#introCard");
  const reelMedia = $("#reelMedia");
  const fillSlides = (box) => sceneURLs.forEach((url, i) => {
    const img = new Image(); img.src = url; img.alt = ""; img.className = "slide" + (i === 0 ? " is-active" : "");
    box.appendChild(img);
  });
  fillSlides(introCard);
  fillSlides(reelMedia);

  let cardIndex = 0, reelIndex = 0, cardFrozen = false;
  const show = (box, i) => $$(".slide", box).forEach((s, k) => s.classList.toggle("is-active", k === i));
  setInterval(() => { if (!cardFrozen) show(introCard, (cardIndex = (cardIndex + 1) % scenes.length)); }, 900);

  let reelHover = false, reelTimer = 0;
  const reelTick = () => {
    show(reelMedia, (reelIndex = (reelIndex + 1) % scenes.length));
    reelTimer = setTimeout(reelTick, reelHover ? 650 : 2200);
  };
  reelTimer = setTimeout(reelTick, 2200);

  // ticker text for the reel edges
  $$(".ticker__track").forEach((t) => { t.innerHTML = Array(16).fill("<span><b>▶▶▶</b>PLAY REEL</span>").join(""); });

  /* =========================================================
     6. Loader: odometer counter + bar → logo mark → tilted
        window opens onto the site
     ========================================================= */
  const loader = $("#loader");
  const countEl = $("#loaderCount");
  // odometer like Lusion's: each digit holds just two numbers (this one and the next) and slides between
  // them by the exact fraction, so it rolls through every number continuously. Each digit's value chases
  // the count with exponential smoothing (1 - e^(-7·dt)), so it never stops and restarts.
  countEl.innerHTML = [0, 1, 2].map(() => `<span class="odo"><span class="odo__track"><span>0</span><span>1</span></span></span>`).join("");
  const odo = $$(".odo__track", countEl).map((el) => ({ el, a: el.children[0], b: el.children[1], v: 0, f: 0 }));
  const count = { v: 0 };
  const odoTick = (time, dms) => {
    if (!countEl.isConnected) { gsap.ticker.remove(odoTick); return; }
    const k = 1 - Math.exp(-7 * Math.min(dms, 100) / 1000);
    odo.forEach((d, i) => {
      const c = Math.floor(count.v / 10 ** (2 - i) + 1e-6);
      d.v += (c - d.v) * k; if (Math.abs(c - d.v) < 0.01) d.v = c;
      const u = d.v % 10, f = Math.floor(u), g = u - f;
      if (f !== d.f) { d.f = f; d.a.textContent = f; d.b.textContent = (f + 1) % 10; }
      d.el.style.transform = `translateY(${(-g * 50).toFixed(3)}%)`;
    });
  };
  gsap.ticker.add(odoTick);


  // ---- geometry of the loader bar and the "P" mark (all in screen px) ----
  const lg = () => {
    const W = innerWidth, H = innerHeight, s = Math.max(20, Math.min(40, W * 0.02));
    return { W, H, s, cx: W / 2, cy: H / 2 };
  };
  const pieceA = $("#pieceA"), pieceB = $("#pieceB"), lbTrack = $("#lbTrack");
  const setBar = (p) => {                       // progress bar = two white pieces over a dark track
    const { s, cx, cy } = lg(), fill = p * 5 * s;
    gsap.set(lbTrack, { x: cx - 2.5 * s, y: cy - 0.5 * s, width: 5 * s, height: s });
    gsap.set(pieceA, { x: cx - 2.5 * s, y: cy - 0.5 * s, width: Math.min(fill, 3 * s), height: s });
    gsap.set(pieceB, { x: cx + 0.5 * s, y: cy - 0.5 * s, width: Math.max(0, fill - 3 * s), height: s });
  };
  // outline of the "P" mark: stem on the left, square bowl on the top right
  const markPts = () => {
    const { s, cx, cy } = lg();
    return [[cx - 1.3 * s, cy - 1.5 * s], [cx + 1.3 * s, cy - 1.5 * s], [cx + 1.3 * s, cy + 0.1 * s],
            [cx - 0.3 * s, cy + 0.1 * s], [cx - 0.3 * s, cy + 1.5 * s], [cx - 1.3 * s, cy + 1.5 * s]];
  };
  // the mark becomes a window: its outline grows, shears and settles into the full viewport
  const win = { t: 0 };
  const drawWindow = () => {
    const { W, H, cx, cy } = lg(), t = win.t, m = markPts();
    const F = [[-4, -4], [W + 4, -4], [W + 4, H + 4], [W + 4, H + 4], [W + 4, H + 4], [-4, H + 4]];
    const shear = 0.6 * Math.sin(Math.PI * t), rot = (-7 * Math.PI / 180) * Math.sin(Math.PI * t);
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const pts = m.map(([mx, my], i) => {
      let x = mx + (F[i][0] - mx) * t, y = my + (F[i][1] - my) * t;
      x += (cy - y) * shear;
      const dx = x - cx, dy = y - cy;
      return `${(cx + dx * cs - dy * sn).toFixed(1)} ${(cy + dx * sn + dy * cs).toFixed(1)}`;
    });
    loader.style.clipPath = `path(evenodd, "M0 0H${W}V${H}H0Z M${pts.join(" L")} Z")`;
  };

  lenis?.stop();
  gsap.set(".header .logo, .header__actions > *", { opacity: 0, y: -12 });
  gsap.set(".header__tagline .line > span", { yPercent: 110 });
  gsap.set(".markers--hero .mk", { rotate: 45, opacity: 0 });
  gsap.set("#scrollLabel", { opacity: 0 });
  gsap.set(".hero__panel", { scale: 1.12 });

  const prog = { p: 0 };
  setBar(0);
  const steps = [0, 3, 18, 44, 61, 83, 92, 100];
  const tl = gsap.timeline();
  steps.forEach((v, i) => {
    const at = i === 0 ? 0 : `>${reduceMotion ? 0.02 : 0.05}`;
    tl.to(prog, { p: v / 100, duration: reduceMotion ? 0.02 : 0.3, ease: "power2.out", onUpdate: () => { setBar(prog.p); count.v = prog.p * 100; } }, at);
  });
  tl.add(() => {}, "+=0.55")
    // the bar breaks in two: the left part swings up into the stem, the right part folds into the bowl
    .to(lbTrack, { opacity: 0, duration: 0.3 })
    .to(pieceA, { x: () => lg().cx - 2.3 * lg().s, y: () => lg().cy - 0.5 * lg().s, rotation: 90, duration: 0.8, ease: "expo.inOut" }, "<")
    .to(pieceB, { x: () => lg().cx - 0.3 * lg().s, y: () => lg().cy - 1.5 * lg().s, width: () => 1.6 * lg().s, height: () => 1.6 * lg().s, duration: 0.8, ease: "expo.inOut" }, "<0.08")
    .add(() => {}, "+=0.25")
    // swap the white pieces for a window of the same shape, then open it
    .add(() => { drawWindow(); gsap.set([pieceA, pieceB], { visibility: "hidden" }); hero?.start(); })
    .to(win, { t: 1, duration: 1.45, ease: "expo.inOut", onUpdate: drawWindow })
    .to("#loaderVeil", { opacity: 0, duration: 1.0, ease: "power2.inOut" }, "<0.35")
    .to(".hero__panel", { scale: 1, duration: 1.8, ease: "expo.out" }, "<0.1")
    .add(() => { loader.remove(); $("#loaderVeil").remove(); document.body.classList.remove("is-loading"); lenis?.start(); }, "-=0.6")
    .to(".header .logo", { opacity: 1, y: 0, duration: 0.8, ease: "expo.out" }, "-=1.1")
    .to(".header__tagline .line > span", { yPercent: 0, duration: 1, stagger: 0.09, ease: "expo.out" }, "-=0.9")
    .to(".header__actions > *", { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "expo.out" }, "-=0.9")
    .to(".markers--hero .mk", { rotate: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: "back.out(2)" }, "-=0.8")
    .add(() => { gsap.set("#scrollLabel", { opacity: 1 }); scramble($("#scrollLabel"), "SCROLL TO EXPLORE"); }, "-=0.6");
  if (location.search.includes("debug")) window.__loaderTL = tl;
  // coming back from another page of the site: the pixels cover the screen, so run the loader in a blink
  if (ptArrived) tl.timeScale(30);
  // ?to=about (from the other page's menu): once the page is ready, land on that section
  const loaded = document.readyState === "complete" ? Promise.resolve() : new Promise((r) => addEventListener("load", r, { once: true }));
  window.__pageReady = Promise.all([loaded, new Promise((r) => tl.eventCallback("onComplete", r))]).then(() => {
    const to = new URLSearchParams(location.search).get("to"), el = to && document.getElementById(to);
    if (el) { lenis ? lenis.scrollTo(el, { immediate: true, force: true }) : el.scrollIntoView(); history.replaceState(null, "", location.pathname); }
  });

  /* =========================================================
     7. Intro: heading, words, blue tube wrapping the card
     ========================================================= */
  gsap.from($$(".intro__title .line > span"), {
    yPercent: 110, duration: 1.3, stagger: 0.12, ease: "expo.out",
    scrollTrigger: { trigger: ".intro__title", start: "top 85%", toggleActions: REWIND },
  });
  $$(".fade-words").forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    gsap.to($$(".w", el), {
      opacity: 1, stagger: 0.08, ease: "none",
      scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 55%", scrub: true },
    });
  });
  gsap.from(introCard, {
    y: 80, opacity: 0, duration: 1.3, ease: "expo.out",
    scrollTrigger: { trigger: introCard, start: "top 92%", toggleActions: REWIND },
  });

  const intro = $(".intro"), tube = $("#tube"), tubePaths = $$("path", tube);
  let tubeLen = 1, tubeProgress = 0;
  const buildTube = () => {
    const s = intro.getBoundingClientRect();
    const W = intro.clientWidth, H = intro.clientHeight + 140;
    const t = $(".intro__title").getBoundingClientRect();
    const c = introCard.getBoundingClientRect();
    const R = (r) => ({ l: r.left - s.left, t: r.top - s.top, r: r.right - s.left, b: r.bottom - s.top, w: r.width, h: r.height });
    const T = R(t), C = R(c);
    const mobile = W < 900;
    const d = mobile
      ? `M ${W + 40} ${T.t - 20} C ${W * 0.7} ${T.b}, ${W * 0.95} ${C.t}, ${W * 0.6} ${C.t + C.h * 0.45}
         C ${W * 0.35} ${C.t + C.h * 0.8}, ${C.l + 20} ${C.t + C.h * 0.75}, ${-40} ${C.t + C.h * 0.5}`
      : `M ${-60} ${T.t + T.h * 0.1}
         C ${W * 0.1} ${T.t - 80}, ${W * 0.22} ${T.t + T.h * 0.55}, ${W * 0.16} ${T.b + 20}
         S ${C.l - 60} ${C.t - 10}, ${C.l - 34} ${C.t + C.h * 0.45}
         S ${C.l + C.w * 0.25} ${C.b + 46}, ${C.l + C.w * 0.62} ${C.b + 34}
         S ${C.r + 70} ${C.t + C.h * 0.35}, ${C.l + C.w * 0.55} ${C.t - 34}
         S ${C.r + W * 0.16} ${C.t + 10}, ${W * 0.7} ${C.b - 10}
         S ${W * 0.93} ${C.b + 40}, ${W * 0.96} ${H}`;
    tube.setAttribute("viewBox", `0 0 ${W} ${H}`);
    tubePaths.forEach((p) => p.setAttribute("d", d.replace(/\s+/g, " ")));
    tubeLen = tubePaths[1].getTotalLength();
    tubePaths.forEach((p) => (p.style.strokeDasharray = `${tubeLen} ${tubeLen}`));
    colourTube(d.replace(/\s+/g, " "), W, H);
    drawTube();
  };
  // the colour runs along the tube: many short segments, each a step further along the gradient
  const TUBE_STOPS = [[0, [0, 22, 236]], [0.4, [79, 107, 255]], [0.7, [139, 163, 255]], [1, [45, 71, 255]]];   // #0016ec → #4f6bff → #8ba3ff → #2d47ff
  const tubeColour = (t) => {
    let i = 0; while (i < TUBE_STOPS.length - 2 && t > TUBE_STOPS[i + 1][0]) i++;
    const [t0, a] = TUBE_STOPS[i], [t1, b] = TUBE_STOPS[i + 1], k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
    return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(",")})`;
  };
  const tubeSegs = $(".tube__segs", tube);
  const colourTube = (d, W, H) => {
    if (!tubeSegs) return;
    const mask = $("#tubeMask", tube);
    Object.entries({ x: -200, y: -200, width: W + 400, height: H + 400 }).forEach(([k, v]) => mask.setAttribute(k, v));
    const N = 160, seg = tubeLen / N, ns = "http://www.w3.org/2000/svg";
    tubeSegs.textContent = "";
    for (let i = 0; i < N; i++) {
      const p = document.createElementNS(ns, "path");
      p.setAttribute("d", d);
      p.style.stroke = tubeColour((i + 0.5) / N);
      p.style.strokeDasharray = `${seg} ${tubeLen * 2}`;           // round ends overlap the neighbours, so no seams show
      p.style.strokeDashoffset = -i * seg;
      tubeSegs.appendChild(p);
    }
  };
  const drawTube = () => tubePaths.forEach((p) => (p.style.strokeDashoffset = tubeLen * (1 - tubeProgress)));
  ScrollTrigger.create({
    trigger: intro, start: "top 80%", end: "bottom 40%", scrub: 0.8,
    onUpdate: (self) => { tubeProgress = self.progress; drawTube(); },
  });
  buildTube();
  ScrollTrigger.addEventListener("refresh", buildTube);

  /* =========================================================
     8. Card → reel: the blue card lifts off, bends like a
        sheet, loses its duotone and lands as the showreel
     ========================================================= */
  const reel = $("#reel"), reelPanel = $("#reelPanel");
  const flyer = createFlyer();

  function createFlyer() {
    const cv = $("#flyer");
    let r;
    try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return null; }
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, 1, 1, 10000);
    const textures = scenes.map((c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; });
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { uTex: { value: textures[0] }, uDuo: { value: 1 }, uBend: { value: 0 }, uSize: { value: new THREE.Vector2(1, 1) }, uRadius: { value: 18 } },
      vertexShader: `
        uniform float uBend; uniform vec2 uSize; varying vec2 vUv;
        void main(){
          vUv = uv; vec3 p = position;
          float b = uBend;
          p.z += b * (sin(uv.y * 3.1416) * 0.18 + pow(1.0 - uv.x, 2.0) * 0.5);
          float on = clamp(b / max(uSize.x * 0.32, 1.0), 0.0, 1.0);
          p.y += pow(uv.x, 2.0) * 0.14 * on;
          p.x += sin(uv.y * 3.1416) * 0.05 * on;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D uTex; uniform float uDuo, uRadius; uniform vec2 uSize; varying vec2 vUv;
        void main(){
          vec2 px = vUv * uSize, h = uSize * 0.5;
          vec2 q = abs(px - h) - (h - uRadius);
          if (length(max(q, 0.0)) > uRadius) discard;
          vec3 c = texture2D(uTex, vUv).rgb;
          float l = dot(c, vec3(0.299, 0.587, 0.114));
          vec3 duo = mix(vec3(0.0, 0.008, 0.836), vec3(0.67, 0.71, 1.0), l);
          gl_FragColor = vec4(mix(c, duo, uDuo), 1.0);
          #include <colorspace_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 40, 40), mat);
    scene.add(mesh);

    const size = () => {
      r.setSize(innerWidth, innerHeight, false);
      cam.aspect = innerWidth / innerHeight;
      cam.position.z = innerHeight / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      cam.updateProjectionMatrix();
    };
    size(); addEventListener("resize", size);

    const lerp = (a, b, t) => a + (b - a) * t;
    return {
      setTexture(i) { mat.uniforms.uTex.value = textures[i]; },
      render(p) {
        const a = introCard.getBoundingClientRect(), b = reelPanel.getBoundingClientRect();
        const t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const w = lerp(a.width, b.width, t), h = lerp(a.height, b.height, t);
        const x = lerp(a.left + a.width / 2, b.left + b.width / 2, t);
        const y = lerp(a.top + a.height / 2, b.top + b.height / 2, t);
        const bend = Math.sin(t * Math.PI);
        mesh.scale.set(w, h, 1);
        mesh.position.set(x - innerWidth / 2, innerHeight / 2 - y, 0);
        mesh.rotation.set(-0.18 * bend, 0.32 * bend, -0.07 * bend);
        mat.uniforms.uBend.value = bend * w * 0.32;
        mat.uniforms.uSize.value.set(w, h);
        mat.uniforms.uDuo.value = 1 - THREE.MathUtils.smoothstep(p, 0.3, 0.85);
        r.render(scene, cam);
      },
    };
  }

  const flyerCanvas = $("#flyer");
  let flying = false;
  const setFlight = (p) => {
    if (!flyer) { reel.classList.toggle("is-arrived", p > 0.5); return; }
    const inFlight = p > 0.001 && p < 0.999;
    if (inFlight && !flying) { cardFrozen = true; flyer.setTexture(cardIndex); show(reelMedia, (reelIndex = cardIndex)); }
    if (!inFlight && p <= 0.001) cardFrozen = false;
    flying = inFlight;
    flyerCanvas.classList.toggle("is-on", inFlight);
    introCard.style.visibility = p > 0.001 ? "hidden" : "visible";
    reel.classList.toggle("is-arrived", p >= 0.999);
    if (inFlight) flyer.render(p);
  };
  const flightST = ScrollTrigger.create({
    trigger: reel, start: "top 92%", end: "top 14%", scrub: 0.7,
    onUpdate: (self) => setFlight(self.progress),
    onRefresh: (self) => setFlight(self.progress),
  });
  // keep the flying card glued to the layout while smooth-scrolling
  gsap.ticker.add(() => { if (flying) flyer?.render(flightST.progress); });

  // reel title: faint words drift in and settle
  gsap.timeline({ scrollTrigger: { trigger: reel, start: "top 92%", end: "top 14%", scrub: 0.7 } })
    .fromTo("#reelLeft", { xPercent: 40, opacity: 0.25 }, { xPercent: 0, opacity: 1, ease: "none" }, 0)
    .fromTo("#reelRight", { xPercent: -40, opacity: 0.25 }, { xPercent: 0, opacity: 1, ease: "none" }, 0)
    .fromTo(".reel__play", { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, ease: "none" }, 0.55);

  // hover: faster clip cycling + "PLAY REEL" tickers on the edges
  reel.addEventListener("pointerenter", () => {
    reel.classList.add("is-hover"); reelHover = true;
    clearTimeout(reelTimer); reelTimer = setTimeout(reelTick, 300);
  });
  reel.addEventListener("pointerleave", () => { reel.classList.remove("is-hover"); reelHover = false; });

  // Full-screen showreel, like Lusion's: clicking the reel fades in a black layer, the film fills the screen,
  // a white ✕ cursor follows the mouse (grows with speed, spins as it moves, shrinks over the controls),
  // PAUSE · progress bar · CLOSE sit at the bottom. Click anywhere, press Esc or let it end to close.
  const reelPlayer = (() => {
    const ov = document.createElement("div"); ov.className = "reelov"; ov.setAttribute("aria-hidden", "true");
    const X = `<svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M8 8 28 28M28 8 8 28" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
    ov.innerHTML = `
      <video class="reelov__video" playsinline preload="none" poster="assets/reel/poster.jpg"></video>
      <div class="reelov__controls">
        <button class="reelov__btn reelov__toggle" type="button">PAUSE</button>
        <div class="reelov__bar" role="slider" aria-label="Seek"><i class="reelov__bg"></i><i class="reelov__fill"></i></div>
        <button class="reelov__btn reelov__close" type="button">CLOSE</button>
      </div>
      <button class="reelov__x" type="button" aria-label="Close reel">${X}</button>
      <div class="reelov__cursor">${X}</div>`;
    document.body.appendChild(ov);
    const video = $(".reelov__video", ov), fill = $(".reelov__fill", ov), bar = $(".reelov__bar", ov), toggleBtn = $(".reelov__toggle", ov);
    const cur = $(".reelov__cursor", ov), curSvg = $("svg", cur);
    let open = false, raf = 0, last = 0, act = 0, rotR = 0, spin = 0, spinV = 0, hoverF = 1, overControls = false;
    const m = { x: innerWidth / 2, y: innerHeight / 2, px: innerWidth / 2, py: innerHeight / 2, ex: innerWidth / 2, ey: innerHeight / 2 };
    ov.addEventListener("pointermove", (e) => { m.x = e.clientX; m.y = e.clientY; });
    $$(".reelov__controls > *", ov).forEach((el) => {
      el.addEventListener("pointerenter", () => (overControls = true));
      el.addEventListener("pointerleave", () => (overControls = false));
    });
    const backOut = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
    const backInOut = (t) => { const c = 1.70158 * 1.525; return t < 0.5 ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2 : (Math.pow(2 * t - 2, 2) * ((c + 1) * (t * 2 - 2) + c) + 2) / 2; };
    const tick = (t) => {
      const dt = Math.min((t - (last || t)) / 1000, 0.05); last = t;
      const k = 1 - Math.exp(-14 * dt);
      const vx = (m.x - m.ex), vy = (m.y - m.ey);
      m.ex += vx * k; m.ey += vy * k;                     // eased mouse
      const speed = Math.hypot(vx, vy) * k / Math.max(dt, 1e-3) / 100;   // px per frame-ish → 0..
      act = Math.min(1, act + dt * 1.5);
      hoverF = Math.min(1, Math.max(0, hoverF + 4 * dt * (overControls ? -1 : 1)));
      rotR = Math.min(1, rotR + dt * 3);
      spinV += ((Math.max(-1, Math.min(1, -vy * k / Math.max(dt, 1e-3) / 400)) - spin) * 60 - spinV * 9) * dt;   // springy extra turn from vertical moves
      spin += spinV * dt;
      const s = (0.2 + 0.8 * hoverF) * Math.min(2.5, speed / 5 + 1) * backOut(act);
      cur.style.transform = `translate3d(${m.ex}px,${m.ey}px,0) translate3d(-50%,-50%,0) scale(${s.toFixed(3)})`;
      curSvg.style.transform = `scale(${hoverF.toFixed(3)}) rotate(${(backInOut(rotR) * 180 + spin * 75).toFixed(2)}deg)`;
      if (video.duration) fill.style.width = `${(video.currentTime / video.duration) * 100}%`;
      raf = open ? requestAnimationFrame(tick) : 0;
    };
    const show = () => {
      if (open) return;
      open = true; act = 0; rotR = 0; spin = spinV = 0; last = 0;
      if (!video.src) video.src = "assets/reel/showreel.mp4";
      video.currentTime = 0; fill.style.width = "0%"; toggleBtn.textContent = "PAUSE";
      ov.setAttribute("aria-hidden", "false"); ov.classList.add("is-open");
      lenis?.stop(); ambient.duck(1);
      gsap.fromTo(ov, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.inOut", overwrite: true });
      setTimeout(() => { if (open) video.play().catch(() => {}); }, 500);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const hide = () => {
      if (!open) return;
      open = false; video.pause();
      lenis?.start(); ambient.duck(0);
      gsap.to(ov, { opacity: 0, duration: 0.5, ease: "power1.inOut", overwrite: true, onComplete: () => {
        if (open) return;
        ov.classList.remove("is-open"); ov.setAttribute("aria-hidden", "true"); video.currentTime = 0;
      } });
    };
    ov.addEventListener("click", () => { if (innerWidth > 812) hide(); });   // desktop: click anywhere closes
    $(".reelov__x", ov).addEventListener("click", (e) => { e.stopPropagation(); hide(); });
    $(".reelov__close", ov).addEventListener("click", (e) => { e.stopPropagation(); hide(); });
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (video.paused) { video.play().catch(() => {}); toggleBtn.textContent = "PAUSE"; } else { video.pause(); toggleBtn.textContent = "PLAY"; }
    });
    bar.addEventListener("click", (e) => {
      e.stopPropagation();
      const r = bar.getBoundingClientRect();
      if (video.duration) video.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * video.duration;
      video.play().catch(() => {}); toggleBtn.textContent = "PAUSE";
    });
    video.addEventListener("ended", hide);
    document.addEventListener("keydown", (e) => { if (open && e.key === "Escape") hide(); });
    return { show, hide };
  })();
  reelPanel.addEventListener("click", (e) => { e.preventDefault(); reelPlayer.show(); });

}