import * as THREE from 'three'
import { SPACECRAFT_RADIUS, toSceneCoords } from '../utils/constants'
import type { MissionPhase } from '../data/types'
import { PHASE_COLOR_HEX } from '../utils/constants'

export class Spacecraft {
  readonly group: THREE.Group
  private coreMesh: THREE.Mesh
  private haloMesh: THREE.Mesh
  private light: THREE.PointLight
  private trailPoints: THREE.Vector3[] = []
  private trailLine: THREE.Line
  private trailGeo: THREE.BufferGeometry

  constructor() {
    this.group = new THREE.Group()

    // Core bright sphere
    const coreGeo = new THREE.SphereGeometry(SPACECRAFT_RADIUS, 16, 16)
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat)
    this.group.add(this.coreMesh)

    // Halo glow
    const haloGeo = new THREE.SphereGeometry(SPACECRAFT_RADIUS * 2.5, 16, 16)
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
      depthWrite: false,
    })
    this.haloMesh = new THREE.Mesh(haloGeo, haloMat)
    this.group.add(this.haloMesh)

    // Point light for local illumination
    this.light = new THREE.PointLight(0xffd700, 0.5, 50)
    this.group.add(this.light)

    // Short motion trail
    this.trailGeo = new THREE.BufferGeometry()
    const trailMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    })
    this.trailLine = new THREE.Line(this.trailGeo, trailMat)
  }

  getTrailLine(): THREE.Line {
    return this.trailLine
  }

  updatePosition(x: number, y: number, z: number, phase: MissionPhase): void {
    const [sx, sy, sz] = toSceneCoords(x, y, z)
    this.group.position.set(sx, sy, sz)

    // Update halo color to match phase
    const phaseColor = PHASE_COLOR_HEX[phase]
    ;(this.haloMesh.material as THREE.MeshBasicMaterial).color.setHex(phaseColor)
    this.light.color.setHex(phaseColor)

    // Update trail
    this.trailPoints.push(new THREE.Vector3(sx, sy, sz))
    if (this.trailPoints.length > 80) this.trailPoints.shift()

    if (this.trailPoints.length >= 2) {
      this.trailGeo.setFromPoints(this.trailPoints)
    }
  }

  clearTrail(): void {
    this.trailPoints = []
    this.trailGeo.setFromPoints([])
  }
}
