// Fetches Artemis II + Moon ephemerides from JPL Horizons and writes both the
// raw API responses and a parsed TrajectoryData JSON into data/ at the repo root.
//
// Keep the constants here in sync with src/data/horizons.ts — both files parse
// the same Horizons response format, just in different runtimes (Node vs browser).
//
// Run: `pnpm fetch-data` (or `node scripts/fetch-trajectory.mjs`)

import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')

const BASE_URL = 'https://ssd.jpl.nasa.gov/api/horizons.api'

// JD 2461132.5833 = 2026-Apr-02 02:00 UTC (after ICPS separation)
// JD 2461141.4    = 2026-Apr-10 21:36 UTC (safely before data ends at 23:54 TDB)
const MISSION_START = 'JD2461132.5833'
const MISSION_END = 'JD2461141.4'
const STEP_SIZE = '5m'

const BODIES = [
  { command: '-1024', label: 'Orion spacecraft', slug: 'spacecraft' },
  { command: '301',   label: 'Moon',             slug: 'moon' },
]

function jdToUnixMs(jd) {
  return (jd - 2440587.5) * 86400 * 1000
}

function parseHorizonsResult(result) {
  const soeIdx = result.indexOf('$$SOE')
  const eoeIdx = result.indexOf('$$EOE')
  if (soeIdx === -1 || eoeIdx === -1) {
    throw new Error('No ephemeris data found in Horizons response')
  }

  const lines = result
    .slice(soeIdx + 5, eoeIdx)
    .trim()
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  const numRe = /([-+]?\d+\.?\d*[Ee]?[-+]?\d*)/
  const vectors = []
  let i = 0

  while (i < lines.length) {
    const timeLine = lines[i]
    if (!timeLine || timeLine.startsWith('$$')) { i++; continue }

    const jdMatch = timeLine.match(/^(\d+\.\d+)/)
    if (!jdMatch) { i++; continue }

    const jd = parseFloat(jdMatch[1])
    const posLine = lines[i + 1] ?? ''
    const velLine = lines[i + 2] ?? ''

    const xm  = posLine.match(new RegExp('X\\s*=\\s*' + numRe.source))
    const ym  = posLine.match(new RegExp('Y\\s*=\\s*' + numRe.source))
    const zm  = posLine.match(new RegExp('Z\\s*=\\s*' + numRe.source))
    const vxm = velLine.match(new RegExp('VX=\\s*' + numRe.source))
    const vym = velLine.match(new RegExp('VY=\\s*' + numRe.source))
    const vzm = velLine.match(new RegExp('VZ=\\s*' + numRe.source))

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

async function fetchHorizons(command, label) {
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

  console.log(`→ Fetching ${label} (command=${command}, step=${STEP_SIZE})...`)
  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) throw new Error(`Horizons API error ${res.status} for ${label}`)
  const json = await res.json()
  if (json.error) throw new Error(`Horizons error for ${label}: ${json.error}`)
  return json
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true })

  const results = await Promise.all(
    BODIES.map(b => fetchHorizons(b.command, b.label).then(raw => ({ ...b, raw })))
  )

  const parsed = {}
  for (const { slug, label, raw } of results) {
    const rawPath = join(DATA_DIR, `horizons-${slug}.raw.json`)
    await writeFile(rawPath, JSON.stringify(raw, null, 2))
    const vectors = parseHorizonsResult(raw.result)
    parsed[slug] = vectors
    console.log(`  ✓ ${label}: ${vectors.length} state vectors → ${rawPath}`)
  }

  const trajectory = {
    spacecraft: parsed.spacecraft,
    moon: parsed.moon,
    missionStart: parsed.spacecraft[0].time,
    missionEnd: parsed.spacecraft[parsed.spacecraft.length - 1].time,
    meta: {
      fetchedAt: new Date().toISOString(),
      missionStartJD: MISSION_START,
      missionEndJD: MISSION_END,
      stepSize: STEP_SIZE,
      frame: 'J2000 Earth-centered (500@399)',
      units: 'km, km/s',
    },
  }

  const outPath = join(DATA_DIR, 'trajectory.json')
  await writeFile(outPath, JSON.stringify(trajectory))
  console.log(`→ Wrote ${outPath} (${trajectory.spacecraft.length + trajectory.moon.length} total vectors)`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
