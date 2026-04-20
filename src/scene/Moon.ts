import * as THREE from 'three'
import { MOON_RADIUS, toSceneCoords } from '../utils/constants'
import type { StateVector } from '../data/types'
import { interpolateMoonPosition } from '../data/interpolate'

const TEXTURE_BASE = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures'

export class Moon {
  readonly mesh: THREE.Mesh
  private orbitLine: THREE.Line | null = null

  constructor(loader: THREE.TextureLoader) {
    const geo = new THREE.SphereGeometry(MOON_RADIUS, 48, 48)
    const mat = new THREE.MeshPhongMaterial({
      map: loader.load(`${TEXTURE_BASE}/planets/moon_1024.jpg`),
      shininess: 5,
      specular: new THREE.Color(0x111111),
    })
    this.mesh = new THREE.Mesh(geo, mat)
  }

  buildOrbitLine(moonVectors: StateVector[], scene: THREE.Scene): void {
    if (this.orbitLine) {
      scene.remove(this.orbitLine)
      this.orbitLine.geometry.dispose()
    }

    // Use actual Moon positions to draw its orbit path
    const points: THREE.Vector3[] = []
    for (const sv of moonVectors) {
      const [sx, sy, sz] = toSceneCoords(sv.x, sv.y, sv.z)
      points.push(new THREE.Vector3(sx, sy, sz))
    }

    // Close the orbit by estimating a full ellipse from the data
    // We'll draw the actual path plus extrapolate to close it
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineDashedMaterial({
      color: 0xc0c0c0,
      dashSize: 3,
      gapSize: 2,
      opacity: 0.4,
      transparent: true,
    })
    this.orbitLine = new THREE.Line(geo, mat)
    this.orbitLine.computeLineDistances()
    scene.add(this.orbitLine)
  }

  updatePosition(moonVectors: StateVector[], time: number): void {
    const pos = interpolateMoonPosition(moonVectors, time)
    const [sx, sy, sz] = toSceneCoords(pos.x, pos.y, pos.z)
    this.mesh.position.set(sx, sy, sz)
    // Moon's slow rotation (synchronous — same face toward Earth)
    this.mesh.rotation.y += 0.0001
  }
}
