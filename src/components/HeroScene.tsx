import type { CSSProperties } from 'react'
import './HeroScene.css'

/**
 * Cena do hero: um robô quadrúpede supervisionando um ambiente virtual que se
 * desenha — chão em grade (linhas apagadas), estruturas em wireframe, um leque
 * de varredura e um marcador de detecção.
 *
 * É só SVG. A perspectiva vem de um projetor mínimo (câmera pinhole), então
 * grade, estruturas e robô compartilham o mesmo ponto de fuga.
 */

const W = 720
const H = 820

// --- Câmera -------------------------------------------------------------------------
const CAM = { x: 0.4, y: 1.3, z: -3.2, pitch: (8 * Math.PI) / 180, f: 900, cx: 350, cy: 526 }
const NEAR = 0.45
const SIN = Math.sin(CAM.pitch)
const COS = Math.cos(CAM.pitch)

type Vec = [number, number, number]

/** Mundo → espaço da câmera (x para a direita, y para cima, z para a frente). */
const toCamera = ([x, y, z]: Vec): Vec => {
  const dx = x - CAM.x
  const dy = y - CAM.y
  const dz = z - CAM.z
  return [dx, dy * COS + dz * SIN, -dy * SIN + dz * COS]
}

const toScreen = ([x, y, z]: Vec): [number, number] => [CAM.cx + (CAM.f * x) / z, CAM.cy - (CAM.f * y) / z]

/** Segmento 3D → "M x y L x y", recortado no plano próximo. `null` se ficar atrás da câmera. */
function segment(a: Vec, b: Vec): string | null {
  let p = toCamera(a)
  let q = toCamera(b)
  if (p[2] < NEAR && q[2] < NEAR) return null
  if (p[2] < NEAR) [p, q] = [q, p]
  if (q[2] < NEAR) {
    const t = (p[2] - NEAR) / (p[2] - q[2])
    q = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, NEAR]
  }
  const [x1, y1] = toScreen(p)
  const [x2, y2] = toScreen(q)
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`
}

// --- Chão em grade ---------------------------------------------------------------------
const GRID: string[] = []
for (let x = -14; x <= 14; x++) GRID.push(segment([x, 0, -2.6], [x, 0, 44])!)
for (let z = -2; z <= 44; z += z < 14 ? 1 : 2) GRID.push(segment([-14, 0, z], [14, 0, z])!)

// --- Estruturas em wireframe: x, z (canto), largura, profundidade, altura -----------------
const BOXES: [number, number, number, number, number][] = [
  [-2.7, 7, 2.2, 1.8, 1.7],
  [1.7, 8, 1.4, 1.4, 3.1], // ← a estrutura marcada como "detectada"
  [-0.9, 14, 2.4, 2, 2.2],
  [5, 16, 1.8, 1.8, 4.8],
  [-5.4, 18, 3, 2.4, 3],
  [1.2, 26, 2.2, 2.2, 5.8],
]

function boxEdges([x, z, w, d, h]: (typeof BOXES)[number]): string[] {
  const corners: Vec[] = [
    [x, 0, z],
    [x + w, 0, z],
    [x + w, 0, z + d],
    [x, 0, z + d],
  ]
  const edges: string[] = []
  corners.forEach((c, i) => {
    const n = corners[(i + 1) % 4]
    edges.push(segment(c, n)!, segment([c[0], h, c[2]], [n[0], h, n[2]])!, segment(c, [c[0], h, c[2]])!)
  })
  return edges
}

const STRUCTURES = BOXES.flatMap(boxEdges)

// --- Marcador de detecção em torno da segunda estrutura --------------------------------------
const [TX, TZ, TW, , TH] = BOXES[1]
const [tl, tt] = toScreen(toCamera([TX, TH, TZ]))
const [tr, tb] = toScreen(toCamera([TX + TW, 0, TZ]))
const TARGET = { x: tl - 12, y: tt - 12, w: tr - tl + 30, h: tb - tt + 24 }

// --- Robô: posição e escala vêm da mesma projeção ---------------------------------------------
const ROBOT_WORLD: Vec = [0.15, 0, 0]
const robotCam = toCamera(ROBOT_WORLD)
const [RX, RY] = toScreen(robotCam)
/** O desenho do robô tem 200 unidades de comprimento ≈ 0,95 m. */
const ROBOT_SCALE = ((CAM.f / robotCam[2]) * 0.95) / 200
/** Sensor na cabeça (coordenadas do desenho) → tela: origem do leque de varredura. */
const EYE = { x: RX + (196 - 100) * ROBOT_SCALE, y: RY + (56 - 148) * ROBOT_SCALE }

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` })

export function HeroScene() {
  const corner = 14
  const { x, y, w, h } = TARGET

  return (
    <svg
      className="scene"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label="Desenho a traço de um robô quadrúpede supervisionando um ambiente virtual em grade"
    >
      <defs>
        {/* As linhas do chão somem em direção ao horizonte e às bordas. */}
        <linearGradient id="scene-depth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.47" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.66" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="scene-sides" cx="0.52" cy="0.7" r="0.66">
          <stop offset="0.45" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="scene-grid-mask">
          <rect width={W} height={H} fill="url(#scene-depth)" />
        </mask>
        <mask id="scene-vignette">
          <rect width={W} height={H} fill="url(#scene-sides)" />
        </mask>
      </defs>

      <g mask="url(#scene-vignette)">
        <g className="scene__grid" mask="url(#scene-grid-mask)">
          {GRID.map((d, i) => (
            <path key={i} d={d} pathLength={1} className="draw" style={delay(150 + i * 14)} />
          ))}
        </g>

        <g className="scene__structures">
          {STRUCTURES.map((d, i) => (
            <path key={i} d={d} pathLength={1} className="draw" style={delay(900 + i * 16)} />
          ))}
        </g>
      </g>

      {/* Leque de varredura: sai do sensor do robô em direção às estruturas. */}
      <g className="scene__scan" style={delay(2900)}>
        <path d={`M${EYE.x} ${EYE.y}L${x} ${y + h}M${EYE.x} ${EYE.y}L${x + w + 40} ${y + 10}`} />
        <path className="scene__sweep" d={`M${EYE.x} ${EYE.y}L${x + w * 0.6} ${y + h * 0.35}`} style={{ transformOrigin: `${EYE.x}px ${EYE.y}px` }} />
      </g>

      {/* Marcador de detecção */}
      <g className="scene__target" style={delay(3300)}>
        <path
          d={`M${x} ${y + corner}V${y}H${x + corner}M${x + w - corner} ${y}H${x + w}V${y + corner}M${x + w} ${y + h - corner}V${y + h}H${x + w - corner}M${x + corner} ${y + h}H${x}V${y + h - corner}`}
        />
        <circle cx={x + w + 12} cy={y + 5} r="3" />
        <text x={x + w + 21} y={y + 9}>
          setor 02 · ok
        </text>
      </g>

      {/* Robô */}
      <ellipse className="scene__shadow" cx={RX + 6} cy={RY + 3} rx={112 * ROBOT_SCALE} ry={13 * ROBOT_SCALE} style={delay(2000)} />
      <g className="scene__robot" transform={`translate(${RX} ${RY}) scale(${ROBOT_SCALE}) translate(-100 -148)`}>
        {/* pernas do lado oposto, mais claras */}
        <g className="scene__far">
          <path pathLength={1} className="draw thigh" style={delay(1900)} d="M64 66L48 102" />
          <path pathLength={1} className="draw calf" style={delay(1950)} d="M48 102L68 143" />
          <path pathLength={1} className="draw thigh" style={delay(1900)} d="M156 66L140 102" />
          <path pathLength={1} className="draw calf" style={delay(1950)} d="M140 102L160 143" />
        </g>
        {/* corpo */}
        <path pathLength={1} className="draw solid" style={delay(2050)} d="M34 40H150Q160 40 160 50V66Q160 76 150 76H34Q22 76 22 64V52Q22 40 34 40Z" />
        <path pathLength={1} className="draw solid" style={delay(2150)} d="M160 40L190 45Q198 47 198 54V64Q198 70 191 72L160 78Z" />
        <path pathLength={1} className="draw solid" style={delay(2250)} d="M140 30H166V40H140Z" />
        <path pathLength={1} className="draw" style={delay(2300)} d="M60 40V33H118V40" />
        {/* pernas do lado próximo */}
        <path pathLength={1} className="draw calf" style={delay(2400)} d="M30 110L52 146" />
        <path pathLength={1} className="draw calf" style={delay(2400)} d="M122 110L144 146" />
        <path pathLength={1} className="draw thigh" style={delay(2350)} d="M48 72L30 110" />
        <path pathLength={1} className="draw thigh" style={delay(2350)} d="M140 72L122 110" />
        <circle className="scene__foot" style={delay(2700)} cx="52" cy="146" r="5.5" />
        <circle className="scene__foot" style={delay(2700)} cx="144" cy="146" r="5.5" />
        <circle pathLength={1} className="draw solid" style={delay(2450)} cx="48" cy="72" r="12" />
        <circle pathLength={1} className="draw solid" style={delay(2500)} cx="140" cy="72" r="12" />
        <circle pathLength={1} className="draw solid" style={delay(2550)} cx="30" cy="110" r="6" />
        <circle pathLength={1} className="draw solid" style={delay(2550)} cx="122" cy="110" r="6" />
        {/* sensor */}
        <path className="scene__eye" style={delay(2800)} d="M196 52V62" />
      </g>
    </svg>
  )
}
