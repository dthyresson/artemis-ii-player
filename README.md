# Artemis II — Mission Trajectory Visualization

[![GitHub](https://img.shields.io/badge/GitHub-dthyresson%2Fartemis--ii--player-181717?logo=github&logoColor=white)](https://github.com/dthyresson/artemis-ii-player)

An interactive 3D visualization of the Artemis II mission (April 2026), showing the Orion spacecraft's journey from Earth to the Moon and back. Trajectory data is fetched live from NASA's JPL Horizons API.

<img width="1424" height="775" alt="image" src="https://github.com/user-attachments/assets/fd87e54d-2802-40c2-88de-77feebf4c2f0" />

---

## What It Shows

- **Realistic 3D scene** — Earth and Moon rendered with NASA textures at accurate proportions and distances (1 scene unit = 1,000 km)
- **Live trajectory data** — State vectors (position + velocity) fetched from JPL Horizons for the Orion spacecraft (`-1024`) and Moon (`301`), covering April 2–10, 2026
- **Color-coded mission phases:**
  - 🔵 **Earth Orbit** — Initial orbit after launch
  - 🟠 **Trans-Lunar Coast** — Free-return trajectory toward the Moon
  - 🟣 **Lunar Flyby** — Closest approach (~6,550 km from the lunar surface)
  - 🟢 **Return to Earth** — Coast back to splashdown
- **Moon orbit path** — Dashed line showing the Moon's actual orbital track during the mission
- **Spacecraft marker** — Glowing sphere with a motion trail, color-coded to current phase
- **Telemetry panel** — Real-time position (X/Y/Z km), velocity (VX/VY/VZ km/s), speed, distance from Earth, distance from Moon, mission elapsed time (MET), and UTC timestamp
- **Star field** — 8,000 background stars

---

## How It Works

### Data Source

Trajectory data is fetched from the [JPL Horizons API](https://ssd.jpl.nasa.gov/horizons/) at runtime:

| Object             | Horizons ID | Description           |
| ------------------ | ----------- | --------------------- |
| Orion (Artemis II) | `-1024`     | Orion EM-2 spacecraft |
| Moon               | `301`       | Earth's Moon          |

Parameters: Earth-centered (`500@399`), J2000 frame, 1-hour step size, km/s units.

Data is cached in `localStorage` after the first fetch so subsequent loads are instant.

### Coordinate System

JPL Horizons returns J2000 equatorial coordinates (X = vernal equinox, Y = 90° east, Z = north celestial pole). These are mapped to Three.js (Y-up) as:

```
Three.js X = Horizons X
Three.js Y = Horizons Z  (north pole → up)
Three.js Z = −Horizons Y (right-hand rule)
```

### Phase Detection

Phases are detected dynamically from the trajectory data:

- **Earth Orbit**: distance from Earth < 100,000 km
- **Lunar Flyby**: distance from Moon < 50,000 km
- **Trans-Lunar / Return**: determined by whether the spacecraft is before or after closest lunar approach

### Rendering

- **Three.js** (WebGL) for 3D rendering with ACES filmic tone mapping
- **OrbitControls** for camera interaction
- Earth: `MeshPhongMaterial` with diffuse, specular, and normal maps
- Moon: `MeshPhongMaterial` with lunar texture
- Trajectory: `LineBasicMaterial` segments per phase
- Stars: `Points` particle system (8,000 stars)
- Atmosphere: transparent additive sphere around Earth

---

## How to Use

### Controls

| Action                | Input                                        |
| --------------------- | -------------------------------------------- |
| Rotate view           | Left-click drag                              |
| Pan                   | Right-click drag                             |
| Zoom                  | Scroll wheel                                 |
| Play / Pause          | `Space` or ▶ button                          |
| Step back 1 hour      | `←` arrow key                                |
| Step forward 1 hour   | `→` arrow key                                |
| Jump to start         | `Home` key or ⏮ button                      |
| Jump to end           | `End` key or ⏭ button                       |
| Scrub timeline        | Drag the timeline slider                     |
| Change playback speed | Speed buttons (1×, 100×, 1000×, 5000×, 10k×) |

### Playback Speed

At **1000×** (default), the full 8-day mission plays back in ~11 minutes. At **10000×** it plays in ~70 seconds.

### Telemetry Panel

The top-right panel shows live telemetry for the Orion spacecraft at the current mission time:

- **MET** — Mission Elapsed Time (days + HH:MM:SS)
- **UTC** — Current mission timestamp
- **Position** — X, Y, Z in km (Earth-centered J2000)
- **Velocity** — VX, VY, VZ in km/s
- **Speed** — Scalar speed in km/s
- **Dist Earth** — Distance from Earth center in km
- **Dist Moon** — Distance from Moon center in km

---

## Tech Stack

| Technology                                             | Purpose                 |
| ------------------------------------------------------ | ----------------------- |
| [Three.js](https://threejs.org/)                       | 3D WebGL rendering      |
| [Vite](https://vitejs.dev/)                            | Build tool & dev server |
| [TypeScript](https://www.typescriptlang.org/)          | Type-safe source code   |
| [TailwindCSS](https://tailwindcss.com/)                | UI styling              |
| [pnpm](https://pnpm.io/)                               | Package manager         |
| [JPL Horizons API](https://ssd.jpl.nasa.gov/horizons/) | Trajectory data         |

---

## Setup & Development

```bash
# Install dependencies
pnpm install

# Start dev server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

On first load, the app fetches ~214 state vectors each for Orion and the Moon from JPL Horizons (~2–5 seconds). The data is then cached in `localStorage` for instant subsequent loads.

To force a fresh data fetch, clear `localStorage` in your browser's DevTools.

---

## Mission Facts (Artemis II)

- **Launch**: April 1, 2026 at 22:35 UTC (Kennedy Space Center, LC-39B)
- **Crew**: Reid Wiseman, Victor Glover, Christina Koch, Jeremy Hansen
- **Trajectory**: Free-return (no lunar orbit insertion)
- **Lunar closest approach**: ~6,550 km from the surface (~April 6, 2026)
- **Maximum distance from Earth**: ~406,770 km
- **Splashdown**: April 10, 2026 (~23:00 UTC, Pacific Ocean)
- **Total mission duration**: ~9 days

---

## Color Scheme

NASA-inspired dark theme with mission-phase color coding:

| Color     | Meaning                 |
| --------- | ----------------------- |
| `#0B3D91` | NASA Blue (UI accents)  |
| `#FC3D21` | NASA Red (errors)       |
| `#00BFFF` | Earth Orbit phase       |
| `#FF8C00` | Trans-Lunar Coast phase |
| `#DA70D6` | Lunar Flyby phase       |
| `#00FF7F` | Return to Earth phase   |
| `#C0C0C0` | Moon orbital path       |
