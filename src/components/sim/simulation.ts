import {
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  Fog,
  Group,
  Line,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'

/**
 * Simulação do hero: um quadrúpede (proporções inspiradas no Unitree Go2) anda
 * em trote por um ambiente virtual, seguindo uma trajetória planejada.
 *
 * O que é "de verdade": a marcha (pés de apoio ficam cravados no chão; as juntas
 * vêm de cinemática inversa), a varredura do LiDAR e a nuvem de pontos que ela
 * acende nas faces dos obstáculos voltadas para o robô. O chão fica limpo: só a grade,
 * os anéis de alcance e o feixe — sem trajetória, pegadas ou outras marcações.
 * O que NÃO é: o modelo é procedural (caixas e cilindros) — não é o CAD da Unitree —
 * e não há dinâmica/física: é cinemática.
 *
 * Estilo: desenho técnico. Peças preenchidas de branco, contorno em tinta
 * (casco invertido) e arestas; tudo some numa névoa branca.
 */

export interface SimOptions {
  ink: string
  accent: string
  reducedMotion: boolean
}

export interface SimHandle {
  /** Posição do ponteiro em relação ao centro da janela, em [-1, 1]. */
  setPointer(x: number): void
  /** Progresso da rolagem pelo hero, em [0, 1]: ergue a câmera até a vista aérea. */
  setScroll(progress: number): void
  setVisible(visible: boolean): void
  dispose(): void
}

// --- Marcha --------------------------------------------------------------------------------
const SPEED = 0.8 // m/s
const PERIOD = 0.52 // s por ciclo de cada pata
const STANCE_HEIGHT = 0.3
const SWING_HEIGHT = 0.075
const THIGH = 0.213
const CALF = 0.213
const FOOT_RADIUS = 0.023
/** Quadril de cada pata no referencial do corpo (x à frente, z lateral). Ordem: FL, FR, RL, RR. */
const HIPS: [number, number][] = [
  [0.19, -0.142],
  [0.19, 0.142],
  [-0.19, -0.142],
  [-0.19, 0.142],
]
/** Trote: diagonais juntas. */
const PHASE = [0, 0.5, 0.5, 0]

// --- Trajetória planejada: um leve ziguezague ------------------------------------------------
const PATH_AMPLITUDE = 0.55
const PATH_K = 0.42
const pathZ = (x: number) => PATH_AMPLITUDE * Math.sin(PATH_K * x)
const pathHeading = (x: number) => Math.atan(PATH_AMPLITUDE * PATH_K * Math.cos(PATH_K * x))

// --- LiDAR ----------------------------------------------------------------------------------------
const LIDAR_RANGE = 7.5
const LIDAR_RATE = Math.PI * 1.7 // rad/s
const POINTS_PER_OBSTACLE = 1100

// --- Obstáculos: um por "vaga" ao longo do caminho, gerado por hash ------------------------------
const SLOT = 3.4
const POOL = 11

const hash = (n: number, salt: number) => {
  const s = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453
  return s - Math.floor(s)
}

export function createSimulation(canvas: HTMLCanvasElement, opts: SimOptions): SimHandle {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  const dpr = Math.min(window.devicePixelRatio, 2)
  renderer.setPixelRatio(dpr)

  const scene = new Scene()
  scene.fog = new Fog(0xffffff, 5, 15.5)
  const camera = new PerspectiveCamera(30, 1, 0.1, 60)

  const disposables: { dispose(): void }[] = []
  const track = <T extends { dispose(): void }>(item: T): T => {
    disposables.push(item)
    return item
  }

  const ink = new Color(opts.ink)
  const accent = new Color(opts.accent)

  // --- Materiais -------------------------------------------------------------------------------
  const fillMaterial = (color: number | Color) =>
    track(new MeshBasicMaterial({ color, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }))
  const white = fillMaterial(0xffffff)
  const shell = fillMaterial(0xedf0f5)
  const dark = fillMaterial(ink)
  const hullMaterial = track(new MeshBasicMaterial({ color: ink, side: BackSide }))
  const inkLine = track(new LineBasicMaterial({ color: ink }))
  const obstacleLine = track(new LineBasicMaterial({ color: 0x8a96ad }))
  const beamLine = track(new LineBasicMaterial({ color: accent, transparent: true, opacity: 0.4 }))
  const inkFaint = track(new LineBasicMaterial({ color: ink, transparent: true, opacity: 0.22 }))

  /**
   * Uma peça no estilo desenho técnico: preenchimento + arestas + contorno.
   * O contorno é um "casco invertido": a mesma geometria, um pouco maior, só com as faces de trás.
   */
  function part(geometry: BufferGeometry, material: MeshBasicMaterial, outline = 0.0055): Group {
    track(geometry)
    const group = new Group()
    group.add(new Mesh(geometry, material))
    group.add(new LineSegments(track(new EdgesGeometry(geometry, 30)), inkLine))

    geometry.computeBoundingBox()
    const box = geometry.boundingBox!
    const size = box.getSize(new Vector3())
    const centre = box.getCenter(new Vector3())
    const hull = new Mesh(geometry, hullMaterial)
    hull.scale.set((size.x + 2 * outline) / size.x, (size.y + 2 * outline) / size.y, (size.z + 2 * outline) / size.z)
    hull.position.set(centre.x * (1 - hull.scale.x), centre.y * (1 - hull.scale.y), centre.z * (1 - hull.scale.z))
    group.add(hull)
    return group
  }

  const at = (object: Group, x: number, y: number, z: number) => {
    object.position.set(x, y, z)
    return object
  }

  // --- Chão em grade: linhas finas que somem na névoa ------------------------------------------------
  function gridLines(step: number, extent: number, color: number): LineSegments {
    const positions: number[] = []
    // Trechos curtos: a névoa é interpolada entre as pontas de cada segmento, então uma linha
    // inteiriça (com as duas pontas longe) ficaria toda branca, mesmo perto do robô.
    for (let v = -extent; v <= extent + 1e-6; v += step) {
      for (let u = -extent; u < extent - 1e-6; u += 1) {
        positions.push(u, 0, v, u + 1, 0, v, v, 0, u, v, 0, u + 1)
      }
    }
    const geometry = track(new BufferGeometry())
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return new LineSegments(geometry, track(new LineBasicMaterial({ color })))
  }
  const minorGrid = gridLines(0.5, 18, 0xc3cbd9)
  const majorGrid = gridLines(2, 18, 0x8e9ab1)
  majorGrid.position.y = 0.001
  scene.add(minorGrid, majorGrid)

  // --- Robô ---------------------------------------------------------------------------------------------
  const body = new Group()
  scene.add(body)

  body.add(part(new BoxGeometry(0.4, 0.1, 0.19), white))
  body.add(at(part(new BoxGeometry(0.14, 0.088, 0.152), white), 0.262, 0.004, 0)) // cabeça
  body.add(at(part(new BoxGeometry(0.008, 0.058, 0.118), dark, 0.002), 0.336, 0.008, 0)) // visor
  body.add(at(part(new BoxGeometry(0.1, 0.082, 0.16), white), -0.245, 0, 0)) // traseira
  body.add(at(part(new BoxGeometry(0.27, 0.014, 0.05), shell, 0.003), -0.01, 0.057, 0)) // trilho superior
  body.add(at(part(new CylinderGeometry(0.034, 0.034, 0.036, 28), dark, 0.003), 0.292, -0.062, 0)) // LiDAR sob o queixo

  const abductionGeometry = new CylinderGeometry(0.046, 0.046, 0.082, 28).rotateZ(Math.PI / 2)
  const thighMotorGeometry = new CylinderGeometry(0.049, 0.049, 0.058, 28).rotateX(Math.PI / 2)
  const thighGeometry = new BoxGeometry(0.046, THIGH + 0.03, 0.032).translate(0, -THIGH / 2, 0)
  const kneeGeometry = new CylinderGeometry(0.021, 0.021, 0.04, 20).rotateX(Math.PI / 2)
  const calfGeometry = new BoxGeometry(0.021, CALF, 0.019).translate(0, -CALF / 2, 0)
  const footGeometry = track(new SphereGeometry(FOOT_RADIUS, 16, 12))

  interface Leg {
    origin: Vector3
    abduction: Group
    thigh: Group
    knee: Group
  }
  const legs: Leg[] = HIPS.map(([hx, hz]) => {
    const side = Math.sign(hz)
    body.add(at(part(abductionGeometry, shell, 0.004), hx, -0.012, side * 0.072))

    const abduction = new Group()
    abduction.position.set(hx, -0.012, hz)
    body.add(abduction)

    const thigh = new Group()
    thigh.add(part(thighGeometry, white), part(thighMotorGeometry, shell, 0.004))
    abduction.add(thigh)

    const knee = new Group()
    knee.position.y = -THIGH
    knee.add(part(calfGeometry, dark, 0.002), part(kneeGeometry, dark, 0.002))
    const foot = new Mesh(footGeometry, dark)
    foot.position.y = -CALF
    knee.add(foot)
    thigh.add(knee)

    return { origin: abduction.position.clone(), abduction, thigh, knee }
  })

  function ring(radius: number, segments = 28): BufferGeometry {
    const positions: number[] = []
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2
      positions.push(Math.cos(a) * radius, 0, Math.sin(a) * radius)
    }
    const geometry = track(new BufferGeometry())
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return geometry
  }
  // --- LiDAR: anéis de alcance, feixe giratório, nuvem de pontos ------------------------------------------------
  const lidarRig = new Group()
  scene.add(lidarRig)
  for (const radius of [2.5, 5, LIDAR_RANGE]) lidarRig.add(new LineLoop(ring(radius, 96), inkFaint))

  const beamGeometry = track(new BufferGeometry())
  beamGeometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, LIDAR_RANGE, 0, 0], 3))
  const beam = new Line(beamGeometry, beamLine)
  lidarRig.add(beam)

  const pointMaterial = track(
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uColor: { value: accent }, uSize: { value: 3.2 * dpr } },
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        uniform float uSize;
        void main() {
          vAlpha = alpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uSize;
        }`,
      fragmentShader: `
        varying float vAlpha;
        uniform vec3 uColor;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          if (vAlpha < 0.03 || dot(c, c) > 0.25) discard;
          gl_FragColor = vec4(uColor, vAlpha);
        }`,
    }),
  )

  // --- Obstáculos --------------------------------------------------------------------------------------------------
  const unitBox = track(new BoxGeometry(1, 1, 1))
  const unitBoxEdges = track(new EdgesGeometry(unitBox))

  interface Obstacle {
    slot: number
    active: boolean
    group: Group
    points: Points
    count: number
    /** Normal (x, z) da face de cada ponto, para saber se ela está voltada para o robô. */
    normals: Float32Array
    x: number
    z: number
  }
  const obstacles: Obstacle[] = Array.from({ length: POOL }, () => {
    const group = new Group()
    group.add(new Mesh(unitBox, white), new LineSegments(unitBoxEdges, obstacleLine))
    const geometry = track(new BufferGeometry())
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(POINTS_PER_OBSTACLE * 3), 3))
    geometry.setAttribute('alpha', new BufferAttribute(new Float32Array(POINTS_PER_OBSTACLE), 1))
    const points = new Points(geometry, pointMaterial)
    points.frustumCulled = false
    scene.add(group, points)
    return { slot: NaN, active: false, group, points, count: 0, normals: new Float32Array(POINTS_PER_OBSTACLE * 2), x: 0, z: 0 }
  })

  function configure(obstacle: Obstacle, slot: number) {
    obstacle.slot = slot
    obstacle.active = hash(slot, 1) > 0.1
    obstacle.group.visible = obstacle.points.visible = obstacle.active
    if (!obstacle.active) return

    // A câmera fica do lado +z: ali os obstáculos são baixos e próximos do caminho, para nunca
    // taparem o robô. Do lado oposto (o fundo da cena) eles podem ser altos.
    const side = hash(slot, 6) > 0.62 ? 1 : -1
    const w = 0.6 + hash(slot, 2) * 1.7
    const d = 0.6 + hash(slot, 3) * (side > 0 ? 0.6 : 1.5)
    const h = side > 0 ? 0.25 + hash(slot, 4) * 0.4 : 0.5 + hash(slot, 4) * hash(slot, 5) * 2.4
    const x = slot * SLOT + hash(slot, 7) * 1.4
    const z = side * (1.35 + d / 2 + hash(slot, 8) * (side > 0 ? 0.9 : 2.6))
    obstacle.x = x
    obstacle.z = z
    obstacle.group.position.set(x, h / 2, z)
    obstacle.group.scale.set(w, h, d)

    // Amostra pontos nas quatro faces verticais, até a altura que o LiDAR alcança.
    const positions = obstacle.points.geometry.getAttribute('position') as BufferAttribute
    const alphas = obstacle.points.geometry.getAttribute('alpha') as BufferAttribute
    const faces: [number, number, number, number, number, number][] = [
      // x0, z0, x1, z1, nx, nz
      [x - w / 2, z - d / 2, x + w / 2, z - d / 2, 0, -1],
      [x - w / 2, z + d / 2, x + w / 2, z + d / 2, 0, 1],
      [x - w / 2, z - d / 2, x - w / 2, z + d / 2, -1, 0],
      [x + w / 2, z - d / 2, x + w / 2, z + d / 2, 1, 0],
    ]
    let n = 0
    for (const [x0, z0, x1, z1, nx, nz] of faces) {
      const length = Math.hypot(x1 - x0, z1 - z0)
      const columns = Math.max(2, Math.round(length / 0.085))
      for (let row = 0; 0.07 + row * 0.115 < Math.min(h, 1.5); row++) {
        for (let c = 0; c <= columns && n < POINTS_PER_OBSTACLE; c++) {
          const t = c / columns
          positions.setXYZ(n, x0 + (x1 - x0) * t + nx * 0.004, 0.07 + row * 0.115, z0 + (z1 - z0) * t + nz * 0.004)
          obstacle.normals[n * 2] = nx
          obstacle.normals[n * 2 + 1] = nz
          n++
        }
      }
    }
    obstacle.count = n
    ;(alphas.array as Float32Array).fill(0)
    positions.needsUpdate = alphas.needsUpdate = true
    obstacle.points.geometry.setDrawRange(0, n)
  }

  // --- Estado ----------------------------------------------------------------------------------------------------------
  let time = 0
  let sweep = 0
  let pointer = 0
  let scrollTarget = 0
  let lift = 0
  let orbit = 0
  let visible = true
  let distance = 5.4
  let height = 1.85
  let disposed = false
  let raf = 0
  let last = 0

  const inverse = new Matrix4()
  const target = new Vector3()
  const local = new Vector3()
  const lookAt = new Vector3()

  /** Posição de apoio da pata `i` no ciclo `n`: sob o quadril, no meio da fase de apoio. */
  function foothold(i: number, n: number, out: Vector3): Vector3 {
    const x = SPEED * (n + 0.25 - PHASE[i]) * PERIOD
    const heading = pathHeading(x)
    const [hx, hz] = HIPS[i]
    const lateral = hz * 1.12
    return out.set(x + Math.cos(heading) * hx - Math.sin(heading) * lateral, 0, pathZ(x) + Math.sin(heading) * hx + Math.cos(heading) * lateral)
  }

  const from = new Vector3()
  const to = new Vector3()

  function step(dt: number) {
    time += dt
    const x = SPEED * time
    const z = pathZ(x)
    const heading = pathHeading(x)
    const gaitAngle = (time / PERIOD) * Math.PI * 2

    // Corpo: segue a trajetória, com um balanço mínimo no ritmo do trote.
    body.position.set(x, STANCE_HEIGHT + Math.sin(gaitAngle * 2) * 0.004, z)
    body.rotation.set(Math.sin(gaitAngle) * 0.014, -heading, Math.sin(gaitAngle * 2 + 0.6) * 0.008, 'YXZ')
    body.updateMatrixWorld(true)
    inverse.copy(body.matrixWorld).invert()

    // Patas: apoio fixo no mundo, balanço em arco até a próxima pegada, juntas por cinemática inversa.
    legs.forEach((leg, i) => {
      const phase = time / PERIOD + PHASE[i]
      const n = Math.floor(phase)
      const u = phase - n
      foothold(i, n, from)
      if (u < 0.5) {
        target.copy(from)
      } else {
        const s = (u - 0.5) * 2
        const eased = s * s * (3 - 2 * s)
        target.lerpVectors(from, foothold(i, n + 1, to), eased)
        target.y = Math.sin(Math.PI * s) * SWING_HEIGHT
      }
      target.y += FOOT_RADIUS

      local.copy(target).applyMatrix4(inverse).sub(leg.origin)
      const reach = Math.hypot(local.y, local.z)
      leg.abduction.rotation.x = Math.atan2(-local.z, -local.y)
      const d = Math.min(Math.hypot(local.x, reach), THIGH + CALF - 1e-4)
      const interior = Math.acos((THIGH * THIGH + CALF * CALF - d * d) / (2 * THIGH * CALF))
      const kneeAngle = Math.PI - interior
      leg.thigh.rotation.z = Math.atan2(local.x, reach) - Math.atan2(CALF * Math.sin(kneeAngle), THIGH + CALF * Math.cos(kneeAngle))
      leg.knee.rotation.z = kneeAngle
    })

    minorGrid.position.set(Math.round(x / 2) * 2, 0, Math.round(z / 2) * 2)
    majorGrid.position.set(minorGrid.position.x, 0.001, minorGrid.position.z)

    // LiDAR: o feixe gira; pontos nas faces voltadas para o robô acendem quando ele passa e depois esmaecem.
    const previous = sweep
    sweep = (sweep + LIDAR_RATE * dt) % (Math.PI * 2)
    lidarRig.position.set(x, 0.008, z)
    beam.rotation.y = -sweep

    const currentSlot = Math.floor(x / SLOT)
    for (let s = currentSlot - 3; s <= currentSlot + POOL - 4; s++) {
      const obstacle = obstacles[((s % POOL) + POOL) % POOL]
      if (obstacle.slot !== s) configure(obstacle, s)
      if (!obstacle.active || Math.hypot(obstacle.x - x, obstacle.z - z) > LIDAR_RANGE + 3) continue

      const positions = obstacle.points.geometry.getAttribute('position') as BufferAttribute
      const alphas = obstacle.points.geometry.getAttribute('alpha') as BufferAttribute
      const alpha = alphas.array as Float32Array
      const decay = Math.pow(0.35, dt)
      for (let p = 0; p < obstacle.count; p++) {
        alpha[p] *= decay
        const dx = positions.getX(p) - x
        const dz = positions.getZ(p) - z
        const distance = Math.hypot(dx, dz)
        if (distance < LIDAR_RANGE && obstacle.normals[p * 2] * dx + obstacle.normals[p * 2 + 1] * dz < 0) {
          let angle = Math.atan2(dz, dx)
          if (angle < 0) angle += Math.PI * 2
          const swept = previous <= sweep ? angle >= previous && angle < sweep : angle >= previous || angle < sweep
          if (swept) alpha[p] = Math.max(0.35, 1 - distance / (LIDAR_RANGE * 1.15))
        }
      }
      alphas.needsUpdate = true
    }

    // Câmera: acompanha o robô em três-quartos; o ponteiro dá um leve giro em volta.
    orbit += (pointer * 0.28 - orbit) * Math.min(1, dt * 3)
    // …e a rolagem a ergue: de três-quartos até quase a vertical, como um mapa visto de cima.
    lift += (scrollTarget - lift) * Math.min(1, dt * 5)
    const eased = lift * lift * (3 - 2 * lift)
    const radius = distance + (1.1 - distance) * eased
    const altitude = height + (11.5 - height) * eased
    const angle = 1.12 + orbit + eased * 0.45
    const followZ = z * 0.5
    camera.position.set(x + 0.2 - Math.cos(angle) * radius, altitude, followZ + Math.sin(angle) * radius)
    lookAt.set(x + 0.2, 0.3, followZ - 0.3)
    camera.lookAt(lookAt)
  }

  function frame(now: number) {
    raf = 0
    if (disposed) return
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016
    last = now
    step(dt)
    renderer.render(scene, camera)
    if (visible) raf = requestAnimationFrame(frame)
  }

  /** Movimento reduzido: avança a simulação fora da tela e mostra um único quadro parado. */
  function renderStill() {
    if (time === 0) for (let i = 0; i < 360; i++) step(1 / 60)
    renderer.render(scene, camera)
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // Faixa larga e baixa (celular): câmera mais próxima e mais baixa, para o robô não virar um pontinho.
    const strip = camera.aspect > 1.05
    camera.fov = strip ? 26 : 30
    distance = strip ? 3.9 : 5.4
    height = strip ? 1.25 : 1.85
    camera.updateProjectionMatrix()
    if (opts.reducedMotion) renderStill()
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  resize()

  const onVisibility = () => {
    if (!document.hidden && visible && !opts.reducedMotion && !raf) {
      last = 0
      raf = requestAnimationFrame(frame)
    }
  }
  document.addEventListener('visibilitychange', onVisibility)

  if (opts.reducedMotion) renderStill()
  else raf = requestAnimationFrame(frame)

  return {
    setPointer(x) {
      pointer = x
    },
    setScroll(progress) {
      scrollTarget = opts.reducedMotion ? 0 : progress
    },
    setVisible(v) {
      visible = v
      if (v && !raf && !opts.reducedMotion && !disposed) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      for (const d of disposables) d.dispose()
      renderer.dispose()
    },
  }
}
