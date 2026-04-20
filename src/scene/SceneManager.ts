import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Earth } from './Earth'
import { Moon } from './Moon'
import { Spacecraft } from './Spacecraft'
import { Trajectory } from './Trajectory'
import { createStars } from './Stars'
import { SUN_DIRECTION } from '../utils/constants'
import type { TrajectoryData, InterpolatedState } from '../data/types'

type FocusTarget = 'earth' | 'moon'

export class SceneManager {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private earth: Earth
  private moon: Moon
  private spacecraft: Spacecraft
  private trajectory: Trajectory
  private loader: THREE.TextureLoader
  private lastTime = 0
  private focus: FocusTarget = 'earth'
  private focusBtns: NodeListOf<HTMLElement>

  constructor(canvas: HTMLCanvasElement) {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      logarithmicDepthBuffer: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0

    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000000)

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 200000)
    this.camera.position.set(0, 80, 500)

    // Controls
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 8
    this.controls.maxDistance = 80000
    this.controls.target.set(0, 0, 0)

    // Lighting
    this.setupLighting()

    // Texture loader
    this.loader = new THREE.TextureLoader()

    // Scene objects
    this.earth = new Earth(this.loader)
    this.scene.add(this.earth.group)

    this.moon = new Moon(this.loader)
    this.scene.add(this.moon.mesh)

    this.spacecraft = new Spacecraft()
    this.scene.add(this.spacecraft.group)
    this.scene.add(this.spacecraft.getTrailLine())

    this.trajectory = new Trajectory()

    // Stars
    this.scene.add(createStars())

    // Focus toggle (Earth ↔ Moon camera target)
    this.focusBtns = document.querySelectorAll('.focus-btn')
    this.focusBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = (btn.dataset.focus ?? 'earth') as FocusTarget
        this.setFocus(target)
      })
    })

    // Resize handler
    window.addEventListener('resize', this.onResize)
  }

  private setFocus(focus: FocusTarget): void {
    if (this.focus === focus) return
    this.focus = focus
    this.focusBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.focus === focus)
    })

    // Translate camera by the same delta as the target so the user's current
    // view angle and distance are preserved across the switch.
    const newTarget = focus === 'moon'
      ? this.moon.mesh.position.clone()
      : new THREE.Vector3(0, 0, 0)
    const delta = newTarget.clone().sub(this.controls.target)
    this.controls.target.copy(newTarget)
    this.camera.position.add(delta)
  }

  private setupLighting(): void {
    // Ambient (very dim — space is dark)
    const ambient = new THREE.AmbientLight(0x111122, 0.3)
    this.scene.add(ambient)

    // Sun directional light
    const sun = new THREE.DirectionalLight(0xfff5e0, 2.5)
    sun.position.set(SUN_DIRECTION.x * 10000, SUN_DIRECTION.y * 10000, SUN_DIRECTION.z * 10000)
    this.scene.add(sun)

    // Subtle fill light from opposite side
    const fill = new THREE.DirectionalLight(0x112244, 0.15)
    fill.position.set(-SUN_DIRECTION.x * 10000, -SUN_DIRECTION.y * 10000, -SUN_DIRECTION.z * 10000)
    this.scene.add(fill)
  }

  loadTrajectory(data: TrajectoryData): void {
    this.trajectory.build(data, this.scene)
    this.moon.buildOrbitLine(data.moon, this.scene)
  }

  update(state: InterpolatedState, realDeltaMs: number, missionSpeedMultiplier: number): void {
    const simDeltaSeconds = (realDeltaMs / 1000) * missionSpeedMultiplier

    this.earth.update(simDeltaSeconds)
    this.spacecraft.updatePosition(
      state.position.x,
      state.position.y,
      state.position.z,
      state.phase
    )

    // When following the Moon, translate camera + target by the Moon's per-frame
    // motion so the Moon stays visually parked while the ship loops around it.
    if (this.focus === 'moon') {
      const moonPos = this.moon.mesh.position
      const delta = moonPos.clone().sub(this.controls.target)
      this.controls.target.add(delta)
      this.camera.position.add(delta)
    }

    this.controls.update()
  }

  updateMoonPosition(moonVectors: Parameters<Moon['updatePosition']>[0], time: number): void {
    this.moon.updatePosition(moonVectors, time)
  }

  clearSpacecraftTrail(): void {
    this.spacecraft.clearTrail()
  }

  render(realDeltaMs: number): void {
    this.lastTime += realDeltaMs
    this.renderer.render(this.scene, this.camera)
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize)
    this.renderer.dispose()
  }
}
