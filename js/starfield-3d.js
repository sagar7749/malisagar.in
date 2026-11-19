/*
  3D starfield (desktop only).

  Phones, tablets, "reduce motion", Save-Data and browsers without WebGL 2 keep
  the light 2D canvas from site.js. On a desktop, three.js is fetched only after
  the page has finished loading and the browser is idle, then the 3D field fades
  in and the 2D canvas fades out. If anything fails, the 2D canvas simply stays.

  - Stars live in an endless tunnel: scrolling moves you through it.
  - The camera leans toward the mouse for a parallax effect.
  - An occasional shooting star crosses the sky.
*/

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktop = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');

function supportsWebGL2() {
  try {
    const test = document.createElement('canvas');
    return Boolean(window.WebGL2RenderingContext && test.getContext('webgl2'));
  } catch (error) {
    return false;
  }
}

function shouldRun() {
  const saveData = navigator.connection && navigator.connection.saveData;
  return desktop.matches && !reducedMotion.matches && !saveData && supportsWebGL2();
}

function afterLoadAndIdle() {
  return new Promise((resolve) => {
    const idle = () => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(resolve, { timeout: 2500 });
      else window.setTimeout(resolve, 400);
    };
    if (document.readyState === 'complete') idle();
    else window.addEventListener('load', idle, { once: true });
  });
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uOffset;
  uniform float uDepth;
  uniform float uPixelRatio;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    // Endless tunnel: stars move toward the camera and wrap round to the back.
    p.z = mod(p.z + uOffset, uDepth) - uDepth;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = -mv.z;

    // Perspective size, but never below ~1.7 px so distant stars stay visible;
    // stars held at the minimum size are dimmed instead, which keeps the depth.
    float size = aSize * uPixelRatio * (520.0 / max(dist, 1.0));
    float minSize = 1.7 * uPixelRatio;
    float sizeFade = clamp(size / minSize, 0.5, 1.0);

    float twinkle = 0.65 + 0.35 * sin(uTime * aSpeed + aPhase);
    float fadeFar = 1.0 - smoothstep(uDepth * 0.6, uDepth * 0.97, dist);
    float fadeNear = smoothstep(12.0, 150.0, dist);
    vAlpha = twinkle * fadeFar * fadeNear * sizeFade;
    vColor = aColor;

    gl_PointSize = clamp(size, minSize, 9.0 * uPixelRatio);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Bright core with a soft edge; small points still get a full-strength centre.
    float d = length(gl_PointCoord - 0.5);
    float glow = smoothstep(0.5, 0.12, d);
    gl_FragColor = vec4(vColor, glow * vAlpha * uOpacity);
  }
`;

async function start() {
  if (!shouldRun()) return;
  await afterLoadAndIdle();
  if (!shouldRun()) return;

  let THREE;
  try {
    THREE = await import(THREE_URL);
  } catch (error) {
    return; // Offline or blocked: the 2D starfield stays.
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'starfield-3d';
  canvas.setAttribute('aria-hidden', 'true');
  const flat = document.getElementById('starfield');
  if (flat) flat.after(canvas);
  else document.body.prepend(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch (error) {
    canvas.remove();
    return;
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
  const lookTarget = new THREE.Vector3(0, 0, -900);

  /* Stars ---------------------------------------------------------------- */
  const COUNT = 4500;
  const DEPTH = 2400;
  const SPREAD_X = 1700;
  const SPREAD_Y = 1100;
  const palette = [
    [1, 1, 1],          // white
    [0.86, 0.83, 1],    // lavender, matches the accent colour
    [0.75, 0.93, 0.9]   // teal
  ];

  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const phases = new Float32Array(COUNT);
  const speeds = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() * 2 - 1) * SPREAD_X;
    positions[i * 3 + 1] = (Math.random() * 2 - 1) * SPREAD_Y;
    positions[i * 3 + 2] = -Math.random() * DEPTH;
    const pick = Math.random();
    colors.set(pick < 0.78 ? palette[0] : pick < 0.92 ? palette[1] : palette[2], i * 3);
    sizes[i] = Math.random() < 0.06 ? 2.6 + Math.random() * 1.4 : 0.9 + Math.random() * 1.3;
    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = 0.6 + Math.random() * 1.8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOffset: { value: 0 },
      uDepth: { value: DEPTH },
      uPixelRatio: { value: pixelRatio },
      uOpacity: { value: 0 }
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const stars = new THREE.Points(geometry, material);
  stars.frustumCulled = false; // positions are moved in the shader
  scene.add(stars);

  /* Shooting star -------------------------------------------------------- */
  const trailPositions = new Float32Array(6);
  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
  trailGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array([1, 1, 1, 0, 0, 0]), 3));
  const trailMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const trail = new THREE.Line(trailGeometry, trailMaterial);
  trail.frustumCulled = false;
  scene.add(trail);

  let meteor = null;
  let nextMeteor = 3 + Math.random() * 4;

  function updateMeteor(dt, time, opacity) {
    if (!meteor && time > nextMeteor) {
      meteor = {
        x: 100 + Math.random() * 600,
        y: 120 + Math.random() * 260,
        z: -700,
        vx: -(800 + Math.random() * 400),
        vy: -(260 + Math.random() * 180),
        age: 0,
        life: 0.9 + Math.random() * 0.4
      };
    }
    if (!meteor) return;
    meteor.age += dt;
    meteor.x += meteor.vx * dt;
    meteor.y += meteor.vy * dt;
    trailPositions[0] = meteor.x;
    trailPositions[1] = meteor.y;
    trailPositions[2] = meteor.z;
    trailPositions[3] = meteor.x - meteor.vx * 0.14;
    trailPositions[4] = meteor.y - meteor.vy * 0.14;
    trailPositions[5] = meteor.z;
    trailGeometry.attributes.position.needsUpdate = true;
    trailMaterial.opacity = Math.sin(Math.PI * Math.min(1, meteor.age / meteor.life)) * opacity;
    if (meteor.age >= meteor.life) {
      meteor = null;
      trailMaterial.opacity = 0;
      nextMeteor = time + 7 + Math.random() * 9;
    }
  }

  /* Interaction ---------------------------------------------------------- */
  let mouseX = 0;
  let mouseY = 0;
  function onPointerMove(event) {
    mouseX = event.clientX / window.innerWidth - 0.5;
    mouseY = event.clientY / window.innerHeight - 0.5;
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  window.addEventListener('resize', onResize);

  /* Loop ----------------------------------------------------------------- */
  const clock = new THREE.Clock();
  let scrollOffset = window.scrollY * 0.35;
  let drift = 0;
  let cameraX = 0;
  let cameraY = 0;
  let fade = 0;
  let rafId = 0;
  let announced = false;

  function frame() {
    rafId = window.requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    scrollOffset += (window.scrollY * 0.35 - scrollOffset) * Math.min(1, dt * 4);
    drift += dt * 12;
    cameraX += (mouseX * 70 - cameraX) * Math.min(1, dt * 2.5);
    cameraY += (-mouseY * 45 - cameraY) * Math.min(1, dt * 2.5);
    fade = Math.min(1, fade + dt / 1.2);

    material.uniforms.uTime.value = time;
    material.uniforms.uOffset.value = scrollOffset + drift;
    material.uniforms.uOpacity.value = fade;
    camera.position.set(cameraX, cameraY, 0);
    camera.lookAt(lookTarget);
    stars.rotation.z = time * 0.004;
    updateMeteor(dt, time, fade);

    renderer.render(scene, camera);

    if (!announced) {
      announced = true;
      document.dispatchEvent(new CustomEvent('starfield:3d-ready'));
    }
  }

  function pause() {
    window.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function resume() {
    if (rafId) return;
    clock.getDelta(); // skip the time spent hidden
    rafId = window.requestAnimationFrame(frame);
  }

  function onVisibility() {
    if (document.hidden) pause();
    else resume();
  }
  document.addEventListener('visibilitychange', onVisibility);

  /* Teardown: hand back to the 2D canvas --------------------------------- */
  let stopped = false;
  function stop() {
    if (stopped) return;
    stopped = true;
    pause();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    geometry.dispose();
    material.dispose();
    trailGeometry.dispose();
    trailMaterial.dispose();
    renderer.dispose();
    canvas.remove();
    document.dispatchEvent(new CustomEvent('starfield:3d-stopped'));
  }

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    stop();
  });

  const onReducedMotion = () => {
    if (reducedMotion.matches) stop();
  };
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', onReducedMotion);
  else if (reducedMotion.addListener) reducedMotion.addListener(onReducedMotion);

  if (!document.hidden) resume();
}

start();
