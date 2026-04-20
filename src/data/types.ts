export interface StateVector {
  jd: number
  time: number
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
}

export interface TrajectoryData {
  spacecraft: StateVector[]
  moon: StateVector[]
  missionStart: number
  missionEnd: number
}

export type MissionPhase = 'earth' | 'translunar' | 'flyby' | 'return'

export interface PhaseSegment {
  phase: MissionPhase
  startIndex: number
  endIndex: number
}

export interface InterpolatedState {
  position: { x: number; y: number; z: number }
  velocity: { vx: number; vy: number; vz: number }
  speed: number
  distanceFromEarth: number
  distanceFromMoon: number
  phase: MissionPhase
  time: number
}
