import * as THREE from 'three'
import { toSceneCoords, PHASE_COLOR_HEX } from '../utils/constants'
import type { TrajectoryData, StateVector } from '../data/types'
import { getPhaseSegments, hermitePosition } from '../data/interpolate'

// Subdivisions per sample interval when drawing the curved flyby segment,
// so the hyperbolic pass renders as a visible hook instead of polyline chords.
const FLYBY_SUBDIVISIONS = 4

function densify(samples: StateVector[], subdivisions: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = []
  for (let i = 0; i < samples.length; i++) {
    const a = samples[i]
    const [ax, ay, az] = toSceneCoords(a.x, a.y, a.z)
    out.push(new THREE.Vector3(ax, ay, az))
    if (i === samples.length - 1) break
    const b = samples[i + 1]
    for (let k = 1; k < subdivisions; k++) {
      const u = k / subdivisions
      const p = hermitePosition(a, b, u)
      const [sx, sy, sz] = toSceneCoords(p.x, p.y, p.z)
      out.push(new THREE.Vector3(sx, sy, sz))
    }
  }
  return out
}

export class Trajectory {
  private lines: THREE.Line[] = []

  build(data: TrajectoryData, scene: THREE.Scene): void {
    // Remove old lines
    for (const line of this.lines) {
      scene.remove(line)
      line.geometry.dispose()
    }
    this.lines = []

    const segments = getPhaseSegments(data)

    for (const seg of segments) {
      if (seg.points.length < 2) continue

      const points = seg.phase === 'flyby'
        ? densify(seg.points, FLYBY_SUBDIVISIONS)
        : seg.points.map(sv => {
            const [sx, sy, sz] = toSceneCoords(sv.x, sv.y, sv.z)
            return new THREE.Vector3(sx, sy, sz)
          })

      const geo = new THREE.BufferGeometry().setFromPoints(points)
      const mat = new THREE.LineBasicMaterial({
        color: PHASE_COLOR_HEX[seg.phase],
        linewidth: 1,
        transparent: true,
        opacity: 0.85,
      })

      const line = new THREE.Line(geo, mat)
      this.lines.push(line)
      scene.add(line)
    }
  }
}
