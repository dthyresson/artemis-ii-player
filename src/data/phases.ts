import type { TrajectoryData, MissionPhase } from './types'
import { interpolateMoonPosition } from './interpolate'

// Artemis 2 mission phase boundaries (UTC timestamps)
// Launch: April 1, 2026 22:35 UTC (before our data starts)
// TLI: ~April 2, 2026 02:00 UTC (start of our data)
// Lunar closest approach: ~April 6, 2026 ~06:00 UTC
// Splashdown: April 10, 2026 ~23:00 UTC

const LUNAR_FLYBY_DISTANCE_KM = 20_000 // within 20,000 km = flyby phase (closest approach ~10,500 km)
const EARTH_ORBIT_DISTANCE_KM = 100_000 // within 100,000 km = earth orbit phase

let _closestApproachTime: number | null = null

function findClosestApproachTime(data: TrajectoryData): number {
  if (_closestApproachTime !== null) return _closestApproachTime

  let minDist = Infinity
  let minTime = data.missionStart

  for (const sv of data.spacecraft) {
    const moonPos = interpolateMoonPosition(data.moon, sv.time)
    const dx = sv.x - moonPos.x
    const dy = sv.y - moonPos.y
    const dz = sv.z - moonPos.z
    const dist = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2)
    if (dist < minDist) {
      minDist = dist
      minTime = sv.time
    }
  }

  _closestApproachTime = minTime
  return minTime
}

export function detectPhase(
  data: TrajectoryData,
  time: number,
  distanceFromEarth: number,
  distanceFromMoon: number
): MissionPhase {
  const closestApproachTime = findClosestApproachTime(data)

  if (distanceFromEarth < EARTH_ORBIT_DISTANCE_KM) {
    return 'earth'
  }

  if (distanceFromMoon < LUNAR_FLYBY_DISTANCE_KM) {
    return 'flyby'
  }

  if (time <= closestApproachTime) {
    return 'translunar'
  }

  return 'return'
}

export const PHASE_LABELS: Record<MissionPhase, string> = {
  earth: 'Earth Orbit',
  translunar: 'Trans-Lunar Coast',
  flyby: 'Lunar Flyby',
  return: 'Return to Earth',
}

export const PHASE_COLORS: Record<MissionPhase, string> = {
  earth: '#00BFFF',
  translunar: '#FF8C00',
  flyby: '#DA70D6',
  return: '#00FF7F',
}
