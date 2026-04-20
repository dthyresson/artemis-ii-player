import type { TrajectoryData } from './types'

const CACHE_KEY = 'artemis2-trajectory-v7'

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

  onProgress('Loading trajectory data...', 10)

  const res = await fetch('/data/trajectory.json')
  if (!res.ok) throw new Error(`Failed to load trajectory data: ${res.status}`)

  onProgress('Parsing trajectory data...', 60)
  const data = await res.json() as TrajectoryData

  if (!data.spacecraft?.length || !data.moon?.length) {
    throw new Error('Trajectory data is missing spacecraft or moon vectors')
  }

  onProgress('Trajectory data ready', 100)

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // Storage quota exceeded — ignore
  }

  return data
}
