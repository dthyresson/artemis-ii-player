import type { StateVector, TrajectoryData, InterpolatedState, MissionPhase } from './types'
import { detectPhase } from './phases'

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Cubic Hermite interpolation using Horizons position + velocity.
// Matches position AND velocity at both endpoints, so a gravitationally-curved
// arc between samples is reproduced almost exactly — critical for the hyperbolic
// lunar flyby where a linear chord would shortcut tens of degrees of arc.
export function hermitePosition(
  a: StateVector,
  b: StateVector,
  u: number
): { x: number; y: number; z: number } {
  const dtSec = (b.time - a.time) / 1000
  const u2 = u * u
  const u3 = u2 * u
  const h00 = 2 * u3 - 3 * u2 + 1
  const h10 = u3 - 2 * u2 + u
  const h01 = -2 * u3 + 3 * u2
  const h11 = u3 - u2
  return {
    x: h00 * a.x + h10 * dtSec * a.vx + h01 * b.x + h11 * dtSec * b.vx,
    y: h00 * a.y + h10 * dtSec * a.vy + h01 * b.y + h11 * dtSec * b.vy,
    z: h00 * a.z + h10 * dtSec * a.vz + h01 * b.z + h11 * dtSec * b.vz,
  }
}

function findBracket(vectors: StateVector[], time: number): [number, number] {
  if (time <= vectors[0].time) return [0, 0]
  if (time >= vectors[vectors.length - 1].time) {
    const last = vectors.length - 1
    return [last, last]
  }

  let lo = 0
  let hi = vectors.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (vectors[mid].time <= time) lo = mid
    else hi = mid
  }
  return [lo, hi]
}

export function interpolateSpacecraft(data: TrajectoryData, time: number): InterpolatedState {
  const { spacecraft, moon } = data
  const [lo, hi] = findBracket(spacecraft, time)

  let pos: { x: number; y: number; z: number }
  let vel: { vx: number; vy: number; vz: number }

  if (lo === hi) {
    const sv = spacecraft[lo]
    pos = { x: sv.x, y: sv.y, z: sv.z }
    vel = { vx: sv.vx, vy: sv.vy, vz: sv.vz }
  } else {
    const a = spacecraft[lo]
    const b = spacecraft[hi]
    const u = (time - a.time) / (b.time - a.time)
    pos = hermitePosition(a, b, u)
    vel = {
      vx: lerp(a.vx, b.vx, u),
      vy: lerp(a.vy, b.vy, u),
      vz: lerp(a.vz, b.vz, u),
    }
  }

  const moonPos = interpolateMoonPosition(moon, time)

  const distEarth = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2)
  const dx = pos.x - moonPos.x
  const dy = pos.y - moonPos.y
  const dz = pos.z - moonPos.z
  const distMoon = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2)
  const speed = Math.sqrt(vel.vx ** 2 + vel.vy ** 2 + vel.vz ** 2)

  const phase = detectPhase(data, time, distEarth, distMoon)

  return { position: pos, velocity: vel, speed, distanceFromEarth: distEarth, distanceFromMoon: distMoon, phase, time }
}

export function interpolateMoonPosition(moon: StateVector[], time: number): { x: number; y: number; z: number } {
  const [lo, hi] = findBracket(moon, time)
  if (lo === hi) {
    const sv = moon[lo]
    return { x: sv.x, y: sv.y, z: sv.z }
  }
  const a = moon[lo]
  const b = moon[hi]
  const u = (time - a.time) / (b.time - a.time)
  return hermitePosition(a, b, u)
}

export function getPhaseSegments(data: TrajectoryData): Array<{ phase: MissionPhase; points: StateVector[] }> {
  const segments: Array<{ phase: MissionPhase; points: StateVector[] }> = []
  let currentPhase: MissionPhase | null = null
  let currentPoints: StateVector[] = []

  const moonVectors = data.moon

  for (const sv of data.spacecraft) {
    const moonPos = interpolateMoonPosition(moonVectors, sv.time)
    const distEarth = Math.sqrt(sv.x ** 2 + sv.y ** 2 + sv.z ** 2)
    const dx = sv.x - moonPos.x
    const dy = sv.y - moonPos.y
    const dz = sv.z - moonPos.z
    const distMoon = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2)
    const phase = detectPhase(data, sv.time, distEarth, distMoon)

    if (phase !== currentPhase) {
      if (currentPhase !== null && currentPoints.length > 0) {
        // Add last point of previous segment to bridge gap
        if (currentPoints.length > 0) {
          segments.push({ phase: currentPhase, points: [...currentPoints, sv] })
        }
      }
      currentPhase = phase
      currentPoints = [sv]
    } else {
      currentPoints.push(sv)
    }
  }

  if (currentPhase !== null && currentPoints.length > 0) {
    segments.push({ phase: currentPhase, points: currentPoints })
  }

  return segments
}
