import type { InterpolatedState } from '../data/types'
import { PHASE_LABELS } from '../data/phases'

function fmt(n: number, decimals = 1): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatMET(missionStartMs: number, currentMs: number): string {
  const elapsed = Math.max(0, currentMs - missionStartMs)
  const totalSec = Math.floor(elapsed / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  return `${days}d ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatUTC(ms: number): string {
  return new Date(ms).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
}

export class TelemetryPanel {
  private missionStart: number

  private elMet = document.getElementById('tel-met')!
  private elUtc = document.getElementById('tel-utc')!
  private elX = document.getElementById('tel-x')!
  private elY = document.getElementById('tel-y')!
  private elZ = document.getElementById('tel-z')!
  private elVx = document.getElementById('tel-vx')!
  private elVy = document.getElementById('tel-vy')!
  private elVz = document.getElementById('tel-vz')!
  private elSpeed = document.getElementById('tel-speed')!
  private elDistEarth = document.getElementById('tel-dist-earth')!
  private elDistMoon = document.getElementById('tel-dist-moon')!
  private elPhaseBadge = document.getElementById('phase-badge')!
  private elCurrentTime = document.getElementById('current-time')!

  constructor(missionStart: number) {
    this.missionStart = missionStart
  }

  update(state: InterpolatedState): void {
    const { position: p, velocity: v, speed, distanceFromEarth, distanceFromMoon, phase, time } = state

    this.elMet.textContent = formatMET(this.missionStart, time)
    this.elUtc.textContent = formatUTC(time)

    this.elX.textContent = fmt(p.x, 0) + ' km'
    this.elY.textContent = fmt(p.y, 0) + ' km'
    this.elZ.textContent = fmt(p.z, 0) + ' km'

    this.elVx.textContent = fmt(v.vx, 3)
    this.elVy.textContent = fmt(v.vy, 3)
    this.elVz.textContent = fmt(v.vz, 3)

    this.elSpeed.textContent = fmt(speed, 2) + ' km/s'
    this.elDistEarth.textContent = fmt(distanceFromEarth, 0) + ' km'
    this.elDistMoon.textContent = fmt(distanceFromMoon, 0) + ' km'

    this.elPhaseBadge.textContent = PHASE_LABELS[phase]
    this.elPhaseBadge.dataset.phase = phase

    this.elCurrentTime.textContent = formatUTC(time)
  }
}
