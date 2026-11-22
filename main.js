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
   1. HERO 3D (v2) — a wall of glossy "UI toys" (app tiles, pills,
      dots, rings). Cursor pushes them away and leaves a
      liquid, colour-split smear across the panel.
   ========================================================= */
const panel = $("#heroPanel");
const hero = createHero();

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
    if (panel.contains(e.target)) { last.set(-1, -1); return; }   // the hero has its own liquid
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
  $("#loader").remove(); $("#loaderVeil").remove();
  document.body.classList.remove("is-loading");
  $(".reel").classList.add("is-arrived");
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

/* =========================================================
   6. Loader: odometer counter + bar → logo mark → tilted
      window opens onto the site
   ========================================================= */
const loader = $("#loader");
const countEl = $("#loaderCount");
countEl.innerHTML = [2, 10, 10].map((n) =>
  `<span class="odo"><span class="odo__track">${Array.from({ length: n }, (_, i) => `<span>${i}</span>`).join("")}</span></span>`
).join("");
const odoTracks = $$(".odo__track", countEl);
const setCount = (n) => String(n).padStart(3, "0").split("").forEach((d, i) => {
  odoTracks[i].style.transform = `translateY(${-d}em)`;
});
setCount(0);

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
  tl.add(() => setCount(v), at)
    .to(prog, { p: v / 100, duration: reduceMotion ? 0.02 : 0.3, ease: "power2.out", onUpdate: () => setBar(prog.p) }, "<");
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
  drawTube();
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

/* =========================================================
   9. Work + footer (unchanged behaviour)
   ========================================================= */
$$(".section-title").forEach((el) => gsap.from($$(".line > span", el), {
  yPercent: 110, duration: 1.3, stagger: 0.12, ease: "expo.out",
  scrollTrigger: { trigger: el, start: "top 85%", toggleActions: REWIND },
}));
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
