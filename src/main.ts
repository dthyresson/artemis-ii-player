import { loadTrajectoryData } from './data/horizons'
import { interpolateSpacecraft } from './data/interpolate'
import { SceneManager } from './scene/SceneManager'
import { Player } from './ui/Player'
import { TelemetryPanel } from './ui/Telemetry'
import { LoadingScreen } from './ui/Loading'
import type { TrajectoryData } from './data/types'

async function main(): Promise<void> {
  const loading = new LoadingScreen()
  const canvas = document.getElementById('canvas') as HTMLCanvasElement

  let data: TrajectoryData

  try {
    data = await loadTrajectoryData((msg, pct) => loading.update(msg, pct))
  } catch (err) {
    loading.showError(err instanceof Error ? err.message : String(err))
    console.error('Failed to load trajectory data:', err)
    return
  }

  loading.update('Building 3D scene...', 95)

  const scene = new SceneManager(canvas)
  scene.loadTrajectory(data)

  const player = new Player(data.missionStart, data.missionEnd)
  const telemetry = new TelemetryPanel(data.missionStart)

  // When user scrubs, clear the spacecraft trail
  player.onSeekCallback(() => {
    scene.clearSpacecraftTrail()
  })

  loading.hide()

  // Animation loop
  let lastRealTime = performance.now()

  function animate(now: number): void {
    requestAnimationFrame(animate)

    const realDeltaMs = now - lastRealTime
    lastRealTime = now

    const missionTime = player.tick(now)
    const state = interpolateSpacecraft(data, missionTime)

    // Update scene
    scene.updateMoonPosition(data.moon, missionTime)
    scene.update(state, realDeltaMs, player.speed)

    // Update telemetry UI
    telemetry.update(state)

    // Render
    scene.render(realDeltaMs)
  }

  requestAnimationFrame(animate)
}

main()
