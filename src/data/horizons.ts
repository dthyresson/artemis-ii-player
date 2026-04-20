import type { StateVector, TrajectoryData } from './types'

const CACHE_KEY = 'artemis2-trajectory-v7'
const BASE_URL = 'https://ssd.jpl.nasa.gov/api/horizons.api'

// Julian dates avoid the space-in-time-string parsing bug in the Horizons GET API.
// JD 2461132.5833 = 2026-Apr-02 02:00 UTC  (after ICPS separation)
// JD 2461141.4    = 2026-Apr-10 21:36 UTC  (safely before data ends at 23:54 TDB)
const MISSION_START = 'JD2461132.5833'
const MISSION_END = 'JD2461141.4'
const STEP_SIZE = '5m'

function jdToUnixMs(jd: number): number {
  return (jd - 2440587.5) * 86400 * 1000
}

function parseHorizonsResult(result: string): StateVector[] {
  const soeIdx = result.indexOf('$$SOE')
  const eoeIdx = result.indexOf('$$EOE')
  if (soeIdx === -1 || eoeIdx === -1) {
    throw new Error('No ephemeris data found in Horizons response')
  }

  const dataSection = result.slice(soeIdx + 5, eoeIdx).trim()
  const lines = dataSection.split('\n').map(l => l.trim()).filter(Boolean)

  const vectors: StateVector[] = []
  let i = 0

  while (i < lines.length) {
    const timeLine = lines[i]
    if (!timeLine || timeLine.startsWith('$$')) { i++; continue }

    const jdMatch = timeLine.match(/^(\d+\.\d+)/)
    if (!jdMatch) { i++; continue }

    const jd = parseFloat(jdMatch[1])
    const posLine = lines[i + 1] ?? ''
    const velLine = lines[i + 2] ?? ''

    const xm = posLine.match(/X\s*=\s*([-+]?\d+\.?\d*[Ee]?[-+]?\d*)/)
    const ym = posLine.match(/Y\s*=\s*([-+]?\d+\.?\d*[Ee]?[-+]?\d*)/)
    const zm = posLine.match(/Z\s*=\s*([-+]?\d+\.?\d*[Ee]?[-+]?\d*)/)
    const vxm = velLine.match(/VX=\s*([-+]?\d+\.?\d*[Ee]?[-+]?\d*)/)
    const vym = velLine.match(/VY=\s*([-+]?\d+\.?\d*[Ee]?[-+]?\d*)/)
    const vzm = velLine.match(/VZ=\s*([-+]?\d+\.?\d*[Ee]?[-+]?\d*)/)

    if (xm && ym && zm && vxm && vym && vzm) {
      vectors.push({
        jd,
        time: jdToUnixMs(jd),
        x: parseFloat(xm[1]),
        y: parseFloat(ym[1]),
        z: parseFloat(zm[1]),
        vx: parseFloat(vxm[1]),
        vy: parseFloat(vym[1]),
        vz: parseFloat(vzm[1]),
      })
      i += 4
    } else {
      i++
    }
  }

  return vectors
}

async function fetchHorizons(command: string, onProgress: (msg: string) => void): Promise<StateVector[]> {
  const params = new URLSearchParams({
    format: 'json',
    COMMAND: command,
    OBJ_DATA: 'NO',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'VECTORS',
    CENTER: '500@399',
    START_TIME: MISSION_START,
    STOP_TIME: MISSION_END,
    STEP_SIZE,
    OUT_UNITS: 'KM-S',
    VEC_TABLE: '2',
    VEC_LABELS: 'YES',
    CSV_FORMAT: 'NO',
    REF_PLANE: 'FRAME',
    REF_SYSTEM: 'J2000',
  })

  const label = command === '-1024' ? 'Orion spacecraft' : 'Moon'
  onProgress(`Fetching ${label} trajectory from JPL Horizons...`)

  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) throw new Error(`Horizons API error: ${res.status}`)

  const json = await res.json() as { result: string; error?: string }
  if (json.error) throw new Error(`Horizons error: ${json.error}`)

  const vectors = parseHorizonsResult(json.result)
  if (vectors.length === 0) throw new Error(`No data returned for ${label}`)

  onProgress(`Loaded ${vectors.length} ${label} state vectors`)
  return vectors
}

export async function loadTrajectoryData(
  onProgress: (msg: string, pct: number) => void
): Promise<TrajectoryData> {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    onProgress('Loading cached trajectory data...', 90)
    const data = JSON.parse(cached) as TrajectoryData
    onProgress('Trajectory data loaded from cache', 100)
    return data
  }

  onProgress('Connecting to JPL Horizons...', 10)

  const [spacecraft, moon] = await Promise.all([
    fetchHorizons('-1024', msg => onProgress(msg, 40)),
    fetchHorizons('301', msg => onProgress(msg, 70)),
  ])

  const data: TrajectoryData = {
    spacecraft,
    moon,
    missionStart: spacecraft[0].time,
    missionEnd: spacecraft[spacecraft.length - 1].time,
  }

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // Storage quota exceeded — ignore
  }

  onProgress('Trajectory data ready', 100)
  return data
}
