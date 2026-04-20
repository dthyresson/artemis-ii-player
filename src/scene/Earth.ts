import * as THREE from 'three'
import { EARTH_RADIUS, ATMOSPHERE_RADIUS } from '../utils/constants'

const TEXTURE_BASE = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures'

export class Earth {
  readonly group: THREE.Group
  private mesh: THREE.Mesh
  private atmosphere: THREE.Mesh

  constructor(loader: THREE.TextureLoader) {
    this.group = new THREE.Group()

    // Earth sphere
    const geo = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64)
    const mat = new THREE.MeshPhongMaterial({
      map: loader.load(`${TEXTURE_BASE}/land_ocean_ice_cloud_2048.jpg`),
      specularMap: loader.load(`${TEXTURE_BASE}/planets/earth_specular_2048.jpg`),
      normalMap: loader.load(`${TEXTURE_BASE}/planets/earth_normal_2048.jpg`),
      specular: new THREE.Color(0x333333),
      shininess: 25,
    })
    this.mesh = new THREE.Mesh(geo, mat)
    this.group.add(this.mesh)

    // Atmosphere glow
    const atmoGeo = new THREE.SphereGeometry(ATMOSPHERE_RADIUS, 64, 64)
    const atmoMat = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.FrontSide,
      depthWrite: false,
    })
    this.atmosphere = new THREE.Mesh(atmoGeo, atmoMat)
    this.group.add(this.atmosphere)

    // Outer glow halo
    const haloGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.06, 32, 32)
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x2255cc,
      transparent: true,
      opacity: 0.04,
      side: THREE.BackSide,
      depthWrite: false,
    })
    this.group.add(new THREE.Mesh(haloGeo, haloMat))
  }

  update(deltaSeconds: number): void {
    // Earth rotates once per sidereal day (86164 seconds)
    this.mesh.rotation.y += (Math.PI * 2 / 86164) * deltaSeconds
    this.atmosphere.rotation.y = this.mesh.rotation.y
  }
}
